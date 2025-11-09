import { TelegramClient } from "telegram";
import PriorityWorkerQueue from "../../core/PriorityWorkerQueue.js";
import WorkerInterface from "../../core/WorkerInterface.js";
import DownloadResolver from "../download/DownloadResolver.js";
import { DownloadTaskBody, DownloadTaskResult, DownloadTask } from "../download/DownloadTask.js";
import DownloadWorker from "../download/DownloadWorker.js";
import { TelegramTask } from "./TelegramTask.js";

const SongQueue = PriorityWorkerQueue<DownloadTaskResult, DownloadTask, DownloadWorker>;
type SongQueue = InstanceType<typeof SongQueue>;

export default class TelegramWorker implements WorkerInterface<void, TelegramTask> {
    priority: number = 0;
    busy: boolean = false;
    client: TelegramClient

    songQ: SongQueue;
    constructor(client: TelegramClient, resolvers: DownloadResolver[]) {
        this.client = client
        let songWorkers = resolvers.map((resolver) => new DownloadWorker(resolver, resolver.getPriority()))
        this.songQ = new SongQueue(songWorkers)
    }

    async run(task: TelegramTask): Promise<void> {
        let body: DownloadTaskBody = { ...task, client: this.client }
        this.songQ.addTask(new DownloadTask(body, task.handlers.onSuccess, task.handlers.onFailure))
    }
}