import { inject, injectable } from 'inversify';
import { TextChannel, MessageOptions, MessageAdditions, Message } from 'discord.js';
import { Response } from 'hubot';

import { ChannelManager } from './channelManager';
import { ChannelManagerTag } from './tags';

@injectable()
export class Responder {
    constructor(@inject(ChannelManagerTag) private channels: ChannelManager) {
    }

    public async send(
        resp: Response,
        content: string | string[],
        options?: MessageOptions | MessageAdditions
    ): Promise<Message> {
        const channel = await this.getResponseChannel(resp);
        return await channel.send(content, options);
    }

    public flashMessage = async (response: Response, text: string) => {
        const sent = await this.send(response, text);
        const msg = Array.isArray(sent) ? sent[0] : sent;
        await msg.delete({ timeout: 2500 });
    }

    private getResponseChannel = async (response: Response): Promise<TextChannel> => {
        const room = response.message.user.room;
        if (!room) {
            throw new Error('Undefined room id');
        }

        const channel = await this.channels.fetchById(room);
        if (!this.channels.channelIsType('text')(channel)) {
            throw new Error('Text channel not found');
        }

        return channel;
    }
}