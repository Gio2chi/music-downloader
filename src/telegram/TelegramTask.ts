import TaskInterface from "../core/TaskInterface.js";
import { DownloadTaskResult } from "../download/DownloadTask.js";

export type TelegramTaskBody = {
    track: SpotifyApi.TrackObjectFull,
    added_at: Date
    filename?: string
    onSuccess?: (result: DownloadTaskResult) => Promise<void>
    onFailure?: () => Promise<void>
}

export class TelegramTask implements TaskInterface<TelegramTaskBody, void> {
    body: TelegramTaskBody;

    constructor(task: TelegramTaskBody)
    {
        this.body = task
    }

    async onSuccess(result: void): Promise<void> {};
    async onFailure(): Promise<void> {};
}