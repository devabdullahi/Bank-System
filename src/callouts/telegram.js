import TelegramBot from 'node-telegram-bot-api';

export default class TelegramCallout {
  constructor(token, chatId) {
    this.chatId = chatId;
    this.bot = token ? new TelegramBot(token, { polling: false }) : null;
  }

  async send(signal) {
    if (!this.bot || !this.chatId) return;

    const emoji = signal.type === 'BUY' ? '🟢' : '🔴';
    const message = [
      `${emoji} *${signal.type} Signal*`,
      `*Symbol:* ${signal.symbol}`,
      `*Strategy:* ${signal.strategy}`,
      `*Price:* $${signal.price}`,
      `*Strength:* ${signal.strength}/100`,
      `*Reason:* ${signal.reason}`,
      `*Time:* ${new Date(signal.timestamp).toISOString()}`,
    ].join('\n');

    await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
  }
}
