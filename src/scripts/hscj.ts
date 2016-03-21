/// <reference path="..\..\typings\main.d.ts" />

import { Robot, Response } from "hubot";
import * as googl from "goo.gl";

googl.setKey(process.env.HUBOT_GOOGLE_CSE_KEY);

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

async function getSubReddit(res: Response, sub: string, count: number): Promise<RedditResult> {
    return new Promise<RedditResult>((resolve, reject) => {
        res
        .http(`https://www.reddit.com/r/${sub}.json`)
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
    let sub = res.random(["hearthstone", "hearthstonecirclejerk"]);
    let posts = await getSubReddit(res, sub, 25);
    let post = res.random(posts.data.children).data;
    let url = await googl.shorten(`https://reddit.com${post.permalink}`);

    let messages = [post.title];
    let extraField = post.domain.startsWith("self") ? post.selftext : post.url;
    if (extraField !== "") {
        messages.push(extraField);
    }

    messages.push(`> ${url}`);
    res.send(...messages);
};

export = (robot: Robot) => robot.respond(/(hscj)( me)?/i, async (res) => {
    try {
        await onResponse(res);
    } catch (e) {
        robot.logger.error(e);
    }
});