import dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
import express from "express";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const TelegramBot = require("node-telegram-bot-api");

import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();

import { login, getPlaylists, getSavedTracks, getPlaylistTracks } from "./spotify.js";
import { downloadSong } from "./MTProto.js"

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN);
const db = new sqlite3.Database(process.env.DB_PATH)

bot.onText(/\/start/, (msg) => {
    // Check if the user is already registered
    db.get("SELECT * FROM tokens WHERE chatId = ?", [msg.chat.id], async (err, row) => {
        if (!row) {
            await bot.sendMessage(msg.chat.id, "Welcome to the Spotify Downloader Bot! To get started, please log in to your Spotify account.")
            await bot.sendMessage(msg.chat.id, "Please visit the following link to log in to Spotify and authorize the bot:\nhttps://spotify.angaronigiovanni.com/login?chat_id=" + msg.chat.id)
            // Insert the user into the database
            db.run("INSERT INTO tokens (chatId) VALUES (?)", [msg.chat.id], (err) => { });
        } else {
            sendMenu(row.chatId)
        }
    })
});

const sendMenu = async (chatId) => {
    const playlists = await getPlaylists(chatId)
    let menu = [[{ text: "🎵 Saved Music", callback_data: "saved" }]]

    playlists.forEach(playlist => {
        menu.push([{ text: playlist.name, callback_data: playlist.id }])
    })

    bot.sendMessage(chatId, "Select which playlist you want to download:", {
        reply_markup: {
            inline_keyboard: menu,
        },
    });
}

bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    let tracks
    if (data == "saved")
        tracks = await getSavedTracks(chatId)
    else
        tracks = await getPlaylistTracks(chatId, data)

    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);

    for (let song of tracks) {
        await new Promise((resolve, reject) => {
            db.get("SELECT * FROM songs WHERE songId = ?", [song.track.id], async (err, row) => {
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
                    // Song not downloaded, download and send it
                    try {
                        let filename = await downloadSong(song.track.external_urls.spotify)
                        db.run("INSERT INTO songs (songId, title, filename) VALUES (?, ?, ?)", [song.track.id, song.track.name, filename], (err) => { })
                    } catch (e) {
                        console.error("Error downloading song:", e);
                        await bot.sendMessage(chatId, `Failed to download: ${song.track.name}`);
                    }
                }
                resolve()
            })
        })
    }
})

app.get("/login", function (req, res) {
    if (!req.query["chat_id"]) {
        return res.status(400).send("Chat ID is required");
    }
    var state = req.query["chat_id"]
    var scope = "user-library-read user-read-private user-read-email playlist-read-collaborative playlist-modify-public playlist-modify-private";

    res.redirect(
        "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
            response_type: "code",
            client_id: process.env.CLIENT_ID,
            scope: scope,
            redirect_uri: process.env.URL + "/callback",
            state: state,
        })
    );
});

app.get("/callback", function (req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect(
            "/#" +
            querystring.stringify({
                error: "state_mismatch",
            })
        );
        return;
    }

    login(code, state, (err) => {
        if (err) {
            console.error("Error updating access token:", err);
            res.redirect("/#" + querystring.stringify({ error: "database_error" }));
        } else {
            bot.sendMessage(state, "You have successfully logged in to Spotify! You can now use the bot.");
        }
    })

    res.send(`
    <html>
      <body>
        <script type="text/javascript">
          window.close();
        </script>
        <p>You can close this window.</p>
      </body>
    </html>
    `);

    sendMenu(state)
});

app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});

app.listen(3005, function () {
    console.log("Server is running on http://localhost:3005");
});