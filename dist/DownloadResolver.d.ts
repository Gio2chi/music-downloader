import { TelegramClient } from "telegram";
export declare class TimeoutError extends Error {
}
export declare class MediaNotFoundError extends Error {
}
declare class DownloadResolver {
    private static client;
    private static downloadFolder;
    private botUsername;
    private msgPerDownload;
    private songsPerMinute;
    private intervalBetweenPollsMs;
    private timeout;
    private time;
    private count;
    constructor(botUsername: string, config?: {
        msgPerDownload?: number;
        songsPerMinute?: number;
        intervalBetweenPollsMs?: number;
        timeout?: number;
    });
    static setClient(client: TelegramClient): void;
    static setFolder(folder: string): void;
    static getFolder(): string;
    private static UUID;
    getMaxSongsPerMinute(): number;
    startSession(): void;
    downloadSong(url: string, filenameWithoutExtension?: string): Promise<string>;
}
export default DownloadResolver;
