/// <reference path="..\..\typings\main\ambient\node\index.d.ts" />
/// <reference path="node-scoped-http-client.d.ts" />

declare module "hubot" {
    import * as scoped from "scoped";

    type Matcher = (message: Message) => any;
    type ResponseCallback = (response: Response) => void;
    type ListenerCallback = (matcher: boolean) => void;

    interface Logger {
        debug: Function;
        info: Function;
        warning: Function;
        error: Function;
    }

    interface Envelope {
        message?: Message;
        user?: User;
        room?: string;
    }

    export interface User extends Object {
        id: string;
        name: string;
        room?: string;
    }

    export interface Brain {
        new(robot: Robot): Brain;
        set(key: any): void;
        set(key: string, value: any): void;
        get(key: any): any;
        remove(key: any): void;
        save(): void;
        close(): void;
        setAutoSave(enabled: boolean): void;
        resetSaveInterval(seconds: number): void;
        mergeData(data: any): void;
        users(): User[];
        userForId(id: string, options?: any): User;
        userForName(name: string): User;
        usersForRawFuzzyName(fuzzyName: string): User[];
        usersForFuzzyName(fuzzyName: string): User[];
    }

    export interface Robot extends NodeJS.EventEmitter {
        name: string;
        brain: Brain;
        alias: string;
        adapter: Adapter;
        logger: Logger;

        new(adapterPath: string, adapter: string, http: boolean, name?: string, alias?: boolean): Robot;
        hear(regex: RegExp, callback: ResponseCallback): void;
        hear(regex: RegExp, options: any, callback: ResponseCallback): void;
        respond(regex: RegExp, callback: ResponseCallback): void;
        respond(regex: RegExp, options: any, callback: ResponseCallback): void;
        enter(callback: ResponseCallback): void;
        enter(options: any, callback: ResponseCallback): void;
        leave(callback: ResponseCallback): void;
        leave(options: any, callback: ResponseCallback): void;
        topic(callback: ResponseCallback): void;
        topic(options: any, callback: ResponseCallback): void;
        error(callback: ResponseCallback): void;
        catchAll(callback: ResponseCallback): void;
        catchAll(options: any, callback: ResponseCallback): void;
        run(): void;
        shutdown(): void;
        http(url: string, options: scoped.Options): scoped.ScopedClient;
    }

    export interface Adapter extends NodeJS.EventEmitter {
        new(robot: Robot): Adapter;
        send(envelope: Envelope, ...strings: string[]): void;
        emote(envelope: Envelope, ...strings: string[]): void;
        reply(envelope: Envelope, ...strings: string[]): void;
        topic(envelope: Envelope, ...strings: string[]): void;
        play(envelope: Envelope, ...strings: string[]): void;
        run(): void;
        close(): void;
        receive(message: Message): void;
        users(): User[];
        userForId(id: string, options?: any): User;
        userForName(name: string): User;
        usersForRawFuzzyName(fuzzyName: string): User[];
        usersForFuzzyName(fuzzyName: string): User[];
        http(url: string): scoped.ScopedClient;
    }

    export interface Response {
        robot: Robot;
        message: Message;
        match: RegExpMatchArray;

        new(robot: Robot, message: Message, match: RegExpMatchArray): Response;
        send(...strings: string[]): void;
        emote(...strings: string[]): void;
        reply(...strings: string[]): void;
        topic(...strings: string[]): void;
        play(...strings: string[]): void;
        locked(...strings: string[]): void;
        random<T>(items: T[]): T;
        finish(): void;
        http(url: string, options?: scoped.Options): scoped.ScopedClient;
    }

    export interface Listener {
        new(robot: Robot, matcher: Matcher, callback: ResponseCallback): Listener;
        new(robot: Robot, matcher: Matcher, options: any, callback: ResponseCallback): Listener;
        call(message: Message, callback: ListenerCallback): boolean;
    }

    export interface TextListener extends Listener {
        new(robot: Robot, regex: RegExp, callback: ResponseCallback): TextListener;
        new(robot: Robot, regex: RegExp, options: any, callback: ResponseCallback): TextListener;
    }

    export interface Message {
        user: User;
        room: string;
        new(user: User, done?: boolean): Message;
        finish(): void;
    }

    export interface TextMessage extends Message {
        new(user: User, text: string, id: string): TextMessage;
        match(regex: RegExp): RegExpMatchArray;
        toString(): string;
    }

    export interface EnterMessage extends Message {
    }

    export interface LeaveMessage extends Message {
    }

    export interface TopicMessage extends Message {
    }

    export interface CatchAllMessage extends Message {
        new(message: Message): CatchAllMessage;
    }
}