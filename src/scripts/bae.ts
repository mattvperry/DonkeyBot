// Description:
//  Let the RNG gods decide whether or not Mei is bae
//  (Spoiler alert: She is)
//
// Commands:
//  mei - decide whether or not mei is bae
//
// Author:
//  Steve Shipsey

import { Robot } from "hubot";

const is = ["", " not"];

export default (robot: Robot) => {
    robot.hear(/\bmei\b/i, (res) => {
        res.send(`Mei is${res.random(is)} bae.`);
    });
};
