import WorkerInterface from "../core/WorkerInterface.js";
import DownloadResolver from "./DownloadResolver.js";
import { DownloadTask, DownloadTaskBody, DownloadTaskResult } from "./DownloadTask.js";

export default class DownloadWorker implements WorkerInterface<DownloadTaskBody, DownloadTaskResult> {
    priority: number;
    busy: boolean = false;
    resolver: DownloadResolver;

    constructor(resolver: DownloadResolver, priority = 0) {
        this.resolver = resolver
        this.priority = priority
    }

    async run(task: DownloadTask): Promise<DownloadTaskResult> {
        this.resolver.startSession()
        let filename = await this.resolver.downloadSong(task.body.client, task.body.track.external_urls.spotify, task.body.filename)
        return { filename }
    }
}