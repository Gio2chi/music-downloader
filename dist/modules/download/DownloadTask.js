import path from "path";
import { updateMetadata } from "../metadata/metadataManager.js";
import DownloadResolver from "./DownloadResolver.js";
import { Song } from "../../models/Song.js";
import getLogger from "../../core/logSystem.js";
export class DownloadTask {
    constructor(body, onSuccess = async (result) => { }, onFailure = async () => { }) {
        this.client = body.client;
        this.track = body.track;
        this.added_at = body.added_at;
        this.filename = body.filename;
        this.onSuccess = onSuccess;
        this.onFailure = onFailure;
    }
    async onSuccess(result) {
        let sng = new Song({ spotify_id: this.track.id, title: this.track.name, filename: result.filename });
        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), sng.toTags());
        getLogger('DownloadTask').info(`✅ Saved: ${this.track.name}`, { meta: { songId: sng.spotify_id } });
    }
    ;
    async onFailure() {
        getLogger('DownloadTask').info(`❌ Failed to download: ${this.track.name}`);
    }
    ;
}
