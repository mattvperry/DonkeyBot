import * as Discord from 'discord.js';
import { Response, Robot } from 'hubot';
import { duration } from 'moment';

import { Player } from './player';

type ChannelType = Discord.Channel['type'];
type NamedChannelType = Exclude<ChannelType, 'dm' | 'unknown'>;
type Channel<T extends ChannelType>
    = T extends 'dm' ? Discord.DMChannel
    : T extends 'text' ? Discord.TextChannel
    : T extends 'voice' ? Discord.VoiceChannel
    : T extends 'category' ? Discord.CategoryChannel
    : T extends 'news' ? Discord.NewsChannel
    : T extends 'store' ? Discord.StoreChannel
    : T extends 'unknown' ? Discord.Channel
    : never;

export class DiscordBot {
    private readonly name = 'Donkeybot';
    private readonly timeMap: Record<string, number | undefined> = {};

    constructor(private robot: Robot, private client: Discord.Client) {
    }

    public connect = async () => {
        this.client.on('voiceStateUpdate', this.voiceStateUpdate);

        await this.setupMusicPlayer();
    }

    private setupMusicPlayer = async () => {
        const games = this.getChannelByName('Games', 'voice');
        if (!games) {
            return;
        }

        const player = new Player(games);

        player.on('play', async info => {
            if (!this.client.user) {
                return;
            }
            await this.client.user.setActivity(info.title, {
                type: 'LISTENING',
                url: info.webpage_url,
            });
        });

        player.on('end', async () => {
            if (!this.client.user) {
                return;
            }
            await this.client.user.setActivity('nothing', {
                type: 'LISTENING',
            });
        });

        this.robot.respond(/play( me)? (.*)$/i, async resp => {
            const channel = await this.getResponseChannel(resp);
            const sent = await channel.send('Loading...');
            const msg = Array.isArray(sent) ? sent[0] : sent;

            try {
                const info = await player.add(resp.match[2]);
                await msg.edit(`Queued: ${info.title} [${info.webpage_url}]`);
            } catch (e) {
                await msg.edit(`Failed to queue: ${resp.match[2]}`);
            }
        });

        this.robot.respond(/volume( me)? (\d*)$/i, async resp => {
            const volume = +resp.match[2];
            if (volume > 200 || volume < 0) {
                return await this.flashError(resp, 'Volume out of range!');
            }

            player.volume(+resp.match[2]);
            resp.reply(`Volume set to ${volume}`);
        });

        this.robot.respond(/skip( me)?$/i, async resp => {
            if (player.queue.length === 0) {
                return await this.flashError(resp, 'Nothing to skip');
            }

            player.skip();
            resp.reply('Skipped current song.');
        });

        this.robot.respond(/queue( me)?$/i, async resp => {
            const formatMS = (ms: number) => duration(ms).format('h:mm:ss', {
                forceLength: true,
                stopTrim: 'm',
            });

            const list = player.queue.map(({ title, _duration_raw }, index) => {
                const time = formatMS(player.time);
                const length = formatMS(_duration_raw * 1000);
                return `${index + 1}. ${title} [${index === 0 ? `${time}/` : ''}${length}]`;
            });

            if (list.length === 0) {
                resp.send('Queue is currently empty.');
            } else {
                const channel = await this.getResponseChannel(resp);
                await channel.send(list.join('\n'), {
                    code: true,
                });
            }
        });

        this.robot.respond(/pause( me)?$/i, resp => {
            player.pause();
            resp.reply('Playback paused.');
        });

        this.robot.respond(/resume( me)?$/i, resp => {
            player.resume();
            resp.reply('Playback resumed.');
        });

        this.robot.respond(/clear( me)?$/i, resp => {
            player.clear();
            resp.reply('Queue cleared!');
        });
    }

    private voiceStateUpdate = (oldState: Discord.VoiceState | undefined, newState: Discord.VoiceState) => {
        const games = this.getChannelByName('Games', 'voice');
        const general = this.getChannelByName('general', 'text');
        if (!games
            || !general
            || !newState.member
            || !newState.channel
            || newState.member.displayName === this.name
            || newState.channel.id !== games.id
            || (oldState && oldState.channel && newState.channel.id === oldState.channel.id)) {
            return;
        }

        const currentTime = Date.now();
        const userTime = this.timeMap[newState.member.displayName];
        if (!userTime || (currentTime - userTime) > 60000) {
            this.timeMap[newState.member.displayName] = currentTime;
            general.send(`${newState.member.displayName} wants to play games!`);
        }
    }

    private flashError = async (response: Response, error: string) => {
        const channel = await this.getResponseChannel(response);
        const sent = await channel.send(error);
        const msg = Array.isArray(sent) ? sent[0] : sent;
        await msg.delete({ timeout: 2500 });
    }

    private getChannelByName = <T extends NamedChannelType>(name: string, type: T): Channel<T> | undefined => {
        return this.client.channels.cache
            .array()
            .filter(this.channelIsType(type))
            .find(c => c.name === name);
    }

    private getResponseChannel = async (response: Response): Promise<Discord.TextChannel> => {
        const room = response.message.user.room;
        if (!room) {
            throw new Error('Undefined room id');
        }

        const channel = await this.client.channels.fetch(room);
        if (!this.channelIsType('text')(channel)) {
            throw new Error('Text channel not found');
        }

        return channel;
    }

    private channelIsType = <T extends ChannelType>(type: T) =>
        (channel?: Discord.Channel | null): channel is Channel<T> => {
            return !!channel && channel.type === type;
        }
}
