/// <reference path="..\..\typings\main\ambient\node\index.d.ts" />

declare module "mumble" {
    import { Buffer } from "buffer";
    import { ConnectionOptions } from "tls";
    import { Duplex, ReadableOptions, WritableOptions } from "stream";
    import { EventEmitter } from "events";

    type ConnectCallback = (err: any, cli: MumbleClient) => void;

    interface MumbleStreamOptions {
        channels?: number;
        whisperId?: number;
        sampleRate?: number;
        gain?: number;
        bitDepth?: number;
        signed?: boolean;
        endianness?: string;
    }

    interface MessageRecipients {
        session?: number[];
        channel_id?: number[];
    }

    interface UserData {
        session: number;
        name: string;
        user_id: number;
        mute: boolean;
        deaf: boolean;
        suppress: boolean;
        self_mute: boolean;
        self_deaf: boolean;
        hash: string;
        recording: boolean;
        priority_speaker: boolean;
        channel_id?: number;
    }

    interface User extends NodeJS.EventEmitter {
        session: number;
        name: string;
        id: number;
        mute: boolean;
        deaf: boolean;
        suppress: boolean;
        selfMute: boolean;
        selfDeaf: boolean;
        hash: string;
        recording: boolean;
        prioritySpeaker: boolean;
        channel: Channel;

        new(data: UserData, client: MumbleClient): User;
        moveToChannel(channel: string|Channel): void;
        setSelfDeaf(isSelfDeaf: boolean): void;
        setSelfMute(isSelfMute: boolean): void;
        kick(reason?: string): void;
        ban(reason?: string): void;
        sendMessage(message: string): void;
        outputStream(noEmptyFrames: boolean): MumbleOutputStream;
        inputStream(): MumbleInputStream;
        canTalk(): boolean;
        canHear(): boolean;
    }

    interface ChannelData {
        channel_id: number;
        name: string;
        links: { [k: string]: number };
        temporary: boolean;
        position: number;
        parent?: number;
    }

    interface Channel extends NodeJS.EventEmitter {
        id: number;
        name: string;
        links: Channel[];
        temporary: boolean;
        position: number;
        parent?: Channel;
        children: Channel[];
        users: User[];

        new(data: ChannelData, client: MumbleClient): Channel;
        join(): void;
        sendMessage(message: string): void;
        getPermissions(callback: Function): void;
        addSubChannel(name: string, options?: { temporary: boolean }): void;
        remove(): void;
    }

    interface MumbleInputStream extends NodeJS.WritableStream {
        new(connection: MumbleConnection, options: MumbleStreamOptions & WritableOptions): MumbleInputStream;
        close(): void;
        setGain(gain: number): void;
    }

    interface MumbleOutputStream extends NodeJS.ReadableStream {
        new(connection: MumbleConnection, sessionId: number, options: { noEmptyFrames: boolean } & ReadableOptions): MumbleOutputStream;
        close(): void;
    }

    export interface MumbleClient extends NodeJS.EventEmitter {
        ready: boolean;
        connect: MumbleConnection;
        rootChannel: Channel;
        user: User;

        new(connection: MumbleConnection): MumbleClient;

        authenticate(name: string, password?: string, tokens?: string[]): void;
        sendMessage(message: string, recipients: MessageRecipients): void;

        users(): User[];
        userById(id: number): User;
        userBySession(id: number): User;
        userByName(name: string): User;
        channelById(id: number): Channel;
        channelByName(name: string): Channel;
        channelByPath(path: string): Channel;

        outputStream(userid?: number): MumbleOutputStream;
        inputStream(options: MumbleStreamOptions): MumbleInputStream;
        inputStreamForUser(sessionId: number, options?: MumbleStreamOptions): MumbleInputStream;

        joinPath(path: string): void;
        sendVoice(chunk: Buffer): void;
        disconnect(): void;
    }

    export class MumbleConnection extends EventEmitter {
        constructor(socket: Duplex, options?: any);
        initialize(): void;
        setBitrate(bitrate: number): void;
        authenticate(name: string, password?: string, tokens?: string[]): void;
        sendMessage(type: string, data: { actor: number, message: string });
        outputStream(noEmtpyFrames: boolean): MumbleOutputStream;
        outputStream(userSession: number, noEmptyFrames: boolean): MumbleOutputStream;
        inputStream(options: MumbleStreamOptions): MumbleInputStream;
        joinPath(path: string): void;
        sendVoice(chunk: Buffer, whisperTarget?: number): void;
        sendVoiceFrame(frame: Buffer, whisperTarget?: number, voiceSequence?: number): void;
        sendEncodedFrame(packet: Buffer|Buffer[], codec: number, whisperTarget?: number, voiceSequence?: number): void;
        disconnect(): void;
    }

    export class MumbleConnectionManager {
        constructor(url: string, options: ConnectionOptions);
        connect(done: ConnectCallback): void;
    }

    export function connect(url: string, callback: ConnectCallback): MumbleConnectionManager;
    export function connect(url: string, options: ConnectionOptions, callback: ConnectCallback): MumbleConnectionManager;
}