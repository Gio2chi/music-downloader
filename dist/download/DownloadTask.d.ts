import TaskInterface from "../core/TaskInterface.js";
import { TelegramClient } from "telegram";
export type DownloadTaskBody = {
    client: TelegramClient;
    track: SpotifyApi.TrackObjectFull;
    added_at: Date;
    filename?: string;
};
export type DownloadTaskResult = {
    filename: string;
};
export declare class DownloadTask implements TaskInterface<DownloadTaskBody, DownloadTaskResult> {
    body: DownloadTaskBody;
    onSuccess(result: DownloadTaskResult): Promise<void>;
    onFailure(): Promise<void>;
    constructor(body: DownloadTaskBody, onSuccess?: (result: DownloadTaskResult) => Promise<void>, onFailure?: () => Promise<void>);
}
