import sqlite3pkg from "sqlite3";
interface UserSchema {
    userId: string;
    chatId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    email: string;
}
interface SongSchema {
    songId: string;
    filename: string;
    title: string;
    tags?: object;
}
declare class Database extends sqlite3pkg.Database {
    getUser(chatId: string): Promise<UserSchema | null>;
    insertOrUpdateUser(obj: UserSchema): Promise<void>;
    getSong(songId: string): Promise<SongSchema | null>;
    insertSong(song: SongSchema): Promise<void>;
}
export type { UserSchema, SongSchema };
export default Database;
