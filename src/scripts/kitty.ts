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

const categories = [
    'hats',
    'space',
    'funny',
    'sunglasses',
    'boxes',
    'caturday',
    'ties',
    'dream',
    'kittens',
    'sinks',
    'clothes'
];

async function getCats(count?: number, category?: string): Promise<string[]> {
    if (!category || categories.indexOf(category) === -1) {
        category = undefined;
    }

    const res = await Axios.get<string>(
        'http://thecatapi.com/api/images/get', {
            params: {
                api_key: key,
                category: category,
                format: 'xml',
                results_per_page: count ? count > 10 ? 10 : count : 1 // Limit to 10
            }
        }
    );
    return parseCats(res.data);
}

const parseCats = (catsXml: string) => {
    return (catsXml.match(imageRgx) || [])
        .map(c => c.replace(urlRgx, ''));
}

export = (robot: Robot) => robot.respond(/(kitty|cat|meow)( me)? ?(\d+)? ?(\w+)?/i, async (res) => {
    try {
        const parsedCats = await getCats(Number(res.match[3]), res.match[4]);
        parsedCats.map(c => res.send(c));
    } catch (e) {
        console.error(e);
    }
});
