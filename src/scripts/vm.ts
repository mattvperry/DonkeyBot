// Description:
//  Run arbitrary js/ts code inside a node vm
//
// Commands:
//  hubot run
//
// Author:
//  Matt Perry

import { Robot } from 'hubot';
import { create } from 'ts-node';
import { NodeVM } from 'vm2';

import crypto from 'crypto';

const md5 = (input: string) =>
    crypto
        .createHash('md5')
        .update(input)
        .digest('hex');

type SupportedConsoleFns = 'log' | 'warn' | 'error';
const consoleFns: SupportedConsoleFns[] = ['log', 'warn', 'error'];

function repr(obj: any): string {
    if (obj == null || typeof obj === 'string' || typeof obj === 'number') {
        return String(obj);
    }

    if (Array.isArray(obj)) {
        return `[${Array.prototype.map.call(obj, repr).join(', ')}]`;
    }

    if (obj.toString) {
        return obj.toString();
    }

    return String(obj);
}

export = (robot: Robot) => {
    const compiler = create({
        transpileOnly: true,
    });

    robot.respond(/run(?:.*?)`(?:``)?(.*)`(?:``)?/is, resp => {
        const code = resp.match[1].trim();

        const vm = new NodeVM({
            compiler: (c, f) => compiler.compile(c, f),
            console: 'redirect',
            timeout: 5000,
            sandbox: {},
        });

        const msgs: string[][] = [];
        for (const fn of consoleFns) {
            vm.on(`console.${fn}`, (...args: Parameters<Console[SupportedConsoleFns]>) => {
                msgs.push(args.map(repr));
            });
        }

        vm.run(code, `VM:${md5(code)}`);

        resp.send(...msgs.map(m => m.join(' ')));
    });
};
