import { LoggerConfigs, Modules } from "../../app/config/configs.js";
import getLogger from "../../core/logSystem.js";
import WorkerInterface from "../../core/WorkerInterface.js";
import DownloadResolver from "./DownloadResolver.js";
import { DownloadTask, DownloadTaskResult } from "./DownloadTask.js";

export default class DownloadWorker implements WorkerInterface<DownloadTaskResult, DownloadTask> {
    priority: number;
    busy: boolean = false;
    resolver: DownloadResolver;

    constructor(resolver: DownloadResolver, priority = 0) {
        this.resolver = resolver
        this.priority = priority
    }

    async run(task: DownloadTask): Promise<DownloadTaskResult> {
        getLogger(LoggerConfigs[Modules.DOWNLOAD_WORKER]).debug(`Starting download session for bot: ${this.resolver.getBot()}`)
        this.resolver.startSession()
        let filename = await this.resolver.downloadSong(task.client, task.track.external_urls.spotify, task.filename)
        return { filename }
    }
}