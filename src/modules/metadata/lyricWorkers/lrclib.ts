import { TLyricTaskResult } from "../../../types/Lyric.js";
import { LyricTask } from "../LyricTask.js";
import { LyricWorkerInterface } from "../LyricWorkerInterface.js";
import { Client, parseLocalLyrics } from "lrclib-api"

export class lrclibWorker implements LyricWorkerInterface {
    priority: number;
    busy = false;

    // in order to fall in the fail branch of a PriorityWorkerQueue, the task has to throw
    throwOnUnsynced: boolean

    constructor(priority = 0, throwOnUnsynced = false) {
        this.priority = priority
        this.throwOnUnsynced = throwOnUnsynced
    }

    async run(task: LyricTask): Promise<TLyricTaskResult> {
        const lrclib = new Client()
        const params = { track_name: task.title, artist_name: task.artist, album_name: task.album, duration: task.duration }
        let sync = true

        let response = await lrclib.findLyrics(params)
        let lrcText = response.syncedLyrics

        if (response.instrumental)
            return { synced: true, lyric: [], instrumental: true }

        if (this.throwOnUnsynced && !lrcText)
            throw new Error("Synced lyric not found")
        
        if(!lrcText) {
            sync = false
            lrcText = response.plainLyrics
        }

        if (!lrcText)
            throw new Error("Lyric not found")

        let parsed = sync ? parseLocalLyrics(lrcText).synced : parseLocalLyrics(lrcText).unsynced
        let lrc = parsed!.map(l => { return { text: l.text, timestamp: l.startTime ? l.startTime * 1000 : undefined } })

        return { synced: sync, lyric: lrc, instrumental: false }
    }
}