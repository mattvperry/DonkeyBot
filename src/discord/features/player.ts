import { VoiceChannel, VoiceConnection } from 'discord.js';
import { EventEmitter } from 'events';
import urlRegex from 'url-regex';
import { promisify } from 'util';
import YoutubeDL from 'youtube-dl';
import { inject, injectable } from 'inversify';

import { ChannelManagerTag } from '../tags';
import { ChannelManager } from '../channelManager';

export declare interface Player {
    on(event: 'play', listener: (info: YoutubeDL.VideoInfo) => void): this;
    on(event: 'end', listener: () => void): this;
}

export class Player extends EventEmitter {
    public readonly queue: YoutubeDL.VideoInfo[] = [];

    private connection?: VoiceConnection;
    private currentVolume = 50;

    constructor(private voiceChannel: VoiceChannel) {
        super();
    }

    public get time() {
        return this.connection?.dispatcher?.streamTime ?? 0;
    }

    public async add(search: string) {
        if (!urlRegex({ exact: true }).test(search)) {
            search = `ytsearch1:${search}`;
        }

        const info = await this.getInfo(search, []);
        this.queue.push(info);
        if (this.queue.length === 1) {
            this.connection = await this.voiceChannel.join();
            this.connection.on('error', () => this.clear());
            this.executeQueue();
        }

        return info;
    }

    public skip() {
        if (this.connection?.dispatcher.paused) {
            this.connection.dispatcher.resume();
        }

        this.connection?.dispatcher.end();
    }

    public clear() {
        this.queue.length = 0;
        this.end();
    }

    public volume(volume: number) {
        if (!this.connection) {
            return;
        }

        this.currentVolume = volume;
        this.connection.dispatcher.setVolume(volume / 100);
    }

    public pause() {
        if (!this.connection || this.connection.dispatcher.paused) {
            return;
        }

        this.connection.dispatcher.pause();
    }

    public resume() {
        if (!this.connection || !this.connection.dispatcher.paused) {
            return;
        }

        this.connection.dispatcher.resume();
    }

    private async executeQueue() {
        if (this.queue.length === 0) {
            this.end();
            return;
        }

        const video = this.queue[0];
        this.emit('play', video);

        try {
            await this.play(YoutubeDL(video.url));
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            console.log(e);
        }

        this.queue.shift();
        this.executeQueue();
    }

    private play(stream: ReturnType<typeof YoutubeDL>) {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                reject();
                return;
            }

            const dispatcher = this.connection.play(stream, {
                seek: 0,
                volume: this.currentVolume / 100,
            });

            dispatcher.on('error', reject);
            dispatcher.on('end', resolve);
        });
    }

    private end() {
        this.connection?.dispatcher?.end();
        this.connection?.disconnect();
        this.voiceChannel.leave();
        this.emit('end');
    }

    private getInfo = (url: string, args: string[], opts?: any) =>
        promisify<string, string[], any, YoutubeDL.VideoInfo>(YoutubeDL.getInfo)(url, args, opts);
}

@injectable()
export class PlayerFactory {
    constructor(@inject(ChannelManagerTag) private channels: ChannelManager) {}

    public createPlayer(channel: string): Player | undefined {
        const games = this.channels.fetchByName(channel, 'voice');
        return games && new Player(games);
    }
}
