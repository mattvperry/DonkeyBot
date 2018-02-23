import * as Discord from 'discord.js';
import { Response, Robot } from 'hubot';

import { Player } from './player';

export class DiscordBot {
    private readonly name = 'Donkeybot';
    private readonly timeMap: { [name: string]: number | undefined } = {};
    private textChannels!: Map<string, Discord.TextChannel>;
    private voiceChannels!: Map<string, Discord.VoiceChannel>;

    constructor(private robot: Robot, private client: Discord.Client) {
    }

    public connect = async () => {
        this.textChannels = this.groupChannels('text');
        this.voiceChannels = this.groupChannels('voice');

        this.client.on('voiceStateUpdate', this.voiceStateUpdate);

        await this.setupMusicPlayer();
    }

    private setupMusicPlayer = async () => {
        const games = this.voiceChannels.get('Games');
        if (!games) {
            return;
        }

        const player = new Player(games);

        player.on('play', async info => {
            await this.client.user.setActivity(info.title, {
                type: 'LISTENING',
                url: info.webpage_url,
            });
        });

        player.on('end', async () => {
            await this.client.user.setActivity('nothing', {
                type: 'LISTENING',
            });
        });

        this.robot.respond(/play( me)? (.*)$/i, async resp => {
            const sent = await this.getChannel(resp).send('Loading...');
            const msg = Array.isArray(sent) ? sent[0] : sent;

            try {
                const info = await player.add(resp.match[2]);
                await msg.edit(`Queued: ${info.title}`);
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
            const formatSeconds = (seconds: number) => (
                new Date(seconds * 1000).toISOString().substr(11, 8).replace(/^[0:]+/, '')
            );

            const list = player.queue.map((info, index) => {
                const duration = formatSeconds(info.duration);
                const time = `${index === 0 ? `${formatSeconds(player.time)}/` : ''}${duration}`;
                return `${index + 1}. ${info.title} [${time}]`;
            });

            if (list.length === 0) {
                resp.send('Queue is currently empty.');
            } else {
                await this.getChannel(resp).send(list.join('\n'), {
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

    private voiceStateUpdate = (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => {
        const games = this.voiceChannels.get('Games');
        const general = this.textChannels.get('general');
        if (!games
            || !general
            || newMember.displayName === this.name
            || newMember.voiceChannelID !== games.id
            || newMember.voiceChannelID === oldMember.voiceChannelID) {
            return;
        }

        const currentTime = Date.now();
        const userTime = this.timeMap[newMember.displayName];
        if (!userTime || (currentTime - userTime) > 60000) {
            this.timeMap[newMember.displayName] = currentTime;
            general.send(`${newMember.displayName} wants to play games!`);
        }
    }

    private groupChannels = <T extends Discord.GuildChannel>(
        type: 'dm' | 'group' | 'text' | 'voice' | 'category',
    ): Map<string, T> => {
        const channels = this.client.channels.findAll('type', type) as T[];
        return new Map(channels.map<[string, T]>(c => [c.name, c]));
    }

    private flashError = async (response: Response, error: string) => {
        const sent = await this.getChannel(response).send(error);
        const msg = Array.isArray(sent) ? sent[0] : sent;
        await msg.delete(2500);
    }

    private getChannel = (response: Response): Discord.TextChannel => {
        // @ts-ignore until typings are fixed...
        const room: string | undefined = response.message.user.room;
        if (!room) {
            throw new Error('Undefined room id');
        }

        const channel = this.client.channels.get(room);
        if (!channel || channel.type !== 'text') {
            throw new Error('Text channel not found');
        }

        return channel as Discord.TextChannel;
    }
}
