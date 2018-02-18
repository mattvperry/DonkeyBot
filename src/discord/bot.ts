import { Robot, Response } from 'hubot';
import * as Discord from 'discord.js'

import { Player } from './player';

export class DiscordBot {
    private readonly name = "Donkeybot";
    private readonly timeMap: { [name: string]: number | undefined } = {};
    private readonly player: Player;
    private textChannels!: Map<string, Discord.TextChannel>;
    private voiceChannels!: Map<string, Discord.VoiceChannel>;

    constructor(private robot: Robot, private client: Discord.Client) {
        this.player = new Player();
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

        await this.player.join(games);

        this.player.on('play', async title => {
            const channel = this.textChannels.get('general');
            if (!channel) {
                return;
            }

            await channel.send(`Now playing: ${title}`);
        });

        this.robot.respond(/play( me)? ([^\s]*)$/, async resp => {
            const sent = await this.getChannel(resp).send('Loading...');
            const msg = Array.isArray(sent) ? sent[0] : sent;

            try {
                const info = await this.player.add(resp.match[2])
                await msg.edit(`Queued: ${info.title}`);
            } catch (e) {
                await msg.edit(`Failed to queue: ${resp.match[2]}`);
            }
        });

        this.robot.respond(/volume( me)? (\d*)$/, async resp => {
            const volume = +resp.match[2];
            if (volume > 200 || volume < 0) {
                return await this.flashError(resp, 'Volume out of range!');
            }

            this.player.volume(+resp.match[2]);
            resp.reply(`Volume set to ${volume}`);
        });

        this.robot.respond(/skip( me)?$/, async resp => {
            if (this.player.queue.length === 0) {
                return await this.flashError(resp, 'Nothing to skip');
            }

            this.player.skip();
            resp.reply('Skipped current song.');
        });

        this.robot.respond(/queue( me)?$/, async resp => {
            const list = this.player.queue.map(
                (info, index) => `${index === 0 ? 'Now playing' : index + 1}) ${info.title}`
            );

            if (list.length === 0) {
                resp.send('Queue is currently empty.');
            } else {
                await this.getChannel(resp).send(list.join('\n'), {
                    code: true
                });
            }
        });

        this.robot.respond(/pause( me)?$/, resp => {
            this.player.pause();
            resp.reply('Playback paused.');
        });

        this.robot.respond(/resume( me)?$/, resp => {
            this.player.resume();
            resp.reply('Playback resumed.');
        });

        this.robot.respond(/clear( me)?$/, resp => {
            this.player.clear();
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
        type: 'dm' | 'group' | 'text' | 'voice' | 'category'
    ): Map<string, T> => {
        const channels = <T[]>this.client.channels.findAll('type', type);
        return new Map(channels.map<[string, T]>(c => [c.name, c]));
    }

    private flashError = async (response: Response, error: string) => {
        const sent = await this.getChannel(response).send(error);
        const msg = Array.isArray(sent) ? sent[0] : sent;
        await msg.delete(5000);
    };

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

        return <Discord.TextChannel>channel;
    };
}
