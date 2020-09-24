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
import { VM } from 'vm2';

import crypto from 'crypto';

const md5 = (input: string) => crypto.createHash('md5').update(input).digest('hex');

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

const makeConsole = (output: string[]) => ({
    log: (...args: any[]) => output.push(args.map(repr).join(' ')),
});

export = (robot: Robot) => {
    const compiler = create({
        transpileOnly: true,
    });

    robot.respond(/run(?:.*?)`(?:``(?:ts|js)?)?(.*)`(?:``)?/is, (resp) => {
        const output: string[] = [];
        const code = resp.match[1].trim();

        const vm = new VM({
            compiler: (c) => compiler.compile(c, `VM:${md5(c)}`),
            timeout: 5000,
            sandbox: {
                console: makeConsole(output),
            },
        });

        vm.run(code);

        if (output.length > 0) {
            resp.send(`\`\`\`${output.join('\n')}\`\`\``);
        } else {
            resp.send('Script executed with no output.');
        }
    });
};
