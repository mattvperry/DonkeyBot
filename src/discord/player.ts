import { VoiceChannel, VoiceConnection } from 'discord.js';
import { EventEmitter } from 'events';
import urlRegex from 'url-regex';
import { promisify } from 'util';
import YoutubeDL from 'youtube-dl';

export class Player extends EventEmitter {
    public readonly queue: YoutubeDL.VideoInfo[] = [];

    private connection?: VoiceConnection;
    private currentVolume = 50;

    constructor() {
        super();
    }

    public join = async (channel: VoiceChannel) => {
        this.connection = await channel.join();
    }

    public add = async (search: string) => {
        if (!urlRegex({ exact: true }).test(search)) {
            search = `gvsearch1: ${search}`;
        }

        const info = await this.getInfo(search, []);
        this.queue.push(info);
        if (this.queue.length === 1) {
            this.executeQueue();
        }

        return info;
    }

    public skip = () => {
        if (!this.connection) {
            return;
        }

        if (this.connection.dispatcher.paused) {
            this.connection.dispatcher.resume();
        }

        this.connection.dispatcher.end();
    }

    public clear = () => {
        this.queue.length = 0;
        if (!this.connection) {
            return;
        }

        this.connection.dispatcher.end();
    }

    public volume = (volume: number) => {
        if (!this.connection) {
            return;
        }

        this.currentVolume = volume;
        this.connection.dispatcher.setVolume(volume / 100);
    }

    public pause = () => {
        if (!this.connection || this.connection.dispatcher.paused) {
            return;
        }

        this.connection.dispatcher.pause();
    }

    public resume = () => {
        if (!this.connection || !this.connection.dispatcher.paused) {
            return;
        }

        this.connection.dispatcher.resume();
    }

    private executeQueue = () => {
        if (!this.connection || this.queue.length === 0) {
            return;
        }

        const video = this.queue[0];
        this.emit('play', video.title);
        const stream = YoutubeDL(video.url);
        const dispatcher = this.connection.playStream(stream, {
            seek: 0,
            volume: this.currentVolume / 100,
        });

        const next = () => {
            this.queue.shift();
            this.executeQueue();
        };

        this.connection.on('error', error => {
            console.log(error);
            next();
        });

        dispatcher.on('error', error => {
            console.log(error);
            next();
        });

        dispatcher.on('end', () => setTimeout(() => {
            if (this.queue.length > 0) {
                next();
            }
        }, 1000));
    }

    private getInfo = (url: string, args: string[], opts?: any) => (
        promisify<string, string[], any, YoutubeDL.VideoInfo>(YoutubeDL.getInfo)(url, args, opts)
    )
}
