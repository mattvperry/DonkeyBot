import { injectable, multiInject, inject } from 'inversify';

import Feature, { Registration } from './features/feature';
import { Responder, ResponderFactory } from './responder';
import { FeatureTag, ResponderFactoryTag } from './tags';

@injectable()
export default class DiscordBot {
    constructor(
        @inject(ResponderFactoryTag) private responderFactory: ResponderFactory,
        @multiInject(FeatureTag) private features: Feature[],
    ) {}

    public *connect(): IterableIterator<Registration> {
        for (const feature of this.features) {
            yield* feature.setup();
        }
    }

    public createResponder(userId: string, channelId?: string): Promise<Responder> {
        return this.responderFactory.createForRoom(userId, channelId);
    }
}
