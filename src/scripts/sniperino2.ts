// Description:
//  Beat the sniperino
//
//
// Commands:
//  sniperino( me)? - start a new game of sniperino
//
//
// Author:
//  Steve Shipsey
//  Matt Perry

import { Brain, Response, Robot } from 'hubot';

enum GameResult {
    Win,
    Draw,
    Lose,
}

interface Game {
    readonly snipe: number;
    readonly userId: string;
}

interface PlayerStats {
    readonly gamesPlayed: number;
    readonly gamesWon: number;
    readonly userId: string;
}

interface SniperState {
    readonly games: Record<string, Game | undefined>;
    readonly stats: Record<string, PlayerStats | undefined>;
}

interface GameContext {
    readonly brain: Brain;
    readonly userId: string;
    readonly roll: number;
    readonly snipe: number;
}

type stringKeys = 'new' | 'dupe' | GameResult;
const stringFns: Record<stringKeys, (context: GameContext) => string> = {
    dupe: () => '',
    new: () => '',
    [GameResult.Win]: () => '',
    [GameResult.Draw]: () => '',
    [GameResult.Lose]: () => '',
};

const calculateWinRate = ({ gamesPlayed, gamesWon }: PlayerStats) =>
    gamesPlayed > 0 ? Math.round(gamesWon / gamesPlayed * 10000) / 100 : 0;

const loadState = (brain: Brain): SniperState => {
    const state = brain.get<SniperState>('sniperino');
    if (state) {
        return state;
    }

    const newState = { games: {}, stats: {} };
    brain.set('sniperino', newState);
    return newState;
};

const playGame = ({ roll, snipe }: GameContext) => {
    if (roll > snipe) {
        return GameResult.Win;
    }

    if (roll === snipe) {
        return GameResult.Draw;
    }

    return GameResult.Lose;
};

export = (robot: Robot) => {
    robot.respond(/sniperino stats( me)?/i, res => {
        const { stats } = loadState(robot.brain);
        const message = Object.values(stats)
            .filter(<T>(x?: T): x is T => x !== undefined)
            .map(stat => ({ ...stat, winRate: calculateWinRate(stat) }))
            .sort((a, b) => b.winRate - a.winRate)
            .map(({ userId, winRate }) => `${robot.brain.userForId(userId).name}: ${winRate}%`)
            .join('\n');

        res.send(message);
    });

    robot.respond(/sniperino( me)?$/i, res => {
        const state = loadState(robot.brain);
        const userId = res.message.user.id;
        if (state.games[userId] === undefined) {
            state.games[userId] = {
                snipe: Math.floor(Math.random() * 99) + 1,
                userId,
            };
        } else {
            // ...
        }
    });

    robot.on('roll', (res: Response, roll: number, max: number) => {
        // If someone rolled out of something other than 100, they are
        // either not playing sniperino or trying to cheat.
        if (max !== 100) {
            return;
        }

        // If there are no active games then this was just an ordinary roll
        const state = loadState(robot.brain);
        const userId = res.message.user.id;
        const game = state.games[userId];
        if (game === undefined) {
            return;
        }

        // Play
        const context = {
            brain: robot.brain,
            roll,
            snipe: game.snipe,
            userId,
        };
        const result = playGame(context);
        const { gamesPlayed, gamesWon } = state.stats[userId] || { gamesPlayed: 0, gamesWon: 0 };
        state.stats[userId] = {
            gamesPlayed: (result !== GameResult.Draw ? gamesPlayed + 1 : gamesPlayed),
            gamesWon: (result === GameResult.Win ? gamesWon + 1 : gamesWon),
            userId,
        };

        // Remove active game
        delete state.games[res.message.user.id];
    });
};
