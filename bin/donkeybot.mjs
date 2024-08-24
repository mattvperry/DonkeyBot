import fs from 'node:fs'
import path from 'node:path'

const robot = (await import('../node_modules/hubot/bin/Hubot.mjs')).default;

const File = fs.promises
robot.on('running', async () => {
    await load(path.resolve('.', 'scripts'));
    await load(path.resolve('.', 'src', 'scripts'));
});

async function loadFile (filepath, filename) {
    const ext = path.extname(filename)?.replace('.', '')
    const full = path.join(filepath, path.basename(filename))

    // see https://github.com/hubotio/hubot/issues/1355
    if (['mts'].indexOf(ext) === -1) {
        robot.logger.debug(`Skipping unsupported file type ${full}`)
        return null
    }
    let result = null
    try {
        result = await robot.loadmjs(full);
        robot.parseHelp(full)
    } catch (error) {
        robot.logger.error(`Unable to load ${full}: ${error.stack}`)
        throw error
    }
    return result
}

async function load (path) {
    robot.logger.debug(`Loading scripts from ${path}`)
    const results = []
    try {
        const folder = await File.readdir(path, { withFileTypes: true })
        for await (const file of folder) {
        if (file.isDirectory()) continue
        try {
            const result = loadFile(path, file.name);
            results.push(result)
        } catch (e) {
            robot.logger.error(`Error loading file ${file.name} - ${e.stack}`)
        }
        }
    } catch (e) {
        robot.logger.error(`Path ${path} does not exist`)
    }
    return results
}
