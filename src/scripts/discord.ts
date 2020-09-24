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

import DiscordBot from '../discord/discordBot';
import createContainer from '../discord/registrar';
import { DiscordBotTag } from '../discord/tags';

export = (robot: Robot): void => {
    if (!hasDiscordAdapter(robot)) {
        return;
    }

    try {
        const container = createContainer(robot.adapter.client);
        const bot = container.get<DiscordBot>(DiscordBotTag);

        for (const reg of bot.connect()) {
            robot[reg.type](reg.test, async ({ message, match }) => {
                const userId = message.user.id;
                const channelId = message.room;
                const resp = await bot.createResponder(userId, channelId);
                await reg.callback(resp, match);
            });
        }
    } catch (e) {
        console.log(e);
    }
};
