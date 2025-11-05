import WorkerInterface from "../core/WorkerInterface.js";
import { LyricTask } from "./LyricTask.js";
import { TLyricTaskResult } from "../types/index.js"

export interface LyricWorkerInterface extends WorkerInterface<TLyricTaskResult, LyricTask> {
    priority: number;
    busy: boolean;
    
    // in order to fall in the fail branch of a PriorityWorkerQueue, the task has to throw
    throwOnUnsynced: boolean

    run: (task: LyricTask) => Promise<TLyricTaskResult>;
}