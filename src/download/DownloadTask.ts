import path from "path";
import TaskInterface from "../core/TaskInterface.js";
import { updateMetadata, parseSpotifyMetadata } from "../metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
import { TelegramClient } from "telegram";

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
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), (await parseSpotifyMetadata(this.body.track)).tags)
        console.log("✅ Saved:", this.body.track.name);
    };
    async onFailure(): Promise<void> {
        console.log(`❌ Failed to download: ${this.body.track.name}`)
     };

    constructor(body: DownloadTaskBody, onSuccess = async(result: DownloadTaskResult): Promise<void> => {}, onFailure = async(): Promise<void> => {}) {
        this.body = body
        this.onSuccess = onSuccess
        this.onFailure = onFailure
    }

}