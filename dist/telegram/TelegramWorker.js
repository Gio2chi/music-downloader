import PriorityWorkerQueue from "../core/PriorityWorkerQueue.js";
import { DownloadTask } from "../download/DownloadTask.js";
import DownloadWorker from "../download/DownloadWorker.js";
const SongQueue = (PriorityWorkerQueue);
export default class TelegramWorker {
    constructor(client, resolvers) {
        this.priority = 0;
        this.busy = false;
        this.client = client;
        let songWorkers = resolvers.map((resolver) => new DownloadWorker(resolver, resolver.getPriority()));
        this.songQ = new SongQueue(songWorkers);
    }
    async run(task) {
        let body = { ...task, client: this.client };
        this.songQ.addTask(new DownloadTask(body, task.handlers.onSuccess, task.handlers.onFailure));
    }
}
