import DownloadResolver from "./DownloadResolver.js";
declare const SPOTIFY: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDIRECT_URI: string;
};
declare const TELEGRAM_BOT: {
    BOT_TOKEN: string;
};
declare const TELEGRAM_CLIENT: {
    TELEGRAM_API_ID: string;
    TELEGRAM_API_HASH: string;
    TELEGRAM_LOGIN_TOKEN: string;
};
declare const DATABASE: {
    DB_PATH: string;
};
declare const RESOLVERS: DownloadResolver[];
export { SPOTIFY, TELEGRAM_BOT, TELEGRAM_CLIENT, DATABASE, RESOLVERS };
