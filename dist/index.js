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
import { PlaylistSong } from "./models/PlaylistSong.js";
import PriorityWorkerQueue from "./core/PriorityWorkerQueue.js";
import TelegramWorker from "./telegram/TelegramWorker.js";
import { TelegramTask } from "./telegram/TelegramTask.js";
const DownloadQueue = (PriorityWorkerQueue);
let tgWorkers = TELEGRAM_CLIENTS.map((client) => new TelegramWorker(client, RESOLVERS));
let downloadQueue = new DownloadQueue(tgWorkers);
const bot = new TelegramBot(TELEGRAM_BOT.TELEGRAM_BOT_TOKEN);
await mongoose.connect(DATABASE.DB_URL);
var MENUS;
(function (MENUS) {
    MENUS["OPTIONS"] = "O";
    MENUS["LOGIN"] = "L";
    MENUS["DOWNLOAD_PLAYLIST"] = "DP";
    MENUS["EXPORT_PLAYLIST"] = "EP";
})(MENUS || (MENUS = {}));
const SEP = '|';
// Needs to make a string that can fit in 64 bytes
function CommandStringify(cmd) {
    switch (cmd.command) {
        case MENUS.DOWNLOAD_PLAYLIST:
            {
                let args = cmd.args;
                return `${MENUS.DOWNLOAD_PLAYLIST}${SEP}${args.playlistId}`;
            }
        case MENUS.EXPORT_PLAYLIST:
            {
                let args = cmd.args;
                return `${MENUS.EXPORT_PLAYLIST}${SEP}${args.playlistId}`;
            }
        case MENUS.LOGIN:
            return MENUS.LOGIN;
        case MENUS.OPTIONS:
            return MENUS.OPTIONS;
    }
}
function CommandParse(str) {
    const parts = str.split(SEP);
    const command = parts[0];
    switch (command) {
        case MENUS.DOWNLOAD_PLAYLIST:
            return {
                command,
                args: { playlistId: parts[1] }
            };
        case MENUS.EXPORT_PLAYLIST:
            return { command, args: { playlistId: parts[1] } };
        case MENUS.LOGIN:
            return { command, args: {} };
        case MENUS.OPTIONS:
            return { command, args: {} };
        default:
            throw new Error(`Unknown command: ${command}`);
    }
}
bot.onText(/\/start/, async (msg) => {
    try {
        const chatId = msg.chat.id.toString();
        let user = await SpotifyUser.get(chatId, bot);
        const playlists = await user.getPlaylists();
        let menu = [[{
                    text: "🎵 Saved Music",
                    callback_data: CommandStringify({
                        command: MENUS.DOWNLOAD_PLAYLIST,
                        args: { playlistId: "saved" }
                    })
                }]];
        let userRecord = (await User.findOne({ telegram_chat_id: chatId }));
        let playlistData = {
            spotifyId: "saved",
            name: "🎵 Saved Music",
            downloaded: false,
            owner: userRecord._id
        };
        let tmp;
        let playlist;
        if ((tmp = await Playlist.findOne(playlistData)))
            playlist = tmp;
        else {
            playlist = new Playlist(playlistData);
            playlist.save();
            userRecord.playlists.push(playlist._id);
        }
        for (let p of playlists) {
            menu.push([{
                    text: p.name,
                    callback_data: CommandStringify({
                        command: MENUS.DOWNLOAD_PLAYLIST,
                        args: { playlistId: p.id }
                    })
                }]);
            playlistData = {
                spotifyId: p.id,
                name: p.name,
                downloaded: false,
                owner: userRecord._id
            };
            if ((tmp = await Playlist.findOne(playlistData)))
                playlist = tmp;
            else {
                playlist = new Playlist(playlistData);
                playlist.save();
                userRecord.playlists.push(playlist._id);
            }
        }
        userRecord.save();
        bot.sendMessage(user.getChatId(), "Select which playlist you want to download:", {
            reply_markup: {
                inline_keyboard: menu,
            },
        });
    }
    catch (e) {
        console.log(e);
    }
});
// export a playlist as M3U
bot.onText(/\/export/, async (msg) => {
    try {
        let user = await User.findOne({ telegram_chat_id: msg.chat.id })
            .populate("playlists")
            .exec();
        let menu = [];
        user.playlists.filter(p => p.downloaded).forEach(playlist => {
            menu.push([{
                    text: playlist.name,
                    callback_data: CommandStringify({
                        command: MENUS.EXPORT_PLAYLIST,
                        args: { playlistId: playlist.spotifyId }
                    })
                }]);
        });
        bot.sendMessage(user.telegram_chat_id, "Select which playlist you want to export:", {
            reply_markup: {
                inline_keyboard: menu,
            },
        });
    }
    catch (e) {
        console.log(e);
    }
});
bot.on("callback_query", async (query) => {
    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);
    if (!query.message || !query.data)
        return;
    const chatId = query.message.chat.id.toString();
    const cmd = CommandParse(query.data);
    switch (cmd.command) {
        case MENUS.DOWNLOAD_PLAYLIST:
            downloadPlaylist(chatId, cmd.args);
            break;
        case MENUS.EXPORT_PLAYLIST:
            exportPlaylist(chatId, cmd.args);
            break;
    }
});
async function exportPlaylist(chatId, args) {
    const user = await User.findOne({ telegram_chat_id: chatId });
    const playlist = await Playlist.findOne({ spotifyId: args.playlistId, owner: user._id });
    const playlistSongs = await PlaylistSong.find({ playlistId: playlist?._id })
        .populate("songId")
        .exec();
    let rawData = "#EXTM3U\n#PLAYLIST:" + playlist.name + "\n";
    for (let song of playlistSongs.sort((a, b) => b.added_at.getTime() - a.added_at.getTime())) {
        if (!song.songId) {
            song.deleteOne();
            continue;
        }
        rawData = rawData.concat(song.songId.filename + "\n");
    }
    const data = Buffer.from(rawData, 'utf-8');
    bot.sendDocument(chatId, data, {}, {
        filename: playlist.name + "." + chatId + ".m3u",
        contentType: 'text/plain'
    });
}
async function downloadPlaylist(chatId, args) {
    let user = await SpotifyUser.get(chatId, bot);
    let playlistData = { spotifyId: args.playlistId, owner: (await User.findOne({ telegram_chat_id: chatId }))?._id };
    let playlist = (await Playlist.findOne(playlistData));
    playlist.downloaded = true;
    playlist.save();
    let tracks;
    if (args.playlistId == "saved")
        tracks = await user.getSavedTracks();
    else
        tracks = await user.getPlaylistTracks(args.playlistId);
    let count = 0;
    for (const song of tracks) {
        if (song.track == null) {
            count++;
            continue;
        }
        let tmp;
        if (tmp = await Song.findOne({ spotify_id: song.track.id })) {
            console.log("Skipping (already downloaded): " + song.track.name);
            let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: tmp.id });
            if (!record)
                (new PlaylistSong({ playlistId: playlist.id, songId: tmp.id, added_at: new Date(song.added_at) })).save();
            count++;
            continue;
        }
        downloadQueue.addTask(new TelegramTask({
            track: song.track,
            added_at: new Date(song.added_at),
            onSuccess: async (result) => {
                let sng = Song.parse(song.track);
                sng.filename = result.filename;
                await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags());
                sng.save();
                let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: sng.id });
                if (!record)
                    (new PlaylistSong({ playlistId: playlist.id, songId: sng.id, added_at: new Date(song.added_at) })).save();
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
                        sng.filename = result.filename;
                        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags());
                        sng.save();
                        let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: sng.id });
                        if (!record)
                            (new PlaylistSong({ playlistId: playlist.id, songId: sng.id, added_at: new Date(song.added_at) })).save();
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
}
app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});
app.listen(3000, () => console.log("Server running on port 3000"));
