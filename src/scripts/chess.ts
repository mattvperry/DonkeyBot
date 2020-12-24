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

import ChessWebAPI, { Response, PlayerStats } from 'chess-web-api';
import Table from 'cli-table3';
import { Robot, Brain } from 'hubot';

import { promisify } from 'util';

interface ChessState {
    players: string[];
}

const chessApi = new ChessWebAPI({
    queue: true,
});

const categories = ['daily', 'rapid', 'bullet', 'blitz'] as const;

const loadState = (brain: Brain): ChessState => {
    const state = brain.get<ChessState>('chess');
    if (state) {
        return state;
    }

    const newState = { players: [] };
    brain.set('chess', newState);
    return newState;
};

const getStats = promisify<string, Response<PlayerStats>>((username, cb) =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    chessApi.dispatch(chessApi.getPlayerStats, (res, err) => cb(err, res), [username]),
);

export = (robot: Robot): void => {
    robot.respond(/elo me/i, async (res) => {
        const state = loadState(robot.brain);
        if (state.players.length === 0) {
            res.send('```No chess players are currently tracked.```');
            return;
        }

        const results = await Promise.all(state.players.map(async (p) => [p, await getStats(p)] as const));
        const stats = results.map(([name, { body }]) => ({
            name,
            ...Object.fromEntries(categories.map((c) => [c, body[`chess_${c}` as const]?.last?.rating ?? 'N/A'])),
        }));

        const table = new Table({
            head: Object.keys(stats[0]),
        });

        table.push(...stats.map(Object.values));

        res.send(`\`\`\`${table.toString()}\`\`\``);
    });

    robot.respond(/elo add (.*)/i, async (res) => {
        const name = res.match[1];
        const state = loadState(robot.brain);
        if (state.players.includes(name)) {
            return;
        }

        try {
            await getStats(name);
            state.players.push(name);
        } catch {
            res.reply(`Failed to add: ${name}`);
        }
    });

    robot.respond(/elo remove (.*)/i, (res) => {
        const name = res.match[1];
        const state = loadState(robot.brain);
        const idx = state.players.indexOf(name);
        if (idx === -1) {
            return;
        }

        state.players.splice(idx, 1);
    });
};
