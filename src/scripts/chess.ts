// Description:
//  Track chess.com rankings of a set of players
//
// Commands:
//  hubot elo add <user> - add chess.com user to tracked users
//  hubot elo remove <user> - remove chess.com user from tracked users
//  hubot elo me - print table of ELO rankings
//
// Author:
//  Matt Perry

import { Robot } from 'hubot';
import ChessWebAPI, { Response, PlayerStats } from 'chess-web-api';
import { promisify } from 'util';

const chessApi = new ChessWebAPI({
    queue: true
});

const categories = ['daily', 'rapid', 'bullet', 'blitz'] as const;
const players = ['sshipsey', 'heartless_xandra'];

const getStats = promisify<string, Response<PlayerStats>>(
    (username, cb) => chessApi.dispatch(chessApi.getPlayerStats, (res, err) => cb(err, res), [username])
);

export = (robot: Robot): void => {
    robot.respond(/(elo)( me)?/i, async res => {
        const results = await Promise.all(players.map(async p => [p, await getStats(p)] as const));
        const stats = results.map(([name, { body }]) => ({
            name,
            ...Object.fromEntries(categories.map(c => [c, body[`chess_${c}` as const]?.last?.rating ?? 'N/A']))
        }));

        res.send(`\`\`\`${stats}\`\`\``);
    });
}