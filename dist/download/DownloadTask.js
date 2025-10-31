import path from "path";
import { updateMetadata } from "../metadata/metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
import { Song } from "../models/Song.js";
export class DownloadTask {
    async onSuccess(result) {
        let sng = new Song({ spotify_id: this.body.track.id, title: this.body.track.name, filename: result.filename });
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags());
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
