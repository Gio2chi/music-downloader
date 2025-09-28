import sqlite3pkg from "sqlite3";
class Database extends sqlite3pkg.Database {
    getUser(chatId) {
        return new Promise((resolve, __) => this.get("SELECT * FROM users WHERE chatId = ?;", [chatId], (err, row) => {
            if (err)
                throw new Error("An error occurred while querying the database");
            if (!row) {
                resolve(null);
                return;
            }
            resolve(row);
        }));
    }
    insertOrUpdateUser(obj) {
        return new Promise(async (_, __) => {
            if ((await this.getUser(obj.chatId)) != null)
                this.run("UPDATE users SET accessToken = ?, refreshToken = ? WHERE chatId = ?;", [obj.accessToken, obj.refreshToken, obj.chatId], function (res, err) {
                    if (err)
                        throw new Error("An error occurred while querying the database");
                });
            else
                this.run("INSERT INTO users (userId, chatId, email, accessToken, refreshToken, expiresAt) VALUES (?,?,?,?,?,?);", [obj.userId, obj.chatId, obj.email, obj.accessToken, obj.refreshToken, Date.now() + obj.expiresAt], function (res, err) {
                    if (err)
                        throw new Error("An error occurred while querying the database");
                });
        });
    }
    getSong(songId) {
        return new Promise((resolve, __) => this.get("SELECT * FROM songs WHERE songId = ?;", [songId], (err, row) => {
            if (err)
                throw new Error("An error occurred while querying the database");
            if (!row) {
                resolve(null);
                return;
            }
            resolve(row);
        }));
    }
    insertSong(song) {
        return new Promise(async (_, __) => {
            this.run("INSERT INTO songs (songId, filename, title, tags) VALUES (?,?,?,?);", [song.songId, song.filename, song.title, song.tags], function (res, err) {
                if (err)
                    throw new Error("An error occurred while querying the database");
            });
        });
    }
}
export default Database;
