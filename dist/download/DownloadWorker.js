export default class DownloadWorker {
    constructor(resolver, priority = 0) {
        this.busy = false;
        this.resolver = resolver;
        this.priority = priority;
    }
    async run(task) {
        this.resolver.startSession();
        let filename = await this.resolver.downloadSong(task.body.client, task.body.track.external_urls.spotify, task.body.filename);
        return { filename };
    }
}
