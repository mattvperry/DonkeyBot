import { VoiceChannel, VoiceConnection } from 'discord.js';
import { inject, injectable } from 'inversify';
import urlRegex from 'url-regex';
import ytdl from 'ytdl-core-discord';
import ytsr, { Video } from 'ytsr';

import ChannelManager from '../channelManager';
import { ChannelManagerTag } from '../tags';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

type VideoInfo = (ReturnType<typeof ytdl.getInfo> extends Promise<infer T> ? T : never)['videoDetails'];

async function getUrl(search: string): Promise<string> {
    if (urlRegex({ exact: true }).test(search)) {
        return search;
    }

    const results = await ytsr(search);
    const first = results.items.find((i): i is Video => i.type === 'video');
    if (first === undefined) {
        throw new Error(`No results for ${search}`);
    }

    return first.url;
}

export declare interface Player {
    on(event: 'play', listener: (info: VideoInfo) => void): this;
    on(event: 'end', listener: () => void): this;
}

export class Player extends EventEmitter {
    public readonly queue: VideoInfo[] = [];

    private connection?: VoiceConnection;

    private currentVolume = 50;

    constructor(private voiceChannel: VoiceChannel) {
        super();
    }

    public get time(): number {
        return this.connection?.dispatcher?.streamTime ?? 0;
    }

    public async add(search: string): Promise<VideoInfo> {
        const url = await getUrl(search);
        const info = await ytdl.getInfo(url);
        this.queue.push(info.videoDetails);
        if (this.queue.length === 1) {
            this.connection = await this.voiceChannel.join();
            this.connection.on('error', () => this.clear());
            void this.executeQueue();
        }

        return info.videoDetails;
    }

    public skip(): void {
        if (this.connection?.dispatcher.paused) {
            this.connection.dispatcher.resume();
        }

        this.connection?.dispatcher.end();
    }

    public clear(): void {
        this.queue.length = 0;
        this.end();
    }

    public volume(volume: number): void {
        if (!this.connection) {
            return;
        }

        this.currentVolume = volume;
        this.connection.dispatcher.setVolume(volume / 100);
    }

    public pause(): void {
        if (!this.connection || this.connection.dispatcher.paused) {
            return;
        }

        this.connection.dispatcher.pause();
    }

    public resume(): void {
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
            const stream = await ytdl(video.video_url);
            await this.play(stream);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (e) {
            console.log(e);
        }

        this.queue.shift();
        void this.executeQueue();
    }

    private play(stream: Readable) {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                reject();
                return;
            }

            const dispatcher = this.connection.play(stream, {
                type: 'opus',
                seek: 0,
                volume: this.currentVolume / 100,
            });

            dispatcher.on('error', reject);
            dispatcher.on('finish', resolve);
        });
    }

    private end() {
        this.connection?.dispatcher?.end();
        this.connection?.disconnect();
        this.voiceChannel.leave();
        this.emit('end');
    }
}

@injectable()
export class PlayerFactory {
    constructor(@inject(ChannelManagerTag) private channels: ChannelManager) {}

    public createPlayer(channel: string): Player | undefined {
        const games = this.channels.fetchByName(channel, 'voice');
        return games && new Player(games);
    }
}
