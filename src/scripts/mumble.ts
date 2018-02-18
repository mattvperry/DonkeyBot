// Description:
//  Mumble channel announcements and youtube player
//
// Commands:
//  hubot who <channel> - return all users currently in the given channel
//
// Author:
//  Matt Perry

import { ConnectionOptions } from 'tls';
import { Robot } from 'hubot';
import * as youtubedl from 'youtube-dl';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import * as fs from 'fs';

class Player {
    private cmd?: FfmpegCommand;
    private output: mumble.MumbleInputStream;
    private playing: boolean;
    private gain: number;
    private queue: Queue;

    constructor(private cli: mumble.MumbleClient) {
        this.playing = false;
        this.gain = .1;
        this.queue = new Queue(1);
    }

    public add(url: string): void {
        this.queue.add(this.stream.bind(this, url));
    }

    public pause(): void {
        this.switchState(false, 'SIGSTOP');
    }

    public resume(): void {
        this.switchState(true, 'SIGCONT');
    }

    public skip(): void {
        this.switchState(false, 'SIGKILL');
    }

    public clear(): void {
        this.queue.queue = [];
        this.skip();
    }

    public volume(vol: number): void {
        let gain = vol * .01;
        if (this.playing && gain > 0 && gain <= 1) {
            this.gain = gain;
            this.output.setGain(this.gain);
        }
    }

    private switchState(newState: boolean, signal: string): void {
        if (this.playing !== newState) {
            this.cmd.kill(signal);
            this.playing = newState;
        }
    }

    private async stream(url: string): Promise<any> {
        let info = await thenify<string, string[], VideoInfo>(youtubedl.getInfo)(url, []);
        this.output = this.cli.inputStream({ gain: this.gain });
        this.cmd = ffmpeg(info.url)
            .noVideo()
            .format('s16le')
            .audioBitrate(128)
            .audioChannels(1)
            .audioFrequency(48000)
            .on('start', () => this.playing = true)
            .on('error', () => this.playing = false)
            .on('end', () => this.playing = false);
        this.cmd.pipe(this.output);

        return new Promise((resolve, reject) => {
            this.cmd.on('error', reject);
            this.cmd.on('end', resolve);
        });
    }
}

class MumbleBot {
    private name: string;
    private timeMap: { [user: string]: number };
    private player: Player;

    constructor(private robot: Robot) {
        this.name = 'DonkeyBot';
        this.timeMap = {};
    }

    public async connect(url: string, password: string): Promise<void> {
        try {
            let options = await this.getOptions();
            let cli = await thenify<string, ConnectionOptions, mumble.MumbleClient>(mumble.connect)(url, options);
            cli.authenticate(this.name, password);

            this.player = new Player(cli);
            cli.on('ready', () => this.ready(cli));
            cli.on('user-move', this.userMove.bind(this));
            cli.on('message', (msg) => {
                this.message(msg.replace(/<[^>]+>/ig, ''));
            });
            this.addResponder(cli);
        } catch (err) {
            this.robot.logger.error(err);
        }
    }

    private async getOptions(): Promise<ConnectionOptions> {
        let opts: ConnectionOptions = {};
        if (fs.existsSync('./certs')) {
            opts.key = await thenify(fs.readFile)('./certs/privatekey.pem');
            opts.cert = await thenify(fs.readFile)('./certs/cert.pem');
        }
        return opts;
    }

    private ready(cli: mumble.MumbleClient): void {
        cli.user.moveToChannel('Games');
    }

    private userMove(user: mumble.User, oldChannel: mumble.Channel, newChannel: mumble.Channel): void {
        if (newChannel.name === 'Games' && user.name !== this.name) {
            let currentTime = Date.now();
            if (!this.timeMap[user.name] || (currentTime - this.timeMap[user.name]) > 60000) {
                this.timeMap[user.name] = currentTime;
                this.robot.adapter.send({}, `${user.name} wants to play games!`);
            }
        }
    }

    private message(msg: string): void {
        let commands = [
            { regex: /^!p(ause)?$/, fn: () => this.player.pause() },
            { regex: /^!r(esume)?$/, fn: () => this.player.resume() },
            { regex: /^!s(kip)?$/, fn: () => this.player.skip() },
            { regex: /^!a(dd)? ([^\s]+)$/, fn: (match: RegExpMatchArray) => this.player.add(match[2]) },
            { regex: /^!c(lear)?$/, fn: () => this.player.clear() },
            { regex: /^!v(ol|olume)? ([^\s]+)$/, fn: (match: RegExpMatchArray) => this.player.volume(parseInt(match[2])) }
        ];

        for (let cmd of commands.filter((cmd) => cmd.regex.test(msg))) {
            cmd.fn(cmd.regex.exec(msg));
        }
    }

    private addResponder(cli: mumble.MumbleClient): void {
        this.robot.respond(/who (.*)/i, (res) => {
            let channelName = res.match[1];
            let channel = cli.channelByName(channelName);
            if (channel != null) {
                let userNames = channel.users.map((user) => user.name);
                if (userNames.length > 0) {
                    res.send(...userNames);
                } else {
                    res.send(`Nobody is in ${channelName}`);
                }
            } else {
                res.send(`No channel with name ${channelName}`);
            }
        });
    }
}

export = async (robot: Robot) => {
    try {
        await (new MumbleBot(robot)).connect(process.env.HUBOTMUMBLEURL, process.env.HUBOTMUMBLEPASSWORD);
    } catch (e) {
        robot.logger.error(e);
    }
};
