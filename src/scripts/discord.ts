// Description:
//  Mumble channel announcements and music player
//
// Author:
//  Matt Perry

import { Robot } from 'hubot';
import * as Discord from 'discord.js'

interface TimeMap {
    [user: string]: number | undefined;
}

class DiscordBot {
    private readonly name = "Donkeybot";
    private readonly client: Discord.Client;
    private readonly timeMap: TimeMap = {};
    private textChannels!: Map<string, Discord.TextChannel>;
    private voiceChannels!: Map<string, Discord.VoiceChannel>;

    constructor(private robot: Robot) {
        this.client = new Discord.Client({
            fetchAllMembers: true,
            apiRequestMethod: 'burst',
            ws: {
                compress: true,
                large_threshold: 1000
            }
        });
    }

    public connect = async (token: string) => {
        this.client.on('ready', this.ready);
        this.client.on('voiceStateUpdate', this.voiceStateUpdate);
        await this.client.login(token);
    }

    private ready = async () => {
        this.textChannels = this.groupChannels('text');
        this.voiceChannels = this.groupChannels('voice');

        const games = this.voiceChannels.get('Games');
        if (games) {
            await games.join();
        }
    }

    private voiceStateUpdate = (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => {
        const games = this.voiceChannels.get('Games');
        const general = this.textChannels.get('general');
        if (!games || !general || newMember.displayName === this.name || newMember.voiceChannelID !== games.id) {
            return;
        }

        const currentTime = Date.now();
        const userTime = this.timeMap[newMember.displayName];
        if (!userTime || (currentTime - userTime) > 60000) {
            this.timeMap[newMember.displayName] = currentTime;
            general.sendMessage(`${newMember.displayName} wants to play games!`);
        }
    }

    private groupChannels = <T extends Discord.GuildChannel>(
        type: 'dm' | 'group' | 'text' | 'voice' | 'category'
    ): Map<string, T> => {
        const channels = <T[]>this.client.channels.findAll('type', type);
        return new Map(channels.map<[string, T]>(c => [c.name, c]));
    }
}

export = async (robot: Robot) => {
    if (!process.env.HUBOT_DISCORD_TOKEN) {
        return;
    }

    try {
        await (new DiscordBot(robot)).connect(process.env.HUBOT_DISCORD_TOKEN);
    } catch (e) {
        console.error(e);
    }
}
