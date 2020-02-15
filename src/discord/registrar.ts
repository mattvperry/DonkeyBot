import 'reflect-metadata';

import { Robot } from 'hubot';
import { DiscordAdapter } from 'hubot-discord-ts';
import { Container } from 'inversify';
import { Client } from 'discord.js';

import * as tags from './tags';
import { ActivityManager } from './activityManager';
import { ChannelManager } from './channelManager';
import { Responder } from './responder';
import { DiscordBot } from './discordBot';
import { features, Feature } from './features';

export function createContainer(robot: Robot<DiscordAdapter>) {
    const container = new Container();
    container.bind<Robot>(tags.RobotTag).toConstantValue(robot);
    container.bind<Client>(tags.ClientTag).toConstantValue(robot.adapter.client);

    container.bind<ChannelManager>(tags.ChannelManagerTag).to(ChannelManager);
    container.bind<ActivityManager>(tags.ActivityManagerTag).to(ActivityManager);
    container.bind<Responder>(tags.ResponderTag).to(Responder);

    for (const feature of features) {
        container.bind<Feature>(tags.FeatureTag).to(feature);
    }

    container.bind<DiscordBot>(tags.DiscordBotTag).to(DiscordBot);

    return container;
}