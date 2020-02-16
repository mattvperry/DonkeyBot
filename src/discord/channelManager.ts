import * as Discord from 'discord.js';
import { injectable, inject } from 'inversify';
import { ClientTag } from './tags';

type ChannelType = Discord.Channel['type'];
type NamedChannelType = Exclude<ChannelType, 'dm' | 'unknown'>;
type Channel<T extends ChannelType> = T extends 'dm'
    ? Discord.DMChannel
    : T extends 'text'
    ? Discord.TextChannel
    : T extends 'voice'
    ? Discord.VoiceChannel
    : T extends 'category'
    ? Discord.CategoryChannel
    : T extends 'news'
    ? Discord.NewsChannel
    : T extends 'store'
    ? Discord.StoreChannel
    : T extends 'unknown'
    ? Discord.Channel
    : never;

@injectable()
export class ChannelManager {
    constructor(@inject(ClientTag) private client: Discord.Client) {}

    public async fetchById<T extends ChannelType = ChannelType>(
        id: string,
        type: T,
        cache?: boolean,
    ): Promise<Channel<T>> {
        const channel = await this.client.channels.fetch(id, cache);
        if (!this.channelIsType<T>(type)(channel)) {
            throw new Error(`Channel with id ${id} and type ${type} not found.`);
        }

        return channel;
    }

    public fetchByName = <T extends NamedChannelType>(name: string, type: T): Channel<T> | undefined => {
        return this.client.channels.cache
            .array()
            .filter(this.channelIsType(type))
            .find(c => c.name === name);
    };

    public onVoiceChannelEnter(name: string, cb: (member: Discord.GuildMember) => void) {
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            const channel = this.fetchByName(name, 'voice');
            if (
                !channel ||
                !newState.member ||
                newState.member.id === this.client.user?.id ||
                newState.channel?.id !== channel.id ||
                newState.channel?.id === oldState?.channel?.id
            ) {
                return;
            }

            cb(newState.member);
        });
    }

    private channelIsType = <T extends ChannelType>(type: T) => (
        channel?: Discord.Channel | null,
    ): channel is Channel<T> => {
        return channel?.type === type;
    };
}
