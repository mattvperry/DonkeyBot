/// <reference path="..\..\typings\main\ambient\node\index.d.ts" />

interface VideoInfo {
    url: string;
}

interface YoutubeDL {
    (url: string, args?: string[], opts?: any): NodeJS.ReadableStream;
    exec(url: string, args: string[], callback: Function): void;
    exec(url: string, args: string[], opts: any, callback: Function): void;
    getInfo(url: string, args: string[], callback: (info: VideoInfo) => void): void;
    getInfo(url: string, args: string[], opts: any, callback: (info: VideoInfo) => void): void;
    getFormats(url: string, args: string[], callback: Function): void;
    getSubs(url: string, args: string[], callback: Function): void;
    getExtractors(descriptions: boolean, args: string[], callback: Function): void;
}

declare module "youtube-dl" {
    let ytdl: YoutubeDL;
    export = ytdl;
}