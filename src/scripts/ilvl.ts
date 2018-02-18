// Description:
//  Wow ilvl commands for our friends
//
// Commands:
//  hubot ilvl me - take out the measuring stick
//
// Author:
//  Matt Perry

import { Robot, Response } from 'hubot';
import Axios from 'axios';

type Item
    = 'head'
    | 'neck'
    | 'shoulder'
    | 'back'
    | 'chest'
    | 'wrist'
    | 'hands'
    | 'waist'
    | 'legs'
    | 'feet'
    | 'finger1'
    | 'finger2'
    | 'trinket1'
    | 'trinket2'
    | 'mainHand'
    | 'offHand';

interface WOWItem {
    quality: number;
}

interface WOWData {
    items: {
        averageItemLevel: number;
        averageItemLevelEquipped: number;
    } & { [I in Item]: WOWItem }
}

interface PlayerId {
    name: string;
    realm: string;
};

const key               = process.env.HUBOT_WOW_API_KEY;
const baseURL           = 'https://us.api.battle.net/wow/';
const locale            = 'en_us';
const items: Item[]     = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'mainHand', 'offHand'];
const users: PlayerId[] = [
    { name: 'Xiama', realm: 'Thrall' },
    { name: 'TitanGrowth', realm: 'Thrall' },
    { name: 'Imagrilirl', realm: 'Thrall' },
    { name: 'Titanburn', realm: 'Thrall' },
    { name: 'Xzem', realm: 'Thrall' },
    { name: 'Starfailx', realm: 'Illidan' },
    { name: 'Jow', realm: 'Thrall' },
    { name: 'Starsixnine', realm: 'Illidan' },
    { name: 'Demeron', realm: 'Azuremyst' },
];

async function getWOWData(id: PlayerId): Promise<WOWData> {
    var resp = await Axios.get<WOWData>(`${baseURL}character/${id.realm}/${id.name}`, {
        params: {
           fields: 'items',
           locale,
           apikey: key
        }
    });
    return resp.data;
}

async function getIlvl(id: PlayerId) {
    const data = await getWOWData(id);
    return {
        ...id,
        ilvl: data.items.averageItemLevel,
        ilvlEquip: data.items.averageItemLevelEquipped,
        legendaryCount: items
            .map(itemName => data.items[itemName])
            .filter(item => item && item.quality === 5)
            .length
    }
}

async function onResponse(res: Response) {
    const chars = (await Promise.all(users.map(getIlvl)))
        .sort((a, b) => b.ilvlEquip - a.ilvlEquip)
        .map(char => `${char.name}: ${char.ilvlEquip}${'*'.repeat(char.legendaryCount)} (${char.ilvl})`);
    res.send(chars.join('\n'));
}

export = (robot: Robot) => robot.respond(/(ilvl)( me)?/i, async (res) => {
    try {
        await onResponse(res);
    } catch (e) {
        console.error(e);
    }
});
