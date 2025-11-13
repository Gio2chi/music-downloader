import PriorityWorkerQueue from "../../core/PriorityWorkerQueue.js";
import { DownloadTask } from "../download/DownloadTask.js";
import DownloadWorker from "../download/DownloadWorker.js";
import getLogger from "../../core/logSystem.js";
import { LoggerConfigs, Modules } from "../../app/config/configs.js";
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
        getLogger(LoggerConfigs[Modules.TELEGRAM_WORKER]).debug('Inserting song in download queue...', { meta: { songId: task.track.id, clientUsername: (await this.client.getMe()).username } });
        this.songQ.addTask(new DownloadTask(body, task.handlers.onSuccess, task.handlers.onFailure));
    }
}
