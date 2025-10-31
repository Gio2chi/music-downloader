export class TelegramTask {
    constructor(task) {
        this.track = task.track;
        this.added_at = task.added_at;
        this.filename = task.filename;
        this.handlers = task.handlers;
    }
    async onSuccess(result) { }
    ;
    async onFailure() { }
    ;
}
