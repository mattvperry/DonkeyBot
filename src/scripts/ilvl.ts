// Description:
//  Wow ilvl commands for our friends
//
// Commands:
//  hubot ilvl me - take out the measuring stick
//
// Author:
//  Matt Perry

/// <reference path="..\..\typings\main.d.ts" />

import { Robot, Response } from "tsbot";

interface WOWItem {
    quality: number;
}

interface WOWData {
    items: {
        averageItemLevel: number;
        "head": WOWItem;
        "neck": WOWItem;
        "shoulder": WOWItem;
        "back": WOWItem;
        "chest": WOWItem;
        "wrist": WOWItem;
        "hands": WOWItem;
        "waist": WOWItem;
        "legs": WOWItem;
        "feet": WOWItem;
        "finger1": WOWItem;
        "finger2": WOWItem;
        "trinket1": WOWItem;
        "trinket2": WOWItem;
        "mainHand": WOWItem;
        "offHand": WOWItem;
    }
}

interface PlayerId {
    name: string;
    realm: string;
};

interface PlayerStats {
    ilvl: number;
    legendaryCount: number;
};

type Player = PlayerId & PlayerStats;

let key: string     = process.env.HUBOT_WOW_API_KEY;
let baseURL: string = "https://us.api.battle.net/wow/";
let locale: string  = "en_us";
let items: string[] = ["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet", "finger1", "finger2", "trinket1", "trinket2", "mainHand", "offHand"];
let users: PlayerId[]   = [
    { name: "Xiama", realm: "Thrall" },
    { name: "TitanGrowth", realm: "Thrall" },
    { name: "Imagrilirl", realm: "Thrall" },
    { name: "Titanburn", realm: "Thrall" },
    { name: "Xzem", realm: "Thrall" },
    { name: "Starfailx", realm: "Illidan" },
    { name: "Titanuus", realm: "Thrall" }
];

function getWOWData(res: Response, id: PlayerId): Promise<WOWData> {
    return new Promise<WOWData>((resolve, reject) => {
        res
        .http(`${baseURL}character/${id.realm}/${id.name}`)
        .query({ fields: "items", locale: locale, apikey: key })
        .get()((err, data, body) => {
            if (err) {
                reject(err);
            } else {
                let result = JSON.parse(body);
                if (result.code !== undefined && result.code !== "200") {
                    reject(result.detail);
                } else {
                    resolve(JSON.parse(body));
                }
            }
        });
    });
}

async function getIlvl(res: Response, id: PlayerId): Promise<Player> {
    let data = await getWOWData(res, id);
    return Object.assign({}, id, {
        ilvl: data.items.averageItemLevel,
        legendaryCount: items
            .map((itemName) => data.items[itemName])
            .filter((item) => item && item.quality === 5)
            .length
    });
}

async function onResponse(res: Response): Promise<void> {
    let chars = (await Promise.all<Player>(users.map((char) => getIlvl(res, char))))
        .sort((a, b) => b.ilvl - a.ilvl)
        .map((char) => `${char.name}: ${char.ilvl}${"*".repeat(char.legendaryCount)}`);
    res.send(chars.join("\n"));
}

export = (robot: Robot) => robot.respond(/(ilvl)( me)?/i, async (res) => {
    try {
        await onResponse(res);
    } catch (e) {
        robot.logger.error(e);
    }
});
