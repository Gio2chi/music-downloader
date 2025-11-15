import path from "path";
import TaskInterface from "../../core/TaskInterface.js";
import { updateMetadata } from "../metadata/metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
import { TelegramClient } from "telegram";
import { Song } from "../../models/Song.js";
import getLogger from "../../core/logSystem.js";
import { LoggerConfigs, Modules } from "../../app/config/configs.js";

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
    
    afterSuccess?: (() => void) | undefined;
    afterFailure?: (() => void) | undefined;

    constructor(body: DownloadTaskBody, options: {
        onSuccess: ((result: DownloadTaskResult) => Promise<void>) | undefined,
        afterSuccess: (() => void) | undefined,
        onFailure:  (() => Promise<void>) | undefined,
        afterFailure: (() => void) | undefined
    }) {
        this.client = body.client
        this.track = body.track
        this.added_at = body.added_at
        this.filename = body.filename
        
        this.afterSuccess = options.afterSuccess
        this.afterFailure = options.afterFailure
        
        if(options.onSuccess)
            this.onSuccess = options.onSuccess
        
        if(options.onFailure)
            this.onFailure = options.onFailure
    }

    async onSuccess(result: DownloadTaskResult): Promise<void> {
        let sng = new Song({ spotify_id: this.track.id, title: this.track.name, filename: result.filename })
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), sng.toTags())
        getLogger(LoggerConfigs[Modules.DOWNLOAD_TASK]).info(`✅ Saved: ${this.track.name}`, { meta: { songId: sng.spotify_id } });
    };
    async onFailure(): Promise<void> {
        getLogger(LoggerConfigs[Modules.DOWNLOAD_TASK]).info(`❌ Failed to download: ${this.track.name}`)
    };
}