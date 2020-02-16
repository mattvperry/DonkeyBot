import { inject, injectable } from 'inversify';
import { duration } from 'moment';

import { Feature, Registration } from './feature';
import { ChannelManagerTag, ActivityManagerTag } from '../tags';
import { ActivityManager } from '../activityManager';
import { ChannelManager } from '../channelManager';
import { Player } from './player';

@injectable()
export class MusicPlayerFeature extends Feature {
    constructor(
        @inject(ActivityManagerTag) private activity: ActivityManager,
        @inject(ChannelManagerTag) private channels: ChannelManager
    ) {
        super();
    }

    public* setup(): Iterable<Registration> {
        const games = this.channels.fetchByName('Games', 'voice');
        if (!games) {
            return;
        }

        const player = new Player(games);
        player.on('play', ({ title, webpage_url }) => this.activity.setActivity(title, 'LISTENING', webpage_url));
        player.on('end', () => this.activity.setActivity('nothing', 'LISTENING'));

        yield this.respond(/play( me)? (.*)$/i, async (resp, match) => {
            resp.operation(
                () => player.add(match[2]),
                ({ title, webpage_url }) => `Queued: ${title} ${webpage_url}`,
                _ => `Failed to queue: ${match[2]}`
            );
        });

        yield this.respond(/volume( me)? (\d*)$/i, async (resp, match) => {
            const volume = +match[2];
            if (volume > 200 || volume < 0) {
                return await resp.flashMessage('Volume out of range!');
            }

            player.volume(volume);
            resp.reply(`Volume set to ${volume}`);
        });

        yield this.respond(/skip( me)?$/i, async resp => {
            if (player.queue.length === 0) {
                return await resp.flashMessage('Nothing to skip');
            }

            player.skip();
            resp.reply('Skipped current song.');
        });

        yield this.respond(/queue( me)?$/i, async resp => {
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
                await resp.send('Queue is currently empty.');
            } else {
                await resp.send(list.join('\n'), { code: true });
            }
        });

        yield this.respond(/pause( me)?$/i, async resp => {
            player.pause();
            resp.reply('Playback paused.');
        });

        yield this.respond(/resume( me)?$/i, async resp => {
            player.resume();
            resp.reply('Playback resumed.');
        });

        yield this.respond(/clear( me)?$/i, async resp => {
            player.clear();
            resp.reply('Queue cleared!');
        });
    }
}