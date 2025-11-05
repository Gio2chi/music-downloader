import { Client, parseLocalLyrics } from "lrclib-api";
export class lrclibWorker {
    constructor(priority = 0, throwOnUnsynced = false) {
        this.busy = false;
        this.priority = priority;
        this.throwOnUnsynced = throwOnUnsynced;
    }
    async run(task) {
        const lrclib = new Client();
        const params = { track_name: task.title, artist_name: task.artist, album_name: task.album, duration: task.duration };
        let sync = true;
        let response = await lrclib.findLyrics(params);
        let lrcText = response.syncedLyrics;
        if (response.instrumental)
            return { synced: true, lyric: [], instrumental: true };
        if (this.throwOnUnsynced && !lrcText)
            throw new Error("Synced lyric not found");
        if (!lrcText) {
            sync = false;
            lrcText = response.plainLyrics;
        }
        if (!lrcText)
            throw new Error("Lyric not found");
        let parsed = sync ? parseLocalLyrics(lrcText).synced : parseLocalLyrics(lrcText).unsynced;
        let lrc = parsed.map(l => { return { text: l.text, timestamp: l.startTime ? l.startTime * 1000 : undefined }; });
        return { synced: sync, lyric: lrc, instrumental: false };
    }
}
