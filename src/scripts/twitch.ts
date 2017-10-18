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
    [name: string]: {
        id: number
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
    private static TWITCH_EMOTE_TEMPLATE = "https://static-cdn.jtvnw.net/emoticons/v1/{id}/3.0";
    private static TWITCH_ENDPOINT = "https://twitchemotes.com/api_cache/v3/global.json";
    private static BTTV_ENDPOINT = "https://api.betterttv.net/2/emotes";
    private static BTTV_CHANNEL_ENDPOINT = "https://api.betterttv.net/2/channels/";
    private static BTTV_CHANNELS = ["forsenlol"];
    private static CUSTOM_EMOTES = {"KUPPA": "https://i.imgur.com/xqTpGLI.png",};

    constructor(private _robot: Robot) {
    }

    public async addListeners(): Promise<void> {
        let twitch = await this._getData<TwitchEmoteResponse>(Emotes.TWITCH_ENDPOINT);
        for (const key in twitch) {
            this._robot.hear(this._makeRegex(key), (res) => {
                res.emote(Emotes.TWITCH_EMOTE_TEMPLATE.replace(
                    "{id}", 
                    twitch[key].id.toString()))
            });
        }
        for (const key in Emotes.CUSTOM_EMOTES) {
            this._robot.hear(this._makeRegex(key), (res) => {
                res.emote(Emotes.CUSTOM_EMOTES[key]);
            });
        }
        
        let bttv = await this._getData<BTTVResponse>(Emotes.BTTV_ENDPOINT);        
        let channels = await Promise.all<BTTVResponse>(Emotes.BTTV_CHANNELS.map(c => {
            return this._getData<BTTVResponse>(Emotes.BTTV_CHANNEL_ENDPOINT + c);
        }));
        
        for (const data of [bttv].concat(channels)) {
            this._addBTTVListeners(data);
        }
    }
    
    private _addBTTVListeners(data: BTTVResponse) {
        for (const emote of data.emotes) {
            this._robot.hear(this._makeRegex(emote.code), (res) => {
                res.emote("https:" + data.urlTemplate
                    .replace("{{id}}", emote.id)
                    .replace("{{image}}", "3x"));
            });
        }
    }
    
    private _makeRegex(emote: string): RegExp {
        let isParenEmote = emote.match(/\(\w+\)/);
        let emoteRegex = escapeStringRegexp(emote);
        
        if (!isParenEmote) {
            emoteRegex = `\\b${emoteRegex}\\b`;
        }
        
        return new RegExp(emoteRegex)
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
