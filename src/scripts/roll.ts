// Description:
//  Roll a random number between 1 and max
//  max default to 100
//
// Commands:
//  roll( \d+)? - roll a number
//
// Author:
//  Steve Shipsey

import { Robot } from 'hubot';

export = (robot: Robot): void =>
    robot.respond(/roll( me)?( (\d+))?/i, (res) => {
        const max = Math.abs(Number(res.match[2])) || 100;
        const roll = Math.floor(Math.random() * max + 1);

        res.reply(`rolls a ${roll} !`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (robot as any).emit('roll', res, roll, max);
    });
