import { injectable, multiInject, inject } from 'inversify';

import Feature from './features/feature';
import { FeatureTag, ResponderFactoryTag } from './tags';
import { Responder, ResponderFactory } from './responder';

@injectable()
export default class DiscordBot {
    constructor(
        @inject(ResponderFactoryTag) private responderFactory: ResponderFactory,
        @multiInject(FeatureTag) private features: Feature[],
    ) {}

    public *connect() {
        for (const feature of this.features) {
            yield* feature.setup();
        }
    }

    public createResponder(userId: string, channelId?: string): Promise<Responder> {
        return this.responderFactory.createForRoom(userId, channelId);
    }
}
