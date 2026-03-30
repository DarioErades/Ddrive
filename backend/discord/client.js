"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordClient = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class DiscordClient {
    static client;
    static channelId = process.env.DISCORD_CHANNEL_ID || '';
    static async init() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent
            ]
        });
        await this.client.login(process.env.DISCORD_TOKEN);
        console.log('Discord Client Logged In');
    }
    static async uploadChunk(data, filename) {
        const channel = await this.client.channels.fetch(this.channelId);
        const attachment = new discord_js_1.AttachmentBuilder(data, { name: filename });
        const message = await channel.send({ files: [attachment] });
        return message.id;
    }
    static async downloadChunk(messageId) {
        const channel = await this.client.channels.fetch(this.channelId);
        const message = await channel.messages.fetch(messageId);
        const attachment = message.attachments.first();
        if (!attachment)
            throw new Error('Attachment not found');
        const response = await fetch(attachment.url);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
exports.DiscordClient = DiscordClient;
//# sourceMappingURL=client.js.map