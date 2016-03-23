declare module "goo.gl" {
    interface GoogleOptions {
        uri?: string;
        qs?: any;
        encoding?: string;
        json?: boolean;
    }

    export function shorten(url: string, extraOptions?: GoogleOptions): Promise<any>;
    export function expand(url: string, extraOptions?: GoogleOptions): Promise<any>;
    export function analytics(url: string, extraOptions?: GoogleOptions): Promise<any>;
    export function setKey(key: string): void;
    export function getKey(): string;
}