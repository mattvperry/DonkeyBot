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

import { DiscordBot } from '../discord';

export = async (robot: Robot) => {
    if (robot.adapterName !== 'discord') {
        return;
    }

    robot.router.get("/", (req, res, next) => {
        res.status(200);
        res.send('Hello World!');
    });

    const client = (robot.adapter as any).client;
    const bot = new DiscordBot(robot, client);
    try {
        await bot.connect();
    } catch (e) {
        console.log(e);
    }
};
