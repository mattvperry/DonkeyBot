function padNumber(num: number) {
    return num < 10 ? `0${num}` : num.toString();
}

export default function msToTimestamp(ms: number) {
    const seconds = padNumber(Math.floor((ms / 1000) % 60));
    const minutes = padNumber(Math.floor((ms / (1000 * 60)) % 60));
    const hours = ((x) => x > 0 && x.toString())(Math.floor(ms / (1000 * 60 * 60)));
    return [hours, minutes, seconds].filter(<T>(x: T | false): x is T => x !== false).join(':');
}
