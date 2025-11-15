import dotenv from "dotenv";
import DownloadResolver from "../../modules/download/DownloadResolver.js";
import fs from "fs";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/StringSession.js";
import { LogLevel } from "telegram/extensions/Logger.js";
import getLogger from "../../core/logSystem.js";
import { LoggerConfigs, Modules } from "./configs.js";
dotenv.config();

const {
    // Spotify
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,

    // Database
    DB_URL,

    // Telegram bot
    TELEGRAM_BOT_TOKEN,

    // Telegram Client/MTProto
    TELEGRAM_CLIENT_API_ID,
    TELEGRAM_CLIENT_API_HASH,

    // configuration json path
    CONFIG_PATH,

    DOWNLOAD_PATH
} = process.env;

if (
    !SPOTIFY_CLIENT_ID ||
    !SPOTIFY_CLIENT_SECRET ||
    !SPOTIFY_REDIRECT_URI
) {
    throw new Error("❌ Missing one or more required spotify environment variables.");
}

if (
    !TELEGRAM_BOT_TOKEN
) {
    throw new Error("❌ Missing required telegram bot environment variable.");
}

if (
    !TELEGRAM_CLIENT_API_ID ||
    !TELEGRAM_CLIENT_API_HASH
) {
    throw new Error("❌ Missing one or more required telegram_CLIENT client environment variables.");
}
const SPOTIFY = { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI }
const TELEGRAM_BOT = { TELEGRAM_BOT_TOKEN }

if (
    !DB_URL
) {
    throw new Error("❌ Missing one or more required mongodb environment variables.")
}

const DATABASE = { DB_URL }


if (!fs.existsSync(DOWNLOAD_PATH ?? "./downloads"))
    fs.mkdirSync(DOWNLOAD_PATH ?? "./downloads")
DownloadResolver.setFolder(DOWNLOAD_PATH ?? "./downloads")

const config = JSON.parse(fs.readFileSync(CONFIG_PATH ?? "./config.json", "utf-8"))

const TELEGRAM_CLIENTS: TelegramClient[] = []
const telegramClientLogger = getLogger(LoggerConfigs[Modules.TELEGRAM_CLIENT])
config.telegram_clients.forEach((clientLoginToken: string) => {

    let stringSession = new StringSession(clientLoginToken);
    const telegramClient = new TelegramClient(
        stringSession,
        parseInt(TELEGRAM_CLIENT_API_ID, 10),
        TELEGRAM_CLIENT_API_HASH,
        { connectionRetries: 5 }
    )

    telegramClient.logger.log = (level: LogLevel, message: string, color: string) => {
        let map = {
            "none": "debug",
            "error": "error",
            "warn": "warning",
            "info": "info",
            "debug": "debug"
        }
        telegramClientLogger.log(map[level], message)
    }
    TELEGRAM_CLIENTS.push(telegramClient)
});

const RESOLVERS: DownloadResolver[] = []
config.resolvers.forEach((resolver: {
    botUsername: string;
    config: {
        msgPerDownload?: number,
        songsPerMinute?: number,
        intervalBetweenPollsMs?: number,
        timeout?: number
    },
    priority?: number
}) => {
    let dr = new DownloadResolver(resolver.botUsername, resolver.config, resolver.priority)
    RESOLVERS.push(dr)
});

export { SPOTIFY, TELEGRAM_BOT, TELEGRAM_CLIENTS, DATABASE, RESOLVERS }; 