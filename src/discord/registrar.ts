import 'reflect-metadata';

import { Client } from 'discord.js';
import { Container } from 'inversify';

import ActivityManager from './activityManager';
import ChannelManager from './channelManager';
import DiscordBot from './discordBot';
import features from './features';
import Feature from './features/feature';
import { PlayerFactory } from './features/player';
import { ResponderFactory } from './responder';
import * as tags from './tags';

export default function createContainer(client: Client): Container {
    const container = new Container();
    container.bind<Client>(tags.ClientTag).toConstantValue(client);

    container.bind<ChannelManager>(tags.ChannelManagerTag).to(ChannelManager);
    container.bind<ActivityManager>(tags.ActivityManagerTag).to(ActivityManager);
    container.bind<ResponderFactory>(tags.ResponderFactoryTag).to(ResponderFactory);

    container.bind<PlayerFactory>(tags.PlayerFactoryTag).to(PlayerFactory);
    for (const feature of features) {
        container.bind<Feature>(tags.FeatureTag).to(feature);
    }

    container.bind<DiscordBot>(tags.DiscordBotTag).to(DiscordBot);

    return container;
}
