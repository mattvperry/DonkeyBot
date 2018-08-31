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

enum GameEvent {
    New = 'new',
    Dupe = 'dupe',
    Win = 'win',
    Draw = 'draw',
    Lose = 'lose',
}

interface PlayerStats {
    readonly gamesPlayed: number;
    readonly gamesWon: number;
    readonly userId: string;
}

interface SniperState {
    readonly games: Partial<Record<string, number>>;
    readonly stats: Partial<Record<string, PlayerStats>>;
}

interface GameContext {
    readonly name: string;
    readonly snipe?: number;
    readonly roll?: number;
}

const loadState = (brain: Brain): SniperState => {
    const state = brain.get<SniperState>('sniperino');
    if (state) {
        return state;
    }

    const newState = { games: {}, stats: {} };
    brain.set('sniperino', newState);
    return newState;
};

const playGame = (roll: number, snipe: number) => {
    if (roll > snipe) {
        return GameEvent.Win;
    }

    if (roll === snipe) {
        return GameEvent.Draw;
    }

    return GameEvent.Lose;
};

const calculateWinRate = ({ gamesPlayed, gamesWon }: PlayerStats) =>
    gamesPlayed > 0 ? Math.round(gamesWon / gamesPlayed * 10000) / 100 : 0;

const stringFns: Record<GameEvent, (c: GameContext) => string> = {
    [GameEvent.New]: ({ name, snipe }) =>
        `ヽ༼ຈل͜ຈ༽_•︻̷̿┻̿═━一 ༼ つ ಥ_ಥ ༽つ ${name}, roll higher than a ${snipe} or the donger gets it!`,
    [GameEvent.Dupe]: ({ name }) =>
        `(ノಠ益ಠ)ノ彡┻━┻ YOU ARE ALREADY PLAYING SNIPERINO, ${name}. I oughtta sniperino YOU! ༼ຈل͜ຈ༽_•︻̷̿┻̿═━一`,
    [GameEvent.Win]: ({ name, roll }) =>
        `(◠‿◠✿) ${name}, you roll a ${roll} and the donger lives! The donger thanks you (◠‿◠✿)`,
    [GameEvent.Draw]: ({ name, roll }) =>
        `ヽ༼ຈل͜ຈ༽/ ${name}, you roll a ${roll} and tie! The donger is merely wounded. He will recover! ヽ༼ຈل͜ຈ༽/`,
    [GameEvent.Lose]: ({ name }) =>
        `༼ つ x_x ༽つThe donger is dead. ${name}, you did this! You MONSTER! ༼ つ x_x ༽ つ`,
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
        const { name, id } = res.message.user;
        if (state.games[id] !== undefined) {
            res.send(stringFns[GameEvent.Dupe]({ name }));
            return;
        }

        const snipe = Math.floor(Math.random() * 99) + 1;
        state.games[id] = snipe;
        res.send(stringFns[GameEvent.New]({ name, snipe }));
    });

    robot.on('roll', (res: Response, roll: number, max: number) => {
        // If someone rolled out of something other than 100, they are
        // either not playing sniperino or trying to cheat.
        if (max !== 100) {
            return;
        }

        // If there are no active games then this was just an ordinary roll
        const state = loadState(robot.brain);
        const { name, id } = res.message.user;
        const snipe = state.games[id];
        if (snipe === undefined) {
            return;
        }

        const {
            gamesPlayed = 0,
            gamesWon = 0
        } = state.stats[id] || {};

        // Play game
        const event = playGame(roll, snipe);
        state.stats[id] = {
            gamesPlayed: (event !== GameEvent.Draw ? gamesPlayed + 1 : gamesPlayed),
            gamesWon: (event === GameEvent.Win ? gamesWon + 1 : gamesWon),
            userId: id,
        };

        res.send(stringFns[event]({ name, roll }));

        delete state.games[id];
    });
};
