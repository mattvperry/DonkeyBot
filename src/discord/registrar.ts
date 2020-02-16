import 'reflect-metadata';

import { Container } from 'inversify';
import { Client } from 'discord.js';

import * as tags from './tags';
import { ActivityManager } from './activityManager';
import { ChannelManager } from './channelManager';
import { ResponderFactory } from './responder';
import { DiscordBot } from './discordBot';
import { Feature } from './features/feature';
import { features } from './features';

export function createContainer(client: Client) {
    const container = new Container();
    container.bind<Client>(tags.ClientTag).toConstantValue(client);

    container.bind<ChannelManager>(tags.ChannelManagerTag).to(ChannelManager);
    container.bind<ActivityManager>(tags.ActivityManagerTag).to(ActivityManager);
    container.bind<ResponderFactory>(tags.ResponderFactoryTag).to(ResponderFactory);

    for (const feature of features) {
        container.bind<Feature>(tags.FeatureTag).to(feature);
    }

    container.bind<DiscordBot>(tags.DiscordBotTag).to(DiscordBot);

    return container;
}