import TelegramBot from "node-telegram-bot-api";
import path from "path";
import mongoose from "mongoose";
import { TELEGRAM_BOT, DATABASE, RESOLVERS, TELEGRAM_CLIENTS } from "./secrets.js";
import SpotifyUser from "./SpotifyUser.js";
import { app } from "./serverInstance.js";
import DownloadResolver from "./download/DownloadResolver.js";
import { updateMetadata } from "./metadataManager.js";
import { Song } from "./models/Song.js";
import { Playlist } from "./models/Playlist.js";
import { User } from "./models/User.js";
import PriorityWorkerQueue from "./core/PriorityWorkerQueue.js";
import TelegramWorker from "./telegram/TelegramWorker.js";
import { TelegramTask } from "./telegram/TelegramTask.js";
const DownloadQueue = (PriorityWorkerQueue);
TELEGRAM_CLIENTS.forEach(async (client) => await client.connect());
let tgWorkers = TELEGRAM_CLIENTS.map((client) => new TelegramWorker(client, RESOLVERS));
let downloadQueue = new DownloadQueue(tgWorkers);
const bot = new TelegramBot(TELEGRAM_BOT.TELEGRAM_BOT_TOKEN);
await mongoose.connect(DATABASE.DB_URL);
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
    const playlistSpotifyId = query.data;
    let user = await SpotifyUser.get(chatId, bot);
    let playlistData = { name: playlistSpotifyId, owner: (await User.findOne({ telegram_chat_id: chatId }))?._id };
    let tmp;
    let playlist;
    if ((tmp = await Playlist.findOne(playlistData)))
        playlist = tmp;
    else {
        playlist = new Playlist(playlistData);
        playlist.save();
        let usr = await User.findById(playlist.owner);
        usr.playlists.push(playlist._id);
        usr.save();
    }
    let tracks;
    if (playlistSpotifyId == "saved")
        tracks = await user.getSavedTracks();
    else
        tracks = await user.getPlaylistTracks(playlistSpotifyId);
    let count = 0;
    for (const song of tracks) {
        if (song.track == null) {
            count++;
            continue;
        }
        if (await Song.findOne({ spotify_id: song.track.id })) {
            console.log("Skipping (already downloaded): " + song.track.name);
            count++;
            continue;
        }
        downloadQueue.addTask(new TelegramTask({
            track: song.track,
            added_at: new Date(song.added_at),
            onSuccess: async (result) => {
                let sng = Song.parse(song.track);
                await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags());
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
                        let sng = Song.parse(song.track);
                        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags());
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
