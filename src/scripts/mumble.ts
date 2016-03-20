/// <reference path="..\..\typings\main.d.ts" />

import { ConnectionOptions } from "tls";
import { Robot } from "hubot";
import * as Queue from "promise-queue";
import * as youtubedl from "youtube-dl";
import * as ffmpeg from "fluent-ffmpeg";
import * as mumble from "mumble";
import * as promisify from "es6-promisify";
import * as fs from "fs";

class Player {
    private _cmd: FfmpegCommand;
    private _output: mumble.MumbleInputStream;
    private _playing: boolean;
    private _gain: number;
    private _queue: Queue;

    constructor(private _cli: mumble.MumbleClient) {
        this._playing = false;
        this._gain = .1;
        this._queue = new Queue(1);
    }

    public add(url: string): void {
        this._queue.add(() => this._stream(url));
    }

    public pause(): void {
        if (this._playing) {
            this._cmd.kill("SIGSTOP");
        }
    }

    public resume(): void {
        if (!this._playing) {
            this._cmd.kill("SIGCONT");
        }
    }

    public skip(): void {
        if (this._playing) {
            this._cmd.kill();
        }
    }

    public clear(): void {
        this._queue.queue = [];
        this.skip();
    }

    public volume(vol: number): void {
        let gain = vol * .01;
        if (this._playing && gain > 0 && gain <= 1) {
            this._gain = gain;
            this._output.setGain(this._gain);
        }
    }

    private async _stream(url: string): Promise<any> {
        let info = await promisify<VideoInfo, string, string[]>(youtubedl.getInfo)(url, []);
        this._output = this._cli.inputStream({ gain: this._gain });
        this._cmd = ffmpeg(info.url)
            .noVideo()
            .format("s16le")
            .audioBitrate(128)
            .audioChannels(1)
            .audioFrequency(48000)
            .on("start", () => {
                this._playing = true;
            });
        this._cmd.pipe(this._output);

        return new Promise((resolve, reject) => {
            this._cmd.on("error", (err) => {
                this._playing = false;
                reject(err);
            });
            this._cmd.on("end", () => {
                this._playing = false;
                resolve();
            });
        });
    }
}

class MumbleBot {
    private _name: string;
    private _timeMap: { [user: string]: number };
    private _player: Player;

    constructor(private _robot: Robot) {
        this._name = "DonkeyBot";
        this._timeMap = {};
    }

    public async connect(url: string, password: string): Promise<void> {
        try {
            let options = await this._getOptions();
            let cli = await promisify<mumble.MumbleClient, string, ConnectionOptions>(mumble.connect)(url, options);
            cli.authenticate(this._name, password);

            this._player = new Player(cli);
            cli.on("ready", () => this._ready(cli));
            cli.on("user-move", this._userMove.bind(this));
            cli.on("message", (msg: string) => {
                this._message(msg.replace(/<[^>]+>/ig, ""));
            });
            this._addResponder(cli);
        } catch (err) {
            this._robot.logger.error(err);
        }
    }

    private async _getOptions(): Promise<ConnectionOptions> {
        let opts: ConnectionOptions = {};
        if (fs.existsSync("./certs")) {
            opts.key = await promisify(fs.readFile)("./certs/private_key.pem");
            opts.cert = await promisify(fs.readFile)("./certs/cert.pem");
        }
        return opts;
    }

    private _ready(cli: mumble.MumbleClient): void {
        cli.user.moveToChannel("Games");
    }

    private _userMove(user: mumble.User): void {
        if (user.channel.name === "Games" && user.name !== this._name) {
            let currentTime = Date.now();
            if (!this._timeMap[user.name] || (currentTime - this._timeMap[user.name]) > 60000) {
                this._timeMap[user.name] = currentTime;
                this._robot.adapter.send({}, `${user.name} wants to play games!`);
            }
        }
    }

    private _message(msg: string): void {
        let commands = [
            { regex: /^!p(ause)?$/, fn: () => this._player.pause() },
            { regex: /^!r(esume)?$/, fn: () => this._player.resume() },
            { regex: /^!s(kip)?$/, fn: () => this._player.skip() },
            { regex: /^!a(dd)? ([^\s]+)$/, fn: (match: RegExpMatchArray) => this._player.add(match[2]) },
            { regex: /^!c(lear)?$/, fn: () => this._player.clear() },
            { regex: /^!v(ol|olume)? ([^\s]+)$/, fn: (match: RegExpMatchArray) => this._player.volume(parseInt(match[2])) }
        ];

        for (let cmd of commands.filter((cmd) => cmd.regex.test(msg))) {
            cmd.fn(cmd.regex.exec(msg));
        }
    }

    private _addResponder(cli: mumble.MumbleClient): void {
        this._robot.respond(/who (.*)/i, (res) => {
            let channelName = res.match[1];
            let channel = cli.channelByName(channelName);
            if (channel !== null) {
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
    await (new MumbleBot(robot)).connect(process.env.HUBOT_MUMBLE_URL, process.env.HUBOT_MUMBLE_PASSWORD);
};