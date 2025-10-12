import TelegramBot from "node-telegram-bot-api";
import path from "path";
import { TELEGRAM_BOT, DATABASE, RESOLVERS, TELEGRAM_CLIENTS } from "./secrets.js";
import SpotifyUser from "./SpotifyUser.js";
import { app } from "./serverInstance.js";
import Database from "./Database.js";
import DownloadResolver from "./download/DownloadResolver.js";
import { parseSpotifyMetadata, updateMetadata } from "./metadataManager.js";
import PriorityWorkerQueue from "./core/PriorityWorkerQueue.js";
import TelegramWorker from "./telegram/TelegramWorker.js";
import { TelegramTask } from "./telegram/TelegramTask.js";
const DownloadQueue = (PriorityWorkerQueue);
RESOLVERS.forEach(res => console.log(res, res.getPriority()));
TELEGRAM_CLIENTS.forEach(async (client) => await client.connect());
let tgWorkers = TELEGRAM_CLIENTS.map((client) => new TelegramWorker(client, RESOLVERS));
let downloadQueue = new DownloadQueue(tgWorkers);
const bot = new TelegramBot(TELEGRAM_BOT.TELEGRAM_BOT_TOKEN);
const db = new Database(DATABASE.DB_PATH);
SpotifyUser.setDatabase(db);
bot.onText(/\/start/, async (msg) => {
    try {
        let user = await SpotifyUser.get(msg.chat.id.toString(), bot);
        sendMenu(user);
    }
    catch (e) {
        console.log(e);
    }
});
const sendMenu = async (user) => {
    const playlists = await user.getPlaylists();
    let menu = [[{ text: "🎵 Saved Music", callback_data: "saved" }]];
    playlists.forEach(playlist => {
        menu.push([{ text: playlist.name, callback_data: playlist.id }]);
    });
    bot.sendMessage(user.getChatId(), "Select which playlist you want to download:", {
        reply_markup: {
            inline_keyboard: menu,
        },
    });
};
bot.on("callback_query", async (query) => {
    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);
    const chatId = query.message.chat.id;
    const playlistName = query.data;
    let user = await SpotifyUser.get(chatId, bot);
    let tracks;
    if (playlistName == "saved")
        tracks = await user.getSavedTracks();
    else
        tracks = await user.getPlaylistTracks(playlistName);
    let count = 0;
    for (const song of tracks) {
        if (song.track == null) {
            count++;
            continue;
        }
        if (await db.getSong(song.track.id)) {
            console.log("Skipping (already downloaded): " + song.track.name);
            count++;
            continue;
        }
        downloadQueue.addTask(new TelegramTask({
            track: song.track,
            added_at: new Date(song.added_at),
            onSuccess: async (result) => {
                db.insertSong({ songId: song.track.id, title: song.track.name, filename: result.filename });
                await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await parseSpotifyMetadata(song.track));
                console.log("✅ Saved:", song.track.name);
                count++;
                if (count >= tracks.length)
                    bot.sendMessage(chatId, `✅ playlist downloaded`);
            },
            // try another time
            onFailure: async () => {
                downloadQueue.addTask(new TelegramTask({
                    track: song.track,
                    added_at: new Date(song.added_at),
                    onSuccess: async (result) => {
                        db.insertSong({ songId: song.track.id, title: song.track.name, filename: result.filename });
                        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await parseSpotifyMetadata(song.track));
                        console.log("✅ Saved:", song.track.name);
                        count++;
                        if (count >= tracks.length)
                            bot.sendMessage(chatId, `✅ playlist downloaded`);
                    },
                    onFailure: async () => {
                        bot.sendMessage(chatId, `❌ Failed to download: ${song.track.name}`);
                        console.log(`❌ Failed to download: ${song.track.name}`);
                        count++;
                        if (count >= tracks.length)
                            bot.sendMessage(chatId, `✅ playlist downloaded`);
                    }
                }));
            }
        }));
    }
});
app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});
app.listen(3000, () => console.log("Server running on port 3000"));
