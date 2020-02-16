import { injectable } from 'inversify';

import { Responder } from '../responder';

export type RegistrationType = 'hear' | 'respond';

export interface Registration {
    type: RegistrationType;
    test: RegExp;
    callback: (resp: Responder, match: RegExpMatchArray) => Promise<void>;
}

@injectable()
export abstract class Feature {
    public abstract setup(): Iterable<Registration>;

    protected hear(
        test: RegExp,
        callback: (resp: Responder, match: RegExpMatchArray) => Promise<void>
    ): Registration {
        return { type: 'hear', test, callback };
    }

    protected respond(
        test: RegExp,
        callback: (resp: Responder, match: RegExpMatchArray) => Promise<void>
    ): Registration {
        return { type: 'respond', test, callback };
    }
}