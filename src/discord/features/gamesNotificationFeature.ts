import { inject, injectable } from 'inversify';

import ChannelManager from '../channelManager';
import { ChannelManagerTag } from '../tags';
import Feature, { Registration } from './feature';

@injectable()
export default class GamesNotificationFeature extends Feature {
    private readonly timeMap: Record<string, number | undefined> = {};

    constructor(@inject(ChannelManagerTag) private channels: ChannelManager) {
        super();
    }

    // eslint-disable-next-line require-yield
    public *setup(): Iterable<Registration> {
        this.channels.onVoiceChannelEnter('Games', async (member) => {
            const general = this.channels.fetchByName('general', 'text');
            if (!general) {
                return;
            }

            const currentTime = Date.now();
            const userTime = this.timeMap[member.displayName];
            if (!userTime || currentTime - userTime > 60000) {
                this.timeMap[member.displayName] = currentTime;
                await general.send(`${member.displayName} wants to play games!`);
            }
        });
    }
}
