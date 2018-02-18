// Description:
//  Random post from /r/circlejerk
//
// Commands:
//  hubot jerk me - grab a random post from /r/circlejerk
//
// Author:
//  Matt Perry

import { Robot, Response } from 'hubot';
import Axios from 'axios';

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

async function getCirclejerk(count: number): Promise<RedditResult> {
    const res = await Axios.get<RedditResult>('https://www.reddit.com/r/circlejerk.json');
    return res.data;
}

async function onResponse(res: Response): Promise<void> {
    const posts = await getCirclejerk(25);
    const post = res.random(posts.data.children).data;

    const messages = [post.title];
    const extraField = post.domain.startsWith('self') ? post.selftext : post.url;
    if (extraField !== "") {
        messages.push(extraField);
    }

    res.send(...messages);
}

export = (robot: Robot) => robot.respond(/(jerk)( me)?/i, async (res) => {
    try {
        await onResponse(res);
    } catch (e) {
        console.error(e);
    }
});
