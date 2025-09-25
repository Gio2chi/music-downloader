import dotenv from "dotenv";
import DownloadResolver from "./DownloadResolver.js";
import fs from "fs";
dotenv.config();

const {
    // Spotify
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,

    // Database
    DB_PATH,

    // Telegram bot
    BOT_TOKEN,

    // Telegram Client/MTProto
    TELEGRAM_API_ID,
    TELEGRAM_API_HASH,
    TELEGRAM_LOGIN_TOKEN,

    // For telegram channel forwarding -- unused
    TELEGRAM_CHANNEL_ID,
    TELEGRAM_ACCESS_HASH,

    // Download resolvers json path
    RESOLVERS_PATH,

    DOWNLOAD_PATH
} = process.env;

if (
    !CLIENT_ID ||
    !CLIENT_SECRET ||
    !REDIRECT_URI
) {
    throw new Error("❌ Missing one or more required spotify environment variables.");
}

if (
    !BOT_TOKEN
) {
    throw new Error("❌ Missing required telegram bot environment variable.");
}

if (
    !TELEGRAM_API_ID ||
    !TELEGRAM_API_HASH ||
    !TELEGRAM_LOGIN_TOKEN
) {
    throw new Error("❌ Missing one or more required telegram client environment variables.");
}

const SPOTIFY = { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI }
const TELEGRAM_BOT = { BOT_TOKEN }
const TELEGRAM_CLIENT = { TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_LOGIN_TOKEN }
const DATABASE = { DB_PATH: DB_PATH ? DB_PATH :  "./sqlite.db" }


const config = JSON.parse(fs.readFileSync(RESOLVERS_PATH ? RESOLVERS_PATH : "./resolvers.json", "utf-8"))

if(!fs.existsSync(DOWNLOAD_PATH ?? "./downloads"))
    fs.mkdirSync( DOWNLOAD_PATH ?? "./downloads" )
DownloadResolver.setFolder( DOWNLOAD_PATH ?? "./downloads" )

const RESOLVERS: DownloadResolver[] = []
config.forEach((resolver: {
        botUsername: string;
        config: {
            msgPerDownload?: number,
            songsPerMinute?: number,
            intervalBetweenPollsMs?: number,
            timeout?: number
        }
    }) => {
    let dr = new DownloadResolver(resolver.botUsername, resolver.config)
    RESOLVERS.push(dr)
});

export { SPOTIFY, TELEGRAM_BOT, TELEGRAM_CLIENT, DATABASE, RESOLVERS }; 