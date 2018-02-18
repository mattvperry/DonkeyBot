// Description:
// Get a kitty from catapi.com
//
// Commands:
// hubot kitty|cat|meow me - grab a random kitty
//
// Author:
// Steve Shipsey

import { Robot, Response } from 'hubot';
import Axios from 'axios';

const key = process.env.HUBOT_CAT_API_KEY;
const imageRgx = new RegExp(/<url>(.*)<\/url>/, 'g');
const urlRgx = new RegExp(/<url>|<\/url>/, 'g');

async function getCats(count?: number): Promise<string> {
    const res = await Axios.get<string>(
        'http://thecatapi.com/api/images/get', {
            params: {
                format: 'xml',
                api_key: key,
                results_per_page: count ? count > 10 ? 10 : count : 1 // Limit to 10
            }
    });
    return parseCats(res.data);
}

const parseCats = (catsXml: string) => {
    return (catsXml.match(imageRgx) || [])
    .map(c =>
        c.replace(urlRgx, '')
    )
    .join('\n');
}

export = (robot: Robot) => robot.respond(/(kitty|cat|meow)( me)? (\d+)?/i, async (res) => {
    try {
        const parsedCats = await getCats(Number(res.match[3]));
        res.reply(parsedCats);
    } catch (e) {
        console.error(e);
    }
});
