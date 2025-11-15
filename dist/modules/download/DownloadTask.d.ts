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
    afterSuccess?: (() => void) | undefined;
    afterFailure?: (() => void) | undefined;
    constructor(body: DownloadTaskBody, options: {
        onSuccess: ((result: DownloadTaskResult) => Promise<void>) | undefined;
        afterSuccess: (() => void) | undefined;
        onFailure: (() => Promise<void>) | undefined;
        afterFailure: (() => void) | undefined;
    });
    onSuccess(result: DownloadTaskResult): Promise<void>;
    onFailure(): Promise<void>;
}
