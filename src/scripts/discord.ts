// Description:
//  Discord-specific bot functionality. Only works with discord adapter
//
// Commands:
//  hubot play me <search> - queue a new song from youtube
//  hubot volume me <vol> - adjust music volume
//  hubot queue me - view current music queue
//  hubot skip me - skip the current song
//  hubot pause me - pause the music playback
//  hubot resume me - resume the music playback
//  hubot clear me - clear the current music queue
//
// Author:
//  Matt Perry

import { Robot, Adapter } from 'hubot';
import { Client } from 'discord.js';

import { DiscordBot } from '../discord';

interface SupportedAdapter extends Adapter {
    client: Client;
}

const supportedAdapters = [
    'discord-ts'
];

const hasSupportedAdapter = (robot: Robot): robot is Robot<SupportedAdapter> => supportedAdapters.includes(robot.adapterName);

export = async (robot: Robot) => {
    if (!hasSupportedAdapter(robot)) {
        return;
    }

    const client = robot.adapter.client;
    const bot = new DiscordBot(robot, client);
    try {
        await bot.connect();
    } catch (e) {
        console.log(e);
    }
};
