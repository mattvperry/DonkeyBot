// Description:
//  Hype meter
//
// Commands:
//  hype - add to the hype!
//
// Author:
//  Matt Perry

import { Robot } from "hubot";

const timeDecay     = 5 * 60 * 1000;
const hypeIncrement = 15;
const maxHype       = 100;
const gettingHyped  = "༼ʘ̚ل͜ʘ̚༽ Hype level rising";
const overHyped     = "ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ TOO MUCH HYPE TO HANDLE! ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ";

let total       = 0;
let lastTime    = Date.now();
const resetHype = () => {
    const curTime: number = Date.now();
    total = total - (Math.floor((curTime - lastTime) / timeDecay) * hypeIncrement);
    lastTime = curTime;
    if (total < 0) {
        total = 0;
    }
};

export = (robot: Robot) => {
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
