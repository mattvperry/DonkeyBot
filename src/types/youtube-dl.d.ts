declare module 'youtube-dl' {
    import { Readable } from 'stream';

    namespace YoutubeDL {
        interface VideoInfo {
            title: string;
            url: string;
            format_id: number;
            webpage_url: string;
            duration: string;
            _duration_raw: number;
        }

        function exec(url: string, args: string[], callback: Function): void;
        function exec(url: string, args: string[], opts: any, callback: Function): void;
        function getInfo(url: string, args: string[], callback: (info: VideoInfo) => void): void;
        function getInfo(url: string, args: string[], opts: any, callback: (info: VideoInfo) => void): void;
        function getFormats(url: string, args: string[], callback: Function): void;
        function getSubs(url: string, args: string[], callback: Function): void;
        function getExtractors(descriptions: boolean, args: string[], callback: Function): void;
    }

    function YoutubeDL(url: string, args?: string[], opts?: any): Readable;
    export = YoutubeDL;
}
