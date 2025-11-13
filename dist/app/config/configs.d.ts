declare enum Modules {
    EXPRESS = 0,
    TELEGRAM_TASK = 1,
    TELEGRAM_WORKER = 2,
    TELEGRAM_BOT = 3,
    TELEGRAM_QUEUE = 4,
    DOWNLOAD = 5,
    DOWNLOAD_RESOLVER = 6,
    DOWNLOAD_TASK = 7,
    DOWNLOAD_WORKER = 8,
    SPOTIFY_USER = 9,
    METADATA_MANAGER = 10,
    LYRIC_TASK = 11,
    LYRIC_WORKER = 12
}
declare const LoggerConfigs: {
    displayName: string;
    level: string;
}[];
export { LoggerConfigs, Modules };
