// Description:
//  Random post from /r/circlejerk
//
// Commands:
//  hubot jerk me - grab a random post from /r/circlejerk
//
// Author:
//  Matt Perry

/// <reference path="..\..\typings\main.d.ts" />

import { Robot, Response } from "hubot";

interface RedditResult {
    data: {
        children: {
            data: {
                permalink: string,
                title: string,
                domain: string,
                selftext: string,
                url: string
            };
        }[]
    }
};

function getCirclejerk(res: Response, count: number): Promise<RedditResult> {
    return new Promise<RedditResult>((resolve, reject) => {
        res
        .http(`https://www.reddit.com/r/circlejerk.json`)
        .query({ count: count })
        .get()((err, data, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(body));
            }
        }); 
    });
}

async function onResponse(res: Response): Promise<void> {
    let posts = await getCirclejerk(res, 25);
    let post = res.random(posts.data.children).data;

    let messages = [post.title];
    let extraField = post.domain.startsWith("self") ? post.selftext : post.url;
    if (extraField !== "") {
        messages.push(extraField);
    }

    res.send(...messages);
}

export = (robot: Robot) => robot.respond(/(jerk)( me)?/i, async (res) => {
    try {
        await onResponse(res);
    } catch (e) {
        robot.logger.error(e);
    }
});