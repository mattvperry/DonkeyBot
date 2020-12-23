declare module 'chess-web-api' {
    export interface Response<T> {
        body: T;
        headers: { [name: string]: string };
        statusCode: number;
    }

    interface ChessStat {
        date: number;
        rating: number;
    }

    interface BestStat extends ChessStat {
        game: string;
    }

    interface LastStat extends ChessStat {
        rd: number;
    }

    interface Record {
        draw: number;
        loss: number;
        win: number;
    }

    interface ChessStats {
        best: BestStat;
        last: LastStat;
        record: Record;
    }

    export interface PlayerStats {
        chess_blitz?: ChessStats;
        chess_bullet?: ChessStats;
        chess_daily?: ChessStats;
        chess_rapid?: ChessStats;
    }

    interface ChessWebAPIOptions {
        queue: boolean,
    }

    interface ChessWebAPIConstructor {
        new (options?: ChessWebAPIOptions): ChessWebAPI;
    }

    type Unwrap<T> = T extends Promise<infer U> ? U : never;

    interface ChessWebAPI {
        getPlayerStats(username: string): Promise<Response<PlayerStats>>;
        dispatch<T extends ChessWebAPI[Exclude<keyof ChessWebAPI, 'dispatch'>]>(
            method: T,
            cb: (res: Unwrap<ReturnType<T>>, err?: any) => void,
            params: Parameters<T>): void;
    }

    const ChessWebAPI: ChessWebAPIConstructor;
    export default ChessWebAPI;
}