import { MessageOptions, MessageAdditions, Message, TextChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import ChannelManager from './channelManager';
import { ChannelManagerTag } from './tags';

export class Responder {
    constructor(private userId: string, private channel: TextChannel) {}

    public send(content: string | string[], options?: MessageOptions | MessageAdditions): Promise<Message> {
        return this.channel.send(content, options);
    }

    public reply(content: string | string[], options?: MessageOptions | MessageAdditions): Promise<Message> {
        if (!Array.isArray(content)) {
            return this.send(this.prependMention(content), options);
        }

        const [first, ...rest] = content;
        return this.send([this.prependMention(first), ...rest], options);
    }

    public async operation<T>(
        op: () => Promise<T>,
        success: (ret: T) => string,
        error: (e: Error) => string,
        loading = 'Loading...',
    ): Promise<void> {
        const msg = await this.send(loading);
        try {
            const ret = await op();
            await msg.edit(success(ret));
        } catch (e) {
            await msg.edit(error(e));
        }
    }

    public flashMessage = async (text: string) => {
        const msg = await this.send(text);
        await msg.delete({ timeout: 2500 });
    };

    private prependMention = (text: string) => {
        return `<@${this.userId}> ${text}`;
    };
}

@injectable()
export class ResponderFactory {
    constructor(@inject(ChannelManagerTag) private channels: ChannelManager) {}

    public async createForRoom(userId: string, channelId?: string): Promise<Responder> {
        if (!channelId) {
            throw new Error('Undefined room id');
        }

        const channel = await this.channels.fetchById(channelId, 'text');
        return new Responder(userId, channel);
    }
}
