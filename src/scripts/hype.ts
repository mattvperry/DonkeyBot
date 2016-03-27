// Description:
//  Hype meter
//
// Commands:
//  hype - add to the hype!
//
// Author:
//  Matt Perry

/// <reference path="..\..\typings\main.d.ts" />

import { Robot } from "tsbot";

let timeDecay: number       = 5 * 60 * 1000;
let hypeIncrement: number   = 15;
let maxHype: number         = 100;
let total: number           = 0;
let lastTime: number        = Date.now();
let gettingHyped: string    = "༼ʘ̚ل͜ʘ̚༽ Hype level rising";
let overHyped: string       = "ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ TOO MUCH HYPE TO HANDLE! ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ";

let resetHype = () => {
    let curTime: number = Date.now();
    total = total - (Math.floor((curTime - lastTime) / timeDecay) * hypeIncrement);
    lastTime = curTime;
    if (total < 0) {
        total = 0;
    }
};

let hype = (robot: Robot) => {
    robot.hear(/hype/i, (res) => {
        resetHype();
        if (total < maxHype) {
            total += Math.min(hypeIncrement, maxHype - total);
            res.send(`${gettingHyped} : ${total}%`);
        } else {
            res.send(`${overHyped}`);
        }
    });
};

export = hype;