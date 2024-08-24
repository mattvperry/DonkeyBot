// Description:
//   Minecraft Hardcore Reset
//
// Commands:
//   hubot mc reset - Resets the minecraft world
//
// Notes:
//   This is a script to assist with managing a hardcore minecraft world
//

import { Robot } from 'hubot';
import { PteroClient } from '@devnote-dev/pterojs';

const key = process.env.HUBOT_PTERO_KEY ?? '';

async function restart(): Promise<string> {
    const client = new PteroClient('https://games.mattvperry.com', key);
    const server = await client.servers.fetch('05f4dfbd');

    const files = await server.files.fetch('./');
    if (!files.has('world')) {
        return "Unable to find world file to delete.";
    }

    await server.setPowerState('stop');
    const archive = await server.files.compress('./', ['world']);
    await server.files.delete('./', ['world']);
    await server.setPowerState('start');

    return `Successfully restarted server. Archived previous world at ${archive.name}.`;
}

export default (robot: Robot) => {
    robot.respond(/mc reset/i, async (res) => {
        res.reply(await restart());
    });
};
