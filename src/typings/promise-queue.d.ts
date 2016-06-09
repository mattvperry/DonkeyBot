interface QueueStatic {
    new(maxConcurrent?: number, maxQueued?: number): Queue;
}

interface Queue {
    queue: Function[];
    add(generator: Function): Promise<void>;
    getQueueLength(): number;
    getPendingLength(): number;
}

declare module "promise-queue" {
    let queue: QueueStatic;
    export = queue;
}