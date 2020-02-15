import { injectable, multiInject } from 'inversify';

import { Feature } from './features';
import { FeatureTag } from './tags';

@injectable()
export class DiscordBot {
    constructor(@multiInject(FeatureTag) private features: Feature[]) {
    }

    public connect = async () => {
        for (const feature of this.features) {
            feature.setup();
        }
    }
}