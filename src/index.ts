import TelegramBot from "node-telegram-bot-api";

import {TELEGRAM_BOT, DATABASE, MAX_SONGS_PER_MINUTE} from "./Secrets.js"
import SpotifyUser from "./SpotifyUser.js"
import {app} from "./ServerInstance.js"

import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();

import { downloadSong } from "./MTProto.js"
import Database from "./Database.js";

const bot = new TelegramBot(TELEGRAM_BOT.BOT_TOKEN);
const db = new Database(DATABASE.DB_PATH)
SpotifyUser.setDatabase(db);
SpotifyUser.setBot(bot);

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    try {
        let user = await SpotifyUser.get(msg.chat.id.toString())
        sendMenu(user)
    } catch (e) {
        console.log(e)
    }
});

const sendMenu = async (user: SpotifyUser) => {

    const playlists = await user.getPlaylists()
    let menu = [[{ text: "🎵 Saved Music", callback_data: "saved" }]]

    playlists.forEach(playlist => {
        menu.push([{ text: playlist.name, callback_data: playlist.id }])
    })

    bot.sendMessage(user.getChatId(), "Select which playlist you want to download:", {
        reply_markup: {
            inline_keyboard: menu,
        },
    });
}

bot.on("callback_query", async (query: Record<string, any>) => {
    const chatId = query.message.chat.id;
    const playlistName = query.data;

    let user = await SpotifyUser.get(chatId)

    let tracks: SpotifyApi.SavedTrackObject[] | SpotifyApi.PlaylistTrackObject[]
    if (playlistName == "saved")
        tracks = await user.getSavedTracks()
    else
        tracks = await user.getPlaylistTracks(playlistName)

    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);

    let count = 0;
    let time = Date.now();
    for (let song of tracks) {
        if (count >= parseInt(MAX_SONGS_PER_MINUTE)) {
            let waitTime = 60000 - (Date.now() - time);
            if (waitTime > 0) {
                console.log(`Rate limit reached. Waiting for ${waitTime} ms`);
                await new Promise(r => setTimeout(r, waitTime));
            }
            count = 0;
            time = Date.now();
        }

        await new Promise<void>((resolve, reject) => {
            if (song.track == null) {
                reject()
                return
            }

            db.get("SELECT * FROM songs WHERE songId = ?", [song.track.id], async (err, row) => {
                if (song.track == null) {
                    reject()
                    return
                }
                if (err) {
                    console.error("Database error:", err);
                    reject(err);
                    return;
                }
                if (row) {
                    // Song already downloaded, skip it
                    console.log("Skipping (already downloaded): " + song.track.name)
                }
                if (!row) {
                    // Song not downloaded -> download it
                    try {
                        let filename = await downloadSong(song.track.external_urls.spotify)
                        db.run("INSERT INTO songs (songId, title, filename) VALUES (?, ?, ?)", [song.track.id, song.track.name, filename], (err) => { })
                        count++;
                    } catch (e) {
                        console.error("Error downloading song:", e);
                        await bot.sendMessage(chatId, `Failed to download: ${song.track.name}`);
                    }
                }
                resolve()
            })
        })

    }
    bot.sendMessage(chatId, `playlist downloaded`)
})

app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});

app.listen(3000, () => console.log("Server running on port 3000"));