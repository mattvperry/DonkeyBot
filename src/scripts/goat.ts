import { Robot } from 'hubot';

const getGoatLink = (): string => {
    const random = () => Math.floor(Math.random() * 20);

    if (random() === 1) {
        return 'https://i.imgur.com/eHd8Oy7.jpg';
    }
    return `https://placegoat.com/400/400?cachebust=${random() * random()}`;
};

export = (robot: Robot) =>
    robot.respond(/(goat)( me)?/i, res => {
        res.send(getGoatLink());
    });
