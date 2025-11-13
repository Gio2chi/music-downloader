declare enum Modules {
    EXPRESS = 0,
    TELEGRAM_TASK = 1,
    TELEGRAM_WORKER = 2,
    TELEGRAM_BOT = 3,
    TELEGRAM_CLIENT = 4,
    TELEGRAM_QUEUE = 5,
    DOWNLOAD = 6,
    DOWNLOAD_RESOLVER = 7,
    DOWNLOAD_TASK = 8,
    DOWNLOAD_WORKER = 9,
    SPOTIFY_USER = 10,
    METADATA_MANAGER = 11,
    LYRIC_TASK = 12,
    LYRIC_WORKER = 13
}
declare const LoggerConfigs: {
    displayName: string;
    level: string;
}[];
export { LoggerConfigs, Modules };
