/// <reference path="..\..\typings\main.d.ts"" />

import { Robot, Response } from "hubot";

interface PlayerData {
    name: string;
    realm: string;
    ilvl?: number;
};

let key: string     = process.env.HUBOT_WOW_API_KEY;
let baseURL: string = "https://us.api.battle.net/wow/";
let locale: string  = "en_us";
let users: PlayerData[]   = [
    { name: "Xiara", realm: "Azuremyst" },
    { name: "Titanuus", realm: "Thrall" },
    { name: "Trudgling", realm: "Azuremyst" },
    { name: "Zarpidon", realm: "Azuremyst" },
    { name: "Vashen", realm: "Azuremyst" },
    { name: "Amordos", realm: "Azuremyst" },
];

async function getIlvl(res: Response, user: PlayerData): Promise<PlayerData> {
    return new Promise<PlayerData>((resolve, reject) => {
        res
            .http(`${baseURL}character/${user.realm}/${user.name}`)
            .query({
                fields: "items",
                locale: locale,
                apikey: key
            })
            .get()((err, data, body) => {
                if (err) {
                    reject(err);
                } else {
                    user.ilvl = JSON.parse(body).items.averageItemLevel;
                    resolve(user);
                }
            });
    });
}

async function getRoster(res: Response): Promise<PlayerData[]> {
    return Promise.all<PlayerData>(users.map((char: PlayerData) => getIlvl(res, char)));
}

async function onResponse(res: Response): Promise<void> {
    let chars = (await getRoster(res))
        .sort((a, b) => b.ilvl - a.ilvl)
        .map((char) => `${char.name}: ${char.ilvl}`);
    res.send(...chars);
}

export = (robot: Robot) => robot.respond(/(ilvl)( me)?/i, onResponse);