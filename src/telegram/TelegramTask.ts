import TaskInterface from "../core/TaskInterface.js";
import { DownloadTaskResult } from "../download/DownloadTask.js";

export interface TelegramTaskBody {
    track: SpotifyApi.TrackObjectFull,
    added_at: Date
    filename?: string
    handlers: {
        onSuccess?: (result: DownloadTaskResult) => Promise<void>
        onFailure?: () => Promise<void>
    }
}

export class TelegramTask implements TaskInterface<void>, TelegramTaskBody {
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string | undefined;
    handlers: { onSuccess?: (result: DownloadTaskResult) => Promise<void>; onFailure?: () => Promise<void>; };

    constructor(task: TelegramTaskBody) {
        this.track = task.track
        this.added_at = task.added_at
        this.filename = task.filename
        this.handlers = task.handlers
    }

    async onSuccess(result: void): Promise<void> { };
    async onFailure(): Promise<void> { };
}