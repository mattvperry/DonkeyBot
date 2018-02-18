import { VoiceChannel, VoiceConnection } from 'discord.js';
import { EventEmitter } from 'events';
import * as ytdl from 'ytdl-core';

export class Player extends EventEmitter {
    public readonly queue: ytdl.videoInfo[] = [];

    private connection?: VoiceConnection;
    private currentVolume = 50;

    constructor() {
        super();
    }

    public join = async (channel: VoiceChannel) => {
        this.connection = await channel.join();
    }

    public add = async (url: string) => {
        if (!ytdl.validateLink(url)) {
            throw new Error('Invalid url.');
        }

        const info = await ytdl.getInfo(url);
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
        const stream = ytdl.downloadFromInfo(video, { filter: 'audioonly' });
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
}
