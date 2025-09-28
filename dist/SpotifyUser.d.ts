import Database from "./Database.js";
import TelegramBot from "node-telegram-bot-api";
declare class SpotifyUser {
    private userId;
    private userChatId;
    private accessToken;
    private refreshToken;
    private expiresAt;
    private email;
    private spotifyWebApi;
    private static pendingLogins;
    private static DATABASE;
    private constructor();
    static setDatabase(db: Database): void;
    static get(chatId: string, bot: TelegramBot, timeoutMs?: number): Promise<SpotifyUser>;
    static resolveLogin(chatId: string, tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }): Promise<void>;
    save(): void;
    private static loadFromDatabase;
    private static parse;
    private static getUserSchema;
    private loadTokens;
    getChatId(): string;
    getPlaylists(): Promise<SpotifyApi.PlaylistObjectSimplified[]>;
    getSavedTracks(): Promise<SpotifyApi.SavedTrackObject[]>;
    getPlaylistTracks(playlistId: string): Promise<SpotifyApi.PlaylistTrackObject[]>;
}
export default SpotifyUser;
