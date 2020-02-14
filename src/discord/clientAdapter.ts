import { injectable, inject } from 'inversify';
import { Client } from 'discord.js';

export const ClientTag = Symbol('Client');
export const ClientAdapterTag = Symbol('ClientAdapter');

@injectable()
export class ClientAdapter {
    constructor(
        @inject(ClientTag) private client: Client
    ) {
    }
}