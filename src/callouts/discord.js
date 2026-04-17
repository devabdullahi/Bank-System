import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

export default class DiscordCallout {
  constructor(token, channelId) {
    this.token = token;
    this.channelId = channelId;
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.ready = false;
  }

  async connect() {
    if (!this.token || !this.channelId) return;
    await this.client.login(this.token);
    this.ready = true;
  }

  async send(signal) {
    if (!this.ready) return;

    const channel = await this.client.channels.fetch(this.channelId);
    if (!channel) return;

    const color = signal.type === 'BUY' ? 0x00ff00 : 0xff0000;
    const embed = new EmbedBuilder()
      .setTitle(`${signal.type} Signal — ${signal.symbol}`)
      .setColor(color)
      .addFields(
        { name: 'Strategy', value: signal.strategy, inline: true },
        { name: 'Price', value: `$${signal.price}`, inline: true },
        { name: 'Strength', value: `${signal.strength}/100`, inline: true },
        { name: 'Reason', value: signal.reason },
      )
      .setTimestamp(signal.timestamp);

    await channel.send({ embeds: [embed] });
  }

  async disconnect() {
    if (this.ready) {
      this.client.destroy();
      this.ready = false;
    }
  }
}
