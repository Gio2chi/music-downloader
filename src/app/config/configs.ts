import dotenv from "dotenv";
dotenv.config()

const {
    DEFAULT_LOG_LEVEL,
    EXPRESS_LOG_LEVEL,
    TELEGRAM_TASK_LOG_LEVEL,
    TELEGRAM_WORKER_LOG_LEVEL,
    TELEGRAM_BOT_LOG_LEVEL,
    TELEGRAM_QUEUE_LOG_LEVEL,
    DOWNLOAD_LOG_LEVEL,
    DOWNLOAD_RESOLVER_LOG_LEVEL,
    DOWNLOAD_TASK_LOG_LEVEL,
    DOWNLOAD_WORKER_LOG_LEVEL,
    SPOTIFY_USER_LOG_LEVEL,
    METADATA_MANAGER_LOG_LEVEL,
    LYRIC_TASK_LOG_LEVEL,
    LYRIC_WORKER_LOG_LEVEL
} = process.env;

enum Modules {
    EXPRESS,
    TELEGRAM_TASK,
    TELEGRAM_WORKER,
    TELEGRAM_BOT,
    TELEGRAM_QUEUE,
    DOWNLOAD,
    DOWNLOAD_RESOLVER,
    DOWNLOAD_TASK,
    DOWNLOAD_WORKER,
    SPOTIFY_USER,
    METADATA_MANAGER,
    LYRIC_TASK,
    LYRIC_WORKER,
}

const LoggerConfigs: {displayName: string, level: string}[] = []
LoggerConfigs[Modules.EXPRESS] = { displayName: "Express", level: EXPRESS_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.TELEGRAM_TASK] = { displayName: "TelegramTask", level: TELEGRAM_TASK_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.TELEGRAM_WORKER] = { displayName: "TelegramWorker", level: TELEGRAM_WORKER_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.TELEGRAM_BOT] = { displayName: "TelegramBot", level: TELEGRAM_BOT_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.TELEGRAM_QUEUE] = { displayName: "TelegramQueue", level: TELEGRAM_QUEUE_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.DOWNLOAD] = { displayName: "Download", level: DOWNLOAD_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.DOWNLOAD_RESOLVER] = { displayName: "DownloadResolver", level: DOWNLOAD_RESOLVER_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.DOWNLOAD_TASK] = { displayName: "DownloadTask", level: DOWNLOAD_TASK_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.DOWNLOAD_WORKER] = { displayName: "DownloadWorker", level: DOWNLOAD_WORKER_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.SPOTIFY_USER] = { displayName: "SpotifyUser", level: SPOTIFY_USER_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.METADATA_MANAGER] = { displayName: "MetadataManager", level: METADATA_MANAGER_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.LYRIC_TASK] = { displayName: "LyricTask", level: LYRIC_TASK_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }
LoggerConfigs[Modules.LYRIC_WORKER] = { displayName: "LyricWorker", level: LYRIC_WORKER_LOG_LEVEL ?? DEFAULT_LOG_LEVEL ?? 'info' }

export { LoggerConfigs, Modules }