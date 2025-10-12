import { TelegramClient } from "telegram";
import PriorityWorkerQueue from "../core/PriorityWorkerQueue.js";
import WorkerInterface from "../core/WorkerInterface.js";
import DownloadResolver from "../download/DownloadResolver.js";
import { DownloadTaskBody, DownloadTaskResult } from "../download/DownloadTask.js";
import DownloadWorker from "../download/DownloadWorker.js";
import { TelegramTask, TelegramTaskBody } from "./TelegramTask.js";
declare const SongQueue: {
    new (workers: DownloadWorker[]): PriorityWorkerQueue<DownloadTaskBody, DownloadTaskResult, DownloadWorker>;
};
type SongQueue = InstanceType<typeof SongQueue>;
export default class TelegramWorker implements WorkerInterface<TelegramTaskBody, void> {
    priority: number;
    busy: boolean;
    client: TelegramClient;
    songQ: SongQueue;
    constructor(client: TelegramClient, resolvers: DownloadResolver[]);
    run(task: TelegramTask): Promise<void>;
}
export {};
