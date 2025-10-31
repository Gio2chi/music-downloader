import { TelegramClient } from "telegram";
import PriorityWorkerQueue from "../core/PriorityWorkerQueue.js";
import WorkerInterface from "../core/WorkerInterface.js";
import DownloadResolver from "../download/DownloadResolver.js";
import { DownloadTaskResult, DownloadTask } from "../download/DownloadTask.js";
import DownloadWorker from "../download/DownloadWorker.js";
import { TelegramTask } from "./TelegramTask.js";
declare const SongQueue: {
    new (workers: DownloadWorker[]): PriorityWorkerQueue<DownloadTaskResult, DownloadTask, DownloadWorker>;
};
type SongQueue = InstanceType<typeof SongQueue>;
export default class TelegramWorker implements WorkerInterface<void, TelegramTask> {
    priority: number;
    busy: boolean;
    client: TelegramClient;
    songQ: SongQueue;
    constructor(client: TelegramClient, resolvers: DownloadResolver[]);
    run(task: TelegramTask): Promise<void>;
}
export {};
