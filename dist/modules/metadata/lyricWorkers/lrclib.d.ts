import { TLyricTaskResult } from "../../../types/Lyric.js";
import { LyricTask } from "../LyricTask.js";
import { LyricWorkerInterface } from "../LyricWorkerInterface.js";
export declare class lrclibWorker implements LyricWorkerInterface {
    priority: number;
    busy: boolean;
    throwOnUnsynced: boolean;
    constructor(priority?: number, throwOnUnsynced?: boolean);
    run(task: LyricTask): Promise<TLyricTaskResult>;
}
