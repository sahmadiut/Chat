import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/scripts/**', 'src/bot/bot.ts'],
    },
    // Increase timeout for integration tests
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '#root': path.resolve(__dirname, 'src'),
    },
  },
});
