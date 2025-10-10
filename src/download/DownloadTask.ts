import path from "path";
import TaskInterface from "../core/TaskInterface";
import { updateMetadata, parseSpotifyMetadata } from "../metadataManager";
import DownloadResolver from "./DownloadResolver";

export type DownloadTaskBody = {
    track: SpotifyApi.TrackObjectFull,
    added_at: Date
    filename?: string
}
export type DownloadTaskResult = {
    filename: string
}

export class DownloadTask implements TaskInterface<DownloadTaskBody, DownloadTaskResult> {
    body: DownloadTaskBody;
    constructor(body: DownloadTaskBody) {
        this.body = body
    }
    async onSuccess(result: DownloadTaskResult): Promise<void> {
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await parseSpotifyMetadata(this.body.track))
        console.log("✅ Saved:", this.body.track.name);
    };
    async onFailure(): Promise<void> { };
}