/// <reference path="..\..\typings\main.d.ts"" />

import { Robot, Response } from "hubot";

interface PlayerId {
    name: string;
    realm: string;
};

interface PlayerStats {
    ilvl: number;
};

type Player = PlayerId & PlayerStats;

let key: string     = process.env.HUBOT_WOW_API_KEY;
let baseURL: string = "https://us.api.battle.net/wow/";
let locale: string  = "en_us";
let users: PlayerId[]   = [
    { name: "Xiara", realm: "Azuremyst" },
    { name: "Titanuus", realm: "Thrall" },
    { name: "Trudgling", realm: "Azuremyst" },
    { name: "Zarpidon", realm: "Azuremyst" },
    { name: "Vashen", realm: "Azuremyst" },
    { name: "Amordos", realm: "Azuremyst" },
];

async function getIlvl(res: Response, id: PlayerId): Promise<Player> {
    return new Promise<Player>((resolve, reject) => {
        res
            .http(`${baseURL}character/${id.realm}/${id.name}`)
            .query({
                fields: "items",
                locale: locale,
                apikey: key
            })
            .get()((err, data, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(Object.assign({}, id, {
                        ilvl: JSON.parse(body).items.averageItemLevel
                    }));
                }
            });
    });
}

async function getRoster(res: Response): Promise<Player[]> {
    return Promise.all<Player>(users.map((char) => getIlvl(res, char)));
}

async function onResponse(res: Response): Promise<void> {
    let chars = (await getRoster(res))
        .sort((a, b) => b.ilvl - a.ilvl)
        .map((char) => `${char.name}: ${char.ilvl}`);
    res.send(...chars);
}

export = (robot: Robot) => robot.respond(/(ilvl)( me)?/i, onResponse);