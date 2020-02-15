import { inject, injectable } from 'inversify';
import { Robot } from 'hubot';
import { duration } from 'moment';

import { Feature } from '.';
import { ResponderTag, ChannelManagerTag, RobotTag, ActivityManagerTag } from '../tags';
import { ActivityManager } from '../activityManager';
import { Responder } from '../responder';
import { ChannelManager } from '../channelManager';
import { Player } from './player';

@injectable()
export class MusicPlayerFeature implements Feature {
    constructor(
        @inject(RobotTag) private robot: Robot,
        @inject(ActivityManagerTag) private activity: ActivityManager,
        @inject(ChannelManagerTag) private channels: ChannelManager,
        @inject(ResponderTag) private responder: Responder) {
    }

    public setup(): void {
        const games = this.channels.getChannelByName('Games', 'voice');
        if (!games) {
            return;
        }

        const player = new Player(games);

        player.on('play', async info => {
            await this.activity.setActivity(info.title, 'LISTENING', info.webpage_url);
        });

        player.on('end', async () => {
            await this.activity.setActivity('nothing', 'LISTENING');
        });

        this.robot.respond(/play( me)? (.*)$/i, async resp => {
            const sent = await this.responder.send(resp, 'Loading...');
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
                return await this.responder.flashMessage(resp, 'Volume out of range!');
            }

            player.volume(+resp.match[2]);
            resp.reply(`Volume set to ${volume}`);
        });

        this.robot.respond(/skip( me)?$/i, async resp => {
            if (player.queue.length === 0) {
                return await this.responder.flashMessage(resp, 'Nothing to skip');
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
                await this.responder.send(resp, list.join('\n'), {
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
}