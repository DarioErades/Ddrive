export declare class DiscordClient {
    private static client;
    private static channelId;
    static init(): Promise<void>;
    static uploadChunk(data: Buffer, filename: string): Promise<string>;
    static downloadChunk(messageId: string): Promise<Buffer>;
}
//# sourceMappingURL=client.d.ts.map