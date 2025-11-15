import TaskInterface from "../../core/TaskInterface.js";
import { DownloadTaskResult } from "../download/DownloadTask.js";
export interface TelegramTaskBody {
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string;
    retries?: number;
    handlers: {
        onSuccess?: (result: DownloadTaskResult) => Promise<void>;
        onFailure?: () => Promise<void>;
    };
}
export declare class TelegramTask implements TaskInterface<void>, TelegramTaskBody {
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    retries: number;
    filename?: string | undefined;
    handlers: {
        onSuccess?: (result: DownloadTaskResult) => Promise<void>;
        onFailure?: () => Promise<void>;
    };
    constructor(task: TelegramTaskBody);
    onSuccess(result: void): Promise<void>;
    onFailure(): Promise<void>;
}
