// Description:
//  Roll a random number between 1 and max
//  max default to 100
//
// Commands:
//  roll( \d+)? - roll a number 
//
// Author:
//  Steve Shipsey

import { Robot } from "tsbot";

let roll = (robot: Robot) => {
    robot.respond(/roll( me)?( (\d+))?/i, (res) => {
        let max = Math.abs(Number(res.match[2])) || 100;
        res.respond("rolls a " + Math.floor(Math.random() * max + 1) + "!");
    });
};

export = roll;