import WorkerInterface from "../core/WorkerInterface.js";
import DownloadResolver from "./DownloadResolver.js";
import { DownloadTask, DownloadTaskBody, DownloadTaskResult } from "./DownloadTask.js";
export default class DownloadWorker implements WorkerInterface<DownloadTaskBody, DownloadTaskResult> {
    priority: number;
    busy: boolean;
    resolver: DownloadResolver;
    constructor(resolver: DownloadResolver, priority?: number);
    run(task: DownloadTask): Promise<DownloadTaskResult>;
}
