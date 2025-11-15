import { LoggerConfigs, Modules } from "../../app/config/configs.js";
import getLogger from "../../core/logSystem.js";
export class TelegramTask {
    constructor(task) {
        this.track = task.track;
        this.added_at = task.added_at;
        this.filename = task.filename;
        this.handlers = task.handlers;
        this.retries = task.retries ?? 0;
    }
    async onSuccess(result) {
        getLogger(LoggerConfigs[Modules.TELEGRAM_TASK]).debug(`✅ Completed task`, { meta: { songId: this.track.id } });
    }
    ;
    async onFailure() {
        getLogger(LoggerConfigs[Modules.TELEGRAM_TASK]).debug(`❌ Failed task`, { meta: { songId: this.track.id } });
    }
    ;
}
