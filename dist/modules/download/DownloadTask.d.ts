import TaskInterface from "../../core/TaskInterface.js";
import { TelegramClient } from "telegram";
export interface DownloadTaskBody {
    client: TelegramClient;
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string;
}
export type DownloadTaskResult = {
    filename: string;
};
export declare class DownloadTask implements TaskInterface<DownloadTaskResult>, DownloadTaskBody {
    client: TelegramClient;
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string | undefined;
    constructor(body: DownloadTaskBody, onSuccess?: (result: DownloadTaskResult) => Promise<void>, onFailure?: () => Promise<void>);
    onSuccess(result: DownloadTaskResult): Promise<void>;
    onFailure(): Promise<void>;
}
