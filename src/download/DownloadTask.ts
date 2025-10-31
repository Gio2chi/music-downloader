import path from "path";
import TaskInterface from "../core/TaskInterface.js";
import { updateMetadata } from "../metadata/metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
import { TelegramClient } from "telegram";
import { Song } from "../models/Song.js";

export interface DownloadTaskBody {
    client: TelegramClient
    track: SpotifyApi.TrackObjectFull,
    added_at: Date
    filename?: string
}
export type DownloadTaskResult = {
    filename: string
}

export class DownloadTask implements TaskInterface<DownloadTaskResult>, DownloadTaskBody {
    client: TelegramClient;
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string | undefined;

    constructor(body: DownloadTaskBody, onSuccess = async (result: DownloadTaskResult): Promise<void> => { }, onFailure = async (): Promise<void> => { }) {
        this.client = body.client
        this.track = body.track
        this.added_at = body.added_at
        this.filename = body.filename
        
        this.onSuccess = onSuccess
        this.onFailure = onFailure
    }

    async onSuccess(result: DownloadTaskResult): Promise<void> {
        let sng = new Song({ spotify_id: this.track.id, title: this.track.name, filename: result.filename })
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags())
        console.log("✅ Saved:", this.track.name);
    };
    async onFailure(): Promise<void> {
        console.log(`❌ Failed to download: ${this.track.name}`)
    };
}