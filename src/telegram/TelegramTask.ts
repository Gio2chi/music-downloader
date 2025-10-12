import TaskInterface from "../core/TaskInterface";
import { DownloadTask } from "../download/DownloadTask";

export type TelegramTaskBody = {
    track: SpotifyApi.TrackObjectFull,
    added_at: Date
    filename?: string
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