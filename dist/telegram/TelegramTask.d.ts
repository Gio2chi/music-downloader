import TaskInterface from "../core/TaskInterface.js";
import { DownloadTaskResult } from "../download/DownloadTask.js";
export type TelegramTaskBody = {
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string;
    onSuccess?: (result: DownloadTaskResult) => Promise<void>;
    onFailure?: () => Promise<void>;
};
export declare class TelegramTask implements TaskInterface<TelegramTaskBody, void> {
    body: TelegramTaskBody;
    constructor(task: TelegramTaskBody);
    onSuccess(result: void): Promise<void>;
    onFailure(): Promise<void>;
}
