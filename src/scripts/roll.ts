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

export = (robot: Robot) => robot.respond(/roll( me)?( (\d+))?/i, (res) => {
    const max = Math.abs(Number(res.match[2])) || 100;
    const roll = Math.floor(Math.random() * max + 1);

    res.reply(`rolls a ${roll} !`);
    robot.emit("roll", res, roll, max);
});
