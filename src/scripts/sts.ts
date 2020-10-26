// Description:
//  Search the Slay the Spire wiki for image of a card
//
// Commands:
//  hubot sts me <card> - return an image of a card
//
//
//
//
//
//
//
// Author:
//  Steve Shipsey

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Robot } from 'hubot';

const otherCards: { [key: string]: string } = {
    Defend:
        'https://vignette.wikia.nocookie.net/slay-the-spire/images/7/7d/Defend_R.png/revision/latest/scale-to-width-down/620?cb=20181016205732',
    Strike:
        'https://vignette.wikia.nocookie.net/slay-the-spire/images/0/06/Strike_R.png/revision/latest/scale-to-width-down/620?cb=20181016211045',
};

const fetchCard = async (card: string) => {
    const BASE_URL = 'https://slay-the-spire.fandom.com/wiki';
    const result = await axios.get(`${BASE_URL}/${card}`);
    const $ = cheerio.load(result.data);
    return (
        ($('.pi-image-thumbnail') && $('.pi-image-thumbnail')[0] && $('.pi-image-thumbnail')[0].attribs.src) ||
        'Card not found'
    );
};

export = (robot: Robot): void =>
    robot.respond(/sts( me)?( (.+))/i, async (res) => {
        const card = res.match[2].trim().replace(' ', '_');

        return otherCards[card] ? res.send(otherCards[card]) : res.send(await fetchCard(card));
    });
