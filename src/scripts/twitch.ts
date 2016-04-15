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

interface ApiResponse {
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

class TwitchEmotes {
    private static ENDPOINT = "https://twitchemotes.com/api_cache/v2/global.json";

    constructor(private _robot: Robot) {
    }

    public async addListeners(): Promise<void> {
        let data = await this._getData();
        for (const key in data.emotes) {
            this._robot.hear(new RegExp(key), (res) => {
                res.emote(data.template.small.replace(
                    "{image_id}", 
                    data.emotes[key].image_id.toString()))
            });
        }
    }

    private _getData(): Promise<ApiResponse> {
        return new Promise<ApiResponse>((resolve, reject) => {
            this._robot
            .http(TwitchEmotes.ENDPOINT)
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
        await (new TwitchEmotes(robot)).addListeners();
    } catch (e) {
        robot.logger.error(e);
    }
}
