import dotenv from "dotenv";
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

    TELEGRAM_DOWNLOAD_BOT_USERNAME,
    TELEGRAM_MAX_MSG_PER_DOWNLOAD,

    MAX_SONGS_PER_MINUTE,
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

const MAX_SONGS_PER_MINUTE_VALUE = MAX_SONGS_PER_MINUTE ? MAX_SONGS_PER_MINUTE : "1";

export { SPOTIFY, TELEGRAM_BOT, TELEGRAM_CLIENT, DATABASE, MAX_SONGS_PER_MINUTE_VALUE as MAX_SONGS_PER_MINUTE };