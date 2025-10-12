import { TelegramClient } from "telegram";
import PriorityWorkerQueue from "../core/PriorityWorkerQueue";
import WorkerInterface from "../core/WorkerInterface";
import DownloadResolver from "../download/DownloadResolver";
import { DownloadTaskBody, DownloadTaskResult, DownloadTask } from "../download/DownloadTask";
import DownloadWorker from "../download/DownloadWorker";
import { TelegramTask, TelegramTaskBody } from "./TelegramTask";

const SongQueue = PriorityWorkerQueue<DownloadTaskBody, DownloadTaskResult, DownloadWorker>;
type SongQueue = InstanceType<typeof SongQueue>;

export default class TelegramWorker implements WorkerInterface<TelegramTaskBody, void> {
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
        let body: DownloadTaskBody = {...task.body, client: this.client}
        this.songQ.addTask(new DownloadTask(body))
    }
}