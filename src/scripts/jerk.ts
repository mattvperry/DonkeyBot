/// <reference path="..\..\typings\main.d.ts" />

import { Robot } from "hubot";

let jerk = (robot: Robot) => {
    robot.respond(/(jerk)( me)?/i, (res) => {
        res
            .http("https://www.reddit.com/r/circlejerk.json")
            .query({ count: 25 })
            .get()((err, response, body) => {
                let results: any = JSON.parse(body);
                let post: any = res.random(results.data.children);
                res.send(post.data.title);
                if (post.data.domain === "self.circlejerk") {
                    if (post.data.selftext !== "") {
                        res.send(post.data.selftext);
                    }
                } else {
                    if (post.data.url !== "") {
                        res.send(post.data.url);
                    }
                }
            });
    });
};

export = jerk;