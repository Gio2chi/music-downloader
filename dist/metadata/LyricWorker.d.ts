import WorkerInterface from "../core/WorkerInterface";
import { LyricTaskResult, LyricTask } from "./LyricTask";
export interface LyricWorker extends WorkerInterface<LyricTaskResult, LyricTask> {
    priority: number;
    busy: boolean;
    run: (task: LyricTask) => Promise<LyricTaskResult>;
}
