import sqlite3pkg, { RunResult } from "sqlite3";

interface UserSchema {
    userId: string,
    chatId: string,
    access_token: string,
    refresh_token: string,
    expires_at: number
    email: string
}

interface SongSchema {
    songId: string,
    filename: string,
    title: string,
    tags: JSON
}

class Database extends sqlite3pkg.Database {
    public getUser(chatId: string): Promise<UserSchema | null> {
        return new Promise((resolve, __) =>
            this.get<UserSchema>("SELECT * FROM users WHERE chatId = ?", [chatId], (err, row) => {
                if (err)
                    throw new Error("An error occurred while querying the database")
                if (!row) {
                    resolve(null)
                    return;
                }
                resolve(row)
            }))
    }

    public insertOrUpdateUser(obj: UserSchema) {
        return new Promise<void>(async (_, __) => {
            if ((await this.getUser(obj.chatId)) != null)
                this.run(
                    "UPDATE users SET accessToken = ?, refreshToken = ? WHERE chatId = ?;",
                    [obj.access_token, obj.refresh_token, obj.chatId],
                    function (res: RunResult, err: Error | null) {
                        if (err)
                            throw new Error("An error occurred while querying the database")
                    }
                )
            else this.run(
                "INSERT INTO users (userId, chatId, accessToken, refreshToken, expiresAt, topicId) VALUES (?,?,?,?,?,?);",
                [obj.userId, obj.chatId, obj.access_token, obj.refresh_token],
                function (res: RunResult, err: Error | null) {
                    if (err)
                        throw new Error("An error occurred while querying the database")
                }
            )
        })
    }

    public getSong(songId: string): Promise<SongSchema | null> {
        return new Promise((resolve, __) =>
            this.get<SongSchema>("SELECT * FROM users WHERE songId = ?", [songId], (err, row) => {
                if (err)
                    throw new Error("An error occurred while querying the database")
                if (!row) {
                    resolve(null)
                    return;
                }
                resolve(row)
            }))
    }

    public insertSong(song: SongSchema) {
        return new Promise<void>(async (_, __) => {
            this.run(
                "INSERT INTO songs (songId, filename, title, tags) VALUES",
                [song.songId, song.filename, song.title, song.tags],
                function (res: RunResult, err: Error | null) {
                    if (err)
                        throw new Error("An error occurred while querying the database")
                }
            )
        })
    }
}

export type { UserSchema, SongSchema };
export default Database;