interface Matcher {
    (message: Hubot.Message): any;
}

interface ResponseCallback {
    (response: Hubot.Response): void;
}

declare namespace Hubot {
    export interface User {
        
    }
    
    export interface Brain {
        
    }
        
    export interface Robot extends NodeJS.EventEmitter {
        new (adapterPath: string, adapter: string, http: boolean, name?: string, alias?: boolean): Robot;
        hear(regex: RegExp, callback: ResponseCallback): void
        hear(regex: RegExp, options: any, callback: ResponseCallback): void;
    }
    
    export interface Adapter {
        
    }
    
    export interface Response {
        new (robot: Robot, message: Message, match: RegExpMatchArray): Response;
        send(...strings: string[]): void;
        random<T>(items: T[]): T;
    }
    
    export interface Listener {
        
    }
    
    export interface TextListener {
        
    }
    
    export interface Message {
        
    }
    
    export interface TextMessage {
        
    }
    
    export interface EnterMessage {
        
    }
    
    export interface LeaveMessage {
        
    }
    
    export interface TopicMessage {
        
    }
    
    export interface CatchAllMessage {
        
    }
}

declare module 'hubot' {
    export = Hubot
}