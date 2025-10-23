import path from "path";
import TaskInterface from "../core/TaskInterface.js";
import { updateMetadata } from "../metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
import { TelegramClient } from "telegram";
import { Song } from "../models/Song.js";

export type DownloadTaskBody = {
    client: TelegramClient
    track: SpotifyApi.TrackObjectFull,
    added_at: Date
    filename?: string
}
export type DownloadTaskResult = {
    filename: string
}

export class DownloadTask implements TaskInterface<DownloadTaskBody, DownloadTaskResult> {
    body: DownloadTaskBody;

    async onSuccess(result: DownloadTaskResult): Promise<void> {
        let sng = new Song({ spotify_id: this.body.track.id, title: this.body.track.name, filename: result.filename })
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags())
        console.log("✅ Saved:", this.body.track.name);
    };
    async onFailure(): Promise<void> {
        console.log(`❌ Failed to download: ${this.body.track.name}`)
    };

    constructor(body: DownloadTaskBody, onSuccess = async (result: DownloadTaskResult): Promise<void> => { }, onFailure = async (): Promise<void> => { }) {
        this.body = body
        this.onSuccess = onSuccess
        this.onFailure = onFailure
    }

}