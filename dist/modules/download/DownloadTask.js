import DownloadResolver from "./DownloadResolver.js";
import getLogger from "../../core/logSystem.js";
import { LoggerConfigs, Modules } from "../../app/config/configs.js";
export class DownloadTask {
    constructor(body, options) {
        this.client = body.client;
        this.track = body.track;
        this.added_at = body.added_at;
        this.filename = body.filename;
        this.afterSuccess = options.afterSuccess;
        this.afterFailure = options.afterFailure;
        if (options.onSuccess)
            this.onSuccess = options.onSuccess;
        if (options.onFailure)
            this.onFailure = options.onFailure;
    }
    async onSuccess(result) {
        getLogger(LoggerConfigs[Modules.DOWNLOAD_TASK]).debug(`✅ Saved: ${this.track.name}`, { meta: { songId: this.track.id, filename: DownloadResolver.getFolder() + "/" + result.filename } });
    }
    ;
    async onFailure() {
        getLogger(LoggerConfigs[Modules.DOWNLOAD_TASK]).debug(`❌ Failed to download: ${this.track.name}`);
    }
    ;
}
