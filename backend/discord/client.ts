import { Client, GatewayIntentBits, AttachmentBuilder, TextChannel } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export class DiscordClient {
    private static client: Client;
    private static channelId: string = process.env.DISCORD_CHANNEL_ID || '';
    
    // Rate limit state
    public static isLimited: boolean = false;
    public static retryAfter: number = 0;
    public static lastRateLimit: number = 0;

    static async init() {
        this.client = new Client({ 
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ] 
        });

        // Professional Rate Limit Handling
        this.client.rest.on('rateLimit', (rateLimitData) => {
            console.warn('Discord Rate Limit Hit:', rateLimitData);
            this.isLimited = true;
            this.retryAfter = rateLimitData.retryAfter;
            this.lastRateLimit = Date.now();
            
            // Auto reset after timeout
            setTimeout(() => {
                this.isLimited = false;
                this.retryAfter = 0;
            }, rateLimitData.retryAfter);
        });

        await this.client.login(process.env.DISCORD_TOKEN);
        console.log('Discord Client Logged In');
    }

    static getStatus() {
        return {
            isLimited: this.isLimited,
            retryAfter: this.retryAfter,
            lastRateLimit: this.lastRateLimit
        };
    }

    static async uploadChunk(data: Buffer, filename: string): Promise<string> {
        const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
        const attachment = new AttachmentBuilder(data, { name: filename });
        const message = await channel.send({ files: [attachment] });
        return message.id;
    }

    static async downloadChunk(messageId: string): Promise<Buffer> {
        const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
        const message = await channel.messages.fetch(messageId);
        const attachment = message.attachments.first();
        if (!attachment) throw new Error('Attachment not found');
        
        const response = await fetch(attachment.url);
        if (!response.ok) {
            throw new Error(`Discord download failed: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
