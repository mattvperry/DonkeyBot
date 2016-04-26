// Description:
//  Post twitch emotes
//
// Commands:
//  <twitch emote> - post the corresponding image
//
// Author:
//  Matt Perry

/// <reference path="..\..\typings\main.d.ts" />

import { Robot, Response } from "tsbot";
import * as escapeStringRegexp from "escape-string-regexp";

interface TwitchEmoteResponse {
    meta: { generated_at: string },
    template: {
        small: string,
        medium: string,
        large: string,
    },
    emotes: {
        [name: string]: {
            description: string,
            image_id: number
        }
    }
}

interface BTTVResponse {
    status: number,
    urlTemplate: string,
    emotes: {
        id: string,
        code: string,
        channel: any,
        restructions: {
            channels: string[],
            games: string[]
        },
        imageType: string
    }[]
}

class Emotes {
    private static TWITCH_ENDPOINT = "https://twitchemotes.com/api_cache/v2/global.json";
    private static BTTV_ENDPOINT = "https://api.betterttv.net/2/emotes";

    constructor(private _robot: Robot) {
    }

    public async addListeners(): Promise<void> {
        let twitch = await this._getData<TwitchEmoteResponse>(Emotes.TWITCH_ENDPOINT);
        for (const key in twitch.emotes) {
            this._robot.hear(this._makeRegex(key), (res) => {
                res.emote(twitch.template.large.replace(
                    "{image_id}", 
                    twitch.emotes[key].image_id.toString()))
            });
        }
        
        let bttv = await this._getData<BTTVResponse>(Emotes.BTTV_ENDPOINT);
        for (const emote of bttv.emotes) {
            this._robot.hear(this._makeRegex(emote.code), (res) => {
                res.emote("https:" + bttv.urlTemplate
                    .replace("{{id}}", emote.id)
                    .replace("{{image}}", "3x"));
            });
        }
    }
    
    private _makeRegex(emote: string): RegExp {
        return new RegExp(`(?:[^\w]+|^)${escapeStringRegexp(emote)}(?:[^\w]+|$)`);
    }

    private _getData<T>(url: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this._robot
            .http(url)
            .get()((err, data, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(body));
                }
            })
        });
    }
}

export = async (robot: Robot) => {
    try {
        await (new Emotes(robot)).addListeners();
    } catch (e) {
        robot.logger.error(e);
    }
}
