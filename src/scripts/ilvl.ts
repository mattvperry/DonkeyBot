/// <reference path="..\..\typings\main.d.ts"" />

import { Robot, Response } from "hubot";

interface WOWData {
    items: { averageItemLevel: number }
}

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

async function getWOWData(res: Response, id: PlayerId): Promise<WOWData> {
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
        ilvl: data.items.averageItemLevel
    });
}

async function onResponse(res: Response): Promise<void> {
    let chars = (await Promise.all<Player>(users.map((char) => getIlvl(res, char))))
        .sort((a, b) => b.ilvl - a.ilvl)
        .map((char) => `${char.name}: ${char.ilvl}`);
    res.send(...chars);
}

export = (robot: Robot) => robot.respond(/(ilvl)( me)?/i, async (res) => {
    try {
        await onResponse(res);
    } catch (e) {
        robot.logger.error(e);
    }
});