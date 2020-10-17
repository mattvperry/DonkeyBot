import { inject, injectable } from 'inversify';

import msToTimestamp from '../../lib/duration';
import ActivityManager from '../activityManager';
import { PlayerFactoryTag, ActivityManagerTag } from '../tags';
import Feature, { Registration } from './feature';
import { PlayerFactory } from './player';

@injectable()
export default class MusicPlayerFeature extends Feature {
    constructor(
        @inject(ActivityManagerTag) private activity: ActivityManager,
        @inject(PlayerFactoryTag) private playerFactory: PlayerFactory,
    ) {
        super();
    }

    public *setup(): Iterable<Registration> {
        const player = this.playerFactory.createPlayer('Games');
        if (!player) {
            return;
        }

        player.on('play', ({ title, video_url }) => this.activity.setActivity(title, 'LISTENING', video_url));

        player.on('end', () => this.activity.setActivity('nothing', 'LISTENING'));

        yield this.respond(/play( me)? (.*)$/i, async (resp, match) => {
            return resp.operation(
                () => player.add(match[2]),
                ({ title, video_url }) => `Queued: ${title} ${video_url}`,
                (_) => `Failed to queue: ${match[2]}`,
            );
        });

        yield this.respond(/volume( me)? (\d*)$/i, async (resp, match) => {
            const volume = +match[2];
            if (volume > 200 || volume < 0) {
                return resp.flashMessage('Volume out of range!');
            }

            player.volume(volume);
            await resp.reply(`Volume set to ${volume}`);
            return Promise.resolve();
        });

        yield this.respond(/skip( me)?$/i, async (resp) => {
            if (player.queue.length === 0) {
                return resp.flashMessage('Nothing to skip');
            }

            player.skip();
            await resp.reply('Skipped current song.');
            return Promise.resolve();
        });

        yield this.respond(/queue( me)?$/i, async (resp) => {
            const list = player.queue.map(({ title, lengthSeconds }, index) => {
                const time = msToTimestamp(player.time);
                const length = msToTimestamp(parseInt(lengthSeconds, 10) * 1000);
                return `${index + 1}. ${title} [${index === 0 ? `${time}/` : ''}${length}]`;
            });

            if (list.length === 0) {
                await resp.send('Queue is currently empty.');
            } else {
                await resp.send(list.join('\n'), { code: true });
            }
        });

        yield this.respond(/pause( me)?$/i, async (resp) => {
            player.pause();
            await resp.reply('Playback paused.');
        });

        yield this.respond(/resume( me)?$/i, async (resp) => {
            player.resume();
            await resp.reply('Playback resumed.');
        });

        yield this.respond(/clear( me)?$/i, async (resp) => {
            player.clear();
            await resp.reply('Queue cleared!');
        });
    }
}
