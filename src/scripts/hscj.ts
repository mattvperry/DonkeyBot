/// <reference path="..\..\typings\main.d.ts" />

import { Robot, Response } from "hubot";
import * as googl from "goo.gl";

googl.setKey(process.env.HUBOT_GOOGLE_CSE_KEY);

interface Post {
    permalink: string;
    title: string;
    body: string;
}

async function reddit(res: Response, sub: string): Promise<Post> {
    return new Promise<Post>((resolve, reject) => {
        res
            .http(`https://www.reddit.com/r/${sub}.json`)
            .query({ count: 25 })
            .get()((err, data, body) => {
                if (err) {
                    reject(err);
                } else {
                    let results = JSON.parse(body);
                    let data = res.random<{ data: any }>(results.data.children).data;
                    resolve({
                       permalink: `https://reddit.com${data.permalink}`,
                       title: data.title,
                       body: data.domain.match(/^self\./) ? data.selftext : data.url
                    });
                }
            });
    });
}

async function onResponse(res: Response): Promise<void> {
    let sub = res.random(["hearthstone", "hearthstonecirclejerk"]);
    let data = await reddit(res, sub);
    res.send(data.title);
    res.send(data.body);
    let url = await googl.shorten(data.permalink);
    res.send(`> ${url}`);
};

export = (robot: Robot) => robot.respond(/(hscj)( me)?/i, onResponse);