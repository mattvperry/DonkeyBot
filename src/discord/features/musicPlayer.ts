export interface MusicPlayer {

}

export interface MusicManager {
    isPlaying(): this is MusicPlayer;
}

export class Music implements MusicManager, MusicPlayer {
    private playing = false;

    private constructor() {
    }

    public isPlaying(): this is MusicPlayer {
        return this.playing;
    }
}