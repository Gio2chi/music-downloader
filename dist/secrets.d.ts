import DownloadResolver from "./download/DownloadResolver.js";
import { TelegramClient } from "telegram";
declare const SPOTIFY: {
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    SPOTIFY_REDIRECT_URI: string;
};
declare const TELEGRAM_BOT: {
    TELEGRAM_BOT_TOKEN: string;
};
declare const DATABASE: {
    DB_PATH: string;
};
declare const TELEGRAM_CLIENTS: TelegramClient[];
declare const RESOLVERS: DownloadResolver[];
export { SPOTIFY, TELEGRAM_BOT, TELEGRAM_CLIENTS, DATABASE, RESOLVERS };
