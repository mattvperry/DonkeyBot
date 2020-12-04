// Description:
//  Wow ilvl commands for our friends
//
// Commands:
//  hubot ilvl me - take out the measuring stick
//
// Author:
//  Matt Perry

import Axios from 'axios';
import { Response, Robot } from 'hubot';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

interface WOWData {
    average_item_level: number;
    equipped_item_level: number;
}

interface RaiderIO {
    name: string;
    mythic_plus_scores: {
        all: number;
        dps: number;
        healer: number;
        tank: number;
    };
}

interface PlayerId {
    name: string;
    realm: string;
}

const clientId = '623be047103444b7b2953c1100546be5';
const secret = process.env.HUBOT_WOW_API_KEY ?? '';
const battenetUrl = 'https://us.api.blizzard.com';
const raiderIOUrl = 'https://raider.io/api/v1';
const users: PlayerId[] = [
    { name: 'titansmite', realm: 'thrall' },
    // { name: 'xiala', realm: 'thrall' },
    // { name: 'iambushman', realm: 'thrall' },
    { name: 'yva', realm: 'thrall' },
    { name: 'starfail', realm: 'illidan' },
];

async function getToken(): Promise<string> {
    const resp = await Axios.get<TokenResponse>('https://us.battle.net/oauth/token', {
        auth: {
            username: clientId,
            password: secret,
        },
        params: {
            grant_type: 'client_credentials',
        },
    });

    return resp.data.access_token;
}

async function getIlvl(id: PlayerId, token: string) {
    const resp = await Axios.get<WOWData>(`${battenetUrl}/profile/wow/character/${id.realm}/${id.name}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: {
            namespace: 'profile-us',
            locale: 'en-US',
        },
    });

    return {
        ...id,
        ilvl: resp.data.average_item_level,
        ilvlEquip: resp.data.equipped_item_level,
    };
}

async function getRaiderIO(id: PlayerId) {
    const resp = await Axios.get<RaiderIO>(`${raiderIOUrl}/characters/profile`, {
        params: {
            fields: 'mythic_plus_scores',
            name: id.name,
            realm: id.realm,
            region: 'us',
        },
    });

    return resp.data;
}

async function makeRanking<T>(
    getter: (id: PlayerId) => Promise<T>,
    sortProp: (item: T) => number,
    display: (item: T) => string,
) {
    return (await Promise.all(users.map(getter)))
        .sort((a, b) => sortProp(b) - sortProp(a))
        .map(display)
        .join('\n');
}

async function ilevelList(res: Response) {
    const token = await getToken();
    res.send(
        await makeRanking(
            (id) => getIlvl(id, token),
            (i) => i.ilvlEquip,
            (c) => `${c.name}: ${c.ilvlEquip} (${c.ilvl})`,
        ),
    );
}

async function raiderioScore(res: Response) {
    res.send(
        await makeRanking(
            getRaiderIO,
            (i) => i.mythic_plus_scores.all,
            (c) => `${c.name}: ${c.mythic_plus_scores.all}`,
        ),
    );
}

async function affixes(res: Response) {
    const resp = await Axios.get<{ title: string }>(`${raiderIOUrl}/mythic-plus/affixes`, {
        params: { region: 'us' },
    });

    res.send(resp.data.title);
}

export = (robot: Robot): void => {
    robot.respond(/(ilvl)( me)?/i, async (res) => {
        try {
            await ilevelList(res);
        } catch (e) {
            console.error(e);
        }
    });

    robot.respond(/(raider)?(io)( me)?/i, async (res) => {
        try {
            await raiderioScore(res);
        } catch (e) {
            console.error(e);
        }
    });

    robot.respond(/(affixes)( me)?/i, async (res) => {
        try {
            await affixes(res);
        } catch (e) {
            console.error(e);
        }
    });
};
