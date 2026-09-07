export interface BotCommandDefinition {
  command: string;
  description: string;
}

/** Commands visible in Telegram's native menu for a locale and role. */
export function getBotCommands(locale: string, admin: boolean): BotCommandDefinition[] {
  const persian = locale.toLowerCase().startsWith('fa');
  const commands = persian
    ? [
        { command: 'start', description: 'باز کردن منوی اصلی' },
        { command: 'help', description: 'راهنما و راهنمای امکانات' },
        { command: 'profile', description: 'مشاهده و ویرایش پروفایل' },
        { command: 'notifications', description: 'تنظیمات و ترجیحات اعلان‌ها' },
        { command: 'support', description: 'ارتباط با پشتیبانی' },
        { command: 'about', description: 'درباره ربات' },
      ]
    : [
        { command: 'start', description: 'Open the main menu' },
        { command: 'help', description: 'Help and features' },
        { command: 'profile', description: 'My profile & settings' },
        { command: 'notifications', description: 'Notification preferences' },
        { command: 'support', description: 'Contact support' },
        { command: 'about', description: 'About this bot' },
      ];

  if (admin) {
    commands.push({
      command: 'admin',
      description: persian ? 'باز کردن پنل مدیریت' : 'Open the admin panel',
    });
  }

  return commands;
}
