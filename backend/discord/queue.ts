import { DiscordClient } from './client.js';

type Task = () => Promise<any>;

export class DiscordQueue {
    private static queue: { task: Task, resolve: (val: any) => void, reject: (err: any) => void }[] = [];
    private static isProcessing: boolean = false;

    static async add<T>(task: Task): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    private static async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            // Check if we are limited
            if (DiscordClient.isLimited) {
                const waitTime = Math.max(DiscordClient.retryAfter, 1000);
                console.log(`Queue paused for ${waitTime}ms due to Discord Rate Limit`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            const item = this.queue.shift();
            if (item) {
                try {
                    const result = await item.task();
                    item.resolve(result);
                } catch (error) {
                    item.reject(error);
                }
                // Small buffer between requests
                await new Promise(r => setTimeout(r, 200));
            }
        }

        this.isProcessing = false;
    }
}
