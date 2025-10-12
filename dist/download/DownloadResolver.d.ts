import { TelegramClient } from "telegram";
export declare class TimeoutError extends Error {
}
export declare class MediaNotFoundError extends Error {
}
declare class DownloadResolver {
    private static downloadFolder;
    private botUsername;
    private msgPerDownload;
    private songsPerMinute;
    private intervalBetweenPollsMs;
    private timeout;
    private time;
    private count;
    private priority;
    constructor(botUsername: string, config?: {
        msgPerDownload?: number;
        songsPerMinute?: number;
        intervalBetweenPollsMs?: number;
        timeout?: number;
    }, priority?: number);
    static setFolder(folder: string): void;
    static getFolder(): string;
    private static UUID;
    getPriority(): number;
    getMaxSongsPerMinute(): number;
    startSession(): void;
    downloadSong(client: TelegramClient, url: string, filenameWithoutExtension?: string): Promise<string>;
}
export default DownloadResolver;
