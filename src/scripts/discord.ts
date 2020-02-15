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

import { Robot } from 'hubot';
import { hasDiscordAdapter } from 'hubot-discord-ts';

import { DiscordBot } from '../discord/discordBot';
import { createContainer } from '../discord/registrar';
import { DiscordBotTag } from '../discord/tags';

export = async (robot: Robot) => {
    if (!hasDiscordAdapter(robot)) {
        return;
    }

    try {
        const container = createContainer(robot);
        const bot = container.get<DiscordBot>(DiscordBotTag);
        await bot.connect();
    } catch (e) {
        console.log(e);
    }
};
