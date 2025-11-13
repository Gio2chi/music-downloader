import getLogger from "../../core/logSystem.js";
export class TelegramTask {
    constructor(task) {
        this.track = task.track;
        this.added_at = task.added_at;
        this.filename = task.filename;
        this.handlers = task.handlers;
    }
    async onSuccess(result) {
        getLogger('TelegramTask').debug(`✅ Completed task`, { meta: { songId: this.track.id } });
    }
    ;
    async onFailure() {
        getLogger('TelegramTask').debug(`❌ Failed task`, { meta: { songId: this.track.id } });
    }
    ;
}
