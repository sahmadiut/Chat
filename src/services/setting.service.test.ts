/**
 * Setting Service — Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  insert: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
  query: {
    botSettings: {
      findFirst: vi.fn(),
    },
  },
};

const mockReturning = vi.fn();
const mockOnConflict = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflict }));
mockDb.insert.mockReturnValue({ values: mockValues });

const mockDeleteWhere = vi.fn();
mockDb.delete.mockReturnValue({ where: mockDeleteWhere });

const mockSelectFrom = vi.fn();
mockDb.select.mockReturnValue({ from: mockSelectFrom });

vi.mock('#root/database/index.js', () => ({ db: mockDb }));

const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheDel = vi.fn();

vi.mock('#root/cache/utils.js', () => ({
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheSet: (...args: unknown[]) => mockCacheSet(...args),
  cacheDel: (...args: unknown[]) => mockCacheDel(...args),
}));

vi.mock('#root/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('#root/database/schema/index.js', () => ({
  botSettings: {
    key: 'key',
    value: 'value',
    description: 'description',
    updatedAt: 'updated_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
}));

const { SettingService } = await import('#root/services/setting.service.js');

describe('SettingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict });
    mockOnConflict.mockReturnValue({ returning: mockReturning });
    mockDb.delete.mockReturnValue({ where: mockDeleteWhere });
    mockDb.select.mockReturnValue({ from: mockSelectFrom });
  });

  describe('get', () => {
    it('returns value from cache if present', async () => {
      mockCacheGet.mockResolvedValue('true');
      const val = await SettingService.get('maintenance_mode');
      expect(val).toBe('true');
      expect(mockCacheGet).toHaveBeenCalledWith('bot:settings:maintenance_mode');
      expect(mockDb.query.botSettings.findFirst).not.toHaveBeenCalled();
    });

    it('queries database and populates cache on cache miss', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockDb.query.botSettings.findFirst.mockResolvedValue({
        key: 'maintenance_mode',
        value: 'true',
      });

      const val = await SettingService.get('maintenance_mode');
      expect(val).toBe('true');
      expect(mockCacheSet).toHaveBeenCalledWith('bot:settings:maintenance_mode', 'true', 300);
    });

    it('returns null if not found in db', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockDb.query.botSettings.findFirst.mockResolvedValue(undefined);

      const val = await SettingService.get('non_existent');
      expect(val).toBeNull();
    });
  });

  describe('set', () => {
    it('inserts/updates setting and invalidates cache', async () => {
      const mockRow = { key: 'maintenance_mode', value: 'true' };
      mockReturning.mockResolvedValue([mockRow]);

      const result = await SettingService.set('maintenance_mode', 'true');
      expect(result).toEqual(mockRow);
      expect(mockCacheDel).toHaveBeenCalledWith('bot:settings:maintenance_mode');
    });
  });

  describe('maintenance mode helpers', () => {
    it('isMaintenanceMode returns true when value is "true"', async () => {
      mockCacheGet.mockResolvedValue('true');
      expect(await SettingService.isMaintenanceMode()).toBe(true);
    });

    it('isMaintenanceMode returns false when value is "false" or null', async () => {
      mockCacheGet.mockResolvedValue('false');
      expect(await SettingService.isMaintenanceMode()).toBe(false);

      mockCacheGet.mockResolvedValue(null);
      mockDb.query.botSettings.findFirst.mockResolvedValue(undefined);
      expect(await SettingService.isMaintenanceMode()).toBe(false);
    });

    it('setMaintenanceMode updates setting correctly', async () => {
      mockReturning.mockResolvedValue([{ key: 'maintenance_mode', value: 'true' }]);
      await SettingService.setMaintenanceMode(true);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:settings:maintenance_mode');
    });
  });

  describe('default language helpers', () => {
    it('getDefaultLanguage returns language code when set', async () => {
      mockCacheGet.mockResolvedValue('en');
      const val = await SettingService.getDefaultLanguage();
      expect(val).toBe('en');
      expect(mockCacheGet).toHaveBeenCalledWith('bot:settings:default_language');
    });

    it('setDefaultLanguage saves setting and invalidates cache', async () => {
      mockReturning.mockResolvedValue([{ key: 'default_language', value: 'fa' }]);
      await SettingService.setDefaultLanguage('fa');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:settings:default_language');
    });
  });

  describe('custom start/help messages', () => {
    it('getCustomStartMessage fetches custom_start_message', async () => {
      mockCacheGet.mockResolvedValue('Custom welcome');
      const val = await SettingService.getCustomStartMessage();
      expect(val).toBe('Custom welcome');
    });

    it('setCustomStartMessage deletes setting when text is empty', async () => {
      mockDeleteWhere.mockResolvedValue(undefined);
      await SettingService.setCustomStartMessage('');
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('bot:settings:custom_start_message');
    });

    it('setCustomStartMessage saves setting when text is provided', async () => {
      mockReturning.mockResolvedValue([{ key: 'custom_start_message', value: 'Hello' }]);
      await SettingService.setCustomStartMessage('Hello');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
