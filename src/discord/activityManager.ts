import { inject, injectable } from 'inversify';
import { Client, ActivityType, Presence } from 'discord.js';
import { ClientTag } from './tags';

@injectable()
export class ActivityManager {
    constructor(@inject(ClientTag) private client: Client) {
    }

    public async setActivity(name: string, type: ActivityType, url?: string): Promise<Presence | undefined> {
        return await this.client.user?.setActivity(name, { type, url });
    }
}