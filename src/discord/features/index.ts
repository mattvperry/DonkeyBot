import { GamesNotificationFeature } from './gamesNotificationFeature';
import { MusicPlayerFeature } from './musicPlayerFeature';

export interface Feature {
    setup(): void;
}

export const features = [
    GamesNotificationFeature,
    MusicPlayerFeature,
];