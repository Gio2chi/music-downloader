import getLogger from "../../core/logSystem.js";
export default class DownloadWorker {
    constructor(resolver, priority = 0) {
        this.busy = false;
        this.resolver = resolver;
        this.priority = priority;
    }
    async run(task) {
        getLogger('DownloadWorker').debug(`Starting download session for bot: ${this.resolver.getBot()}`);
        this.resolver.startSession();
        let filename = await this.resolver.downloadSong(task.client, task.track.external_urls.spotify, task.filename);
        return { filename };
    }
}
