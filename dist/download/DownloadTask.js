import path from "path";
import { updateMetadata, parseSpotifyMetadata } from "../metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
export class DownloadTask {
    async onSuccess(result) {
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), (await parseSpotifyMetadata(this.body.track)).tags);
        console.log("✅ Saved:", this.body.track.name);
    }
    ;
    async onFailure() {
        console.log(`❌ Failed to download: ${this.body.track.name}`);
    }
    ;
    constructor(body, onSuccess = async (result) => { }, onFailure = async () => { }) {
        this.body = body;
        this.onSuccess = onSuccess;
        this.onFailure = onFailure;
    }
}
