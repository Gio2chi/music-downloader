import path from "path";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import { TELEGRAM_BOT, DATABASE, RESOLVERS, TELEGRAM_CLIENTS } from "./secrets.js";
import SpotifyUser from "./SpotifyUser.js";
import { app } from "./serverInstance.js";
import PriorityWorkerQueue from "./core/PriorityWorkerQueue.js";
import DownloadResolver from "./download/DownloadResolver.js";
import { updateMetadata } from "./metadata/metadataManager.js";
import { Song } from "./models/Song.js";
import { Playlist } from "./models/Playlist.js";
import { User } from "./models/User.js";
import { PlaylistSong } from "./models/PlaylistSong.js";
import TelegramWorker from "./telegram/TelegramWorker.js";
import { TelegramTask } from "./telegram/TelegramTask.js";
import { LyricTask } from "./metadata/LyricTask.js";
import { lrclibWorker } from "./metadata/lyricWorkers/lrclib.js";
const DownloadQueue = (PriorityWorkerQueue);
const LyricQueue = (PriorityWorkerQueue);
let lyricQueue = new LyricQueue([new lrclibWorker()]);
let tgWorkers = TELEGRAM_CLIENTS.map((client) => new TelegramWorker(client, RESOLVERS));
let downloadQueue = new DownloadQueue(tgWorkers);
const bot = new TelegramBot(TELEGRAM_BOT.TELEGRAM_BOT_TOKEN);
await mongoose.connect(DATABASE.DB_URL);
var MENUS;
(function (MENUS) {
    MENUS["OPTIONS"] = "O";
    MENUS["HELP"] = "H";
    MENUS["LOGIN"] = "LI";
    MENUS["LOGOUT"] = "LO";
    MENUS["DOWNLOAD_PLAYLIST"] = "DP";
    MENUS["EXPORT_PLAYLIST"] = "EP";
    MENUS["BACK"] = "B";
})(MENUS || (MENUS = {}));
const MENU_DESCRIPTIONS = {
    [MENUS.OPTIONS]: "Overview of all the commands",
    [MENUS.HELP]: "Full description of all the commands",
    [MENUS.LOGIN]: "Sign in into Spotify",
    [MENUS.LOGOUT]: "Sign out from Spotify",
    [MENUS.DOWNLOAD_PLAYLIST]: "Select a playlist of yours from Spotify to download",
    [MENUS.EXPORT_PLAYLIST]: "Select a playlist of yours from Spotify to export as .m3u file",
    [MENUS.BACK]: "go back to the previous menu"
};
const MENU_NAMES = {
    [MENUS.OPTIONS]: "start",
    [MENUS.HELP]: "help",
    [MENUS.LOGIN]: "login",
    [MENUS.LOGOUT]: "logout",
    [MENUS.DOWNLOAD_PLAYLIST]: "download",
    [MENUS.EXPORT_PLAYLIST]: "export",
    [MENUS.BACK]: "back"
};
const SEP = '|';
// Needs to make a string that can fit in 64 bytes
function CommandStringify(cmd) {
    switch (cmd.command) {
        case MENUS.DOWNLOAD_PLAYLIST:
            {
                let args = cmd.args;
                if (args)
                    return `${MENUS.DOWNLOAD_PLAYLIST}${SEP}${args.playlistId}`;
                return MENUS.DOWNLOAD_PLAYLIST;
            }
        case MENUS.EXPORT_PLAYLIST:
            {
                let args = cmd.args;
                if (args)
                    return `${MENUS.EXPORT_PLAYLIST}${SEP}${args.playlistId}`;
                return MENUS.EXPORT_PLAYLIST;
            }
        case MENUS.OPTIONS:
            {
                let args = cmd.args;
                return `${MENUS.OPTIONS}${SEP}${args.option}`;
            }
        default:
            return cmd.command;
    }
}
function CommandParse(str) {
    const parts = str.split(SEP);
    let back = false;
    // routing: OPTIONS|EXPORT|spotifyId --> EXPORT|spotifyId
    if (parts.length !== 1 && parts[0] == MENUS.OPTIONS) {
        parts.shift();
        back = true;
    }
    const command = parts[0];
    switch (command) {
        case MENUS.DOWNLOAD_PLAYLIST:
            return {
                name: MENU_NAMES[command],
                command,
                args: parts[1] ? { playlistId: parts[1] } : null,
                description: MENU_DESCRIPTIONS[command],
                back
            };
        case MENUS.EXPORT_PLAYLIST:
            return {
                name: MENU_NAMES[command],
                command,
                args: parts[1] ? { playlistId: parts[1] } : null,
                description: MENU_DESCRIPTIONS[command],
                back
            };
        // shouldn't fall in this scenario btw
        case MENUS.OPTIONS:
            return {
                name: MENU_NAMES[command],
                command,
                args: { option: parts[0] },
                description: MENU_DESCRIPTIONS[command],
                back
            };
        default:
            return {
                name: MENU_NAMES[command],
                command,
                args: null,
                description: MENU_DESCRIPTIONS[command],
                back
            };
    }
}
bot.onText(/\/start/, async (msg) => {
    try {
        let botDesc = await bot.getMe();
        const chatId = msg.chat.id.toString();
        bot.sendMessage(chatId, "Welcome to " + botDesc.first_name, {
            reply_markup: {
                inline_keyboard: await getOptionMenu(chatId),
            },
        });
    }
    catch (e) {
        console.error(e);
    }
});
async function getOptionMenu(chatId) {
    let menu = [
        [{
                text: MENU_NAMES[MENUS.HELP],
                callback_data: CommandStringify({
                    command: MENUS.OPTIONS,
                    args: { option: MENUS.HELP }
                })
            }],
        [{
                text: MENU_NAMES[MENUS.DOWNLOAD_PLAYLIST],
                callback_data: CommandStringify({
                    command: MENUS.OPTIONS,
                    args: { option: MENUS.DOWNLOAD_PLAYLIST }
                })
            }, {
                text: MENU_NAMES[MENUS.EXPORT_PLAYLIST],
                callback_data: CommandStringify({
                    command: MENUS.OPTIONS,
                    args: { option: MENUS.EXPORT_PLAYLIST }
                })
            }],
        [{
                text: MENU_NAMES[MENUS.LOGIN],
                callback_data: CommandStringify({
                    command: MENUS.OPTIONS,
                    args: { option: MENUS.LOGIN }
                })
            }, {
                text: MENU_NAMES[MENUS.LOGOUT],
                callback_data: CommandStringify({
                    command: MENUS.OPTIONS,
                    args: { option: MENUS.LOGOUT }
                })
            }]
    ];
    return menu;
}
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id.toString();
    let description = "**List of all commands**:\n";
    for (let menu of Object.values(MENUS)) {
        description += `/${MENU_NAMES[menu]} - ${MENU_DESCRIPTIONS[menu]}\n`;
    }
    bot.sendMessage(chatId, description, { parse_mode: 'Markdown' });
});
bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id.toString();
    try {
        await logout(chatId);
        SpotifyUser.get(chatId, bot);
    }
    catch (e) {
        console.log(e);
    }
});
bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id.toString();
    try {
        logout(chatId);
    }
    catch (e) {
        console.log(e);
    }
});
async function logout(chatId) {
    let user = await User.findOne({ telegram_chat_id: chatId })
        .populate("playlists")
        .exec();
    if (!user)
        return;
    for (let playlist of user.playlists) {
        await PlaylistSong.deleteMany({ playlistId: playlist._id });
    }
    await Playlist.deleteMany({ owner: user._id });
    await User.deleteOne({ telegram_chat_id: chatId });
}
bot.onText(/\/download/, async (msg) => {
    try {
        const chatId = msg.chat.id.toString();
        bot.sendMessage(chatId, "Select which playlist you want to download:", {
            reply_markup: {
                inline_keyboard: await getDownloadMenu(chatId),
            },
        });
    }
    catch (e) {
        console.log(e);
    }
});
async function getDownloadMenu(chatId, back = false) {
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
        owner: userRecord._id
    };
    let tmp;
    let playlist;
    if ((tmp = await Playlist.findOne(playlistData)))
        playlist = tmp;
    else {
        playlist = new Playlist(playlistData);
        playlist.downloaded = false;
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
            owner: userRecord._id
        };
        if ((tmp = await Playlist.findOne(playlistData)))
            playlist = tmp;
        else {
            playlist = new Playlist(playlistData);
            playlist.downloaded = false;
            playlist.save();
            userRecord.playlists.push(playlist._id);
        }
    }
    userRecord.save();
    if (back)
        menu.push([{
                text: "◀️", callback_data: CommandStringify({
                    command: MENUS.BACK,
                    args: null
                })
            }]);
    return menu;
}
// export a playlist as M3U
bot.onText(/\/export/, async (msg) => {
    try {
        const chatId = msg.chat.id.toString();
        bot.sendMessage(chatId, "Select which playlist you want to export:", {
            reply_markup: {
                inline_keyboard: await getExportMenu(chatId),
            },
        });
    }
    catch (e) {
        console.log(e);
    }
});
async function getExportMenu(chatId, back = false) {
    let user = await User.findOne({ telegram_chat_id: chatId })
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
    if (back)
        menu.push([{
                text: "◀️", callback_data: CommandStringify({
                    command: MENUS.BACK,
                    args: null
                })
            }]);
    return menu;
}
bot.on("callback_query", async (query) => {
    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);
    if (!query.message || !query.data)
        return;
    const chatId = query.message.chat.id.toString();
    const msgId = query.message.message_id;
    const cmd = CommandParse(query.data);
    try {
        switch (cmd.command) {
            case MENUS.OPTIONS:
                {
                    const botDesc = await bot.getMe();
                    bot.editMessageText("Welcome to " + botDesc.first_name, {
                        chat_id: chatId,
                        message_id: msgId,
                        reply_markup: {
                            inline_keyboard: await getOptionMenu(chatId),
                        },
                    });
                    return;
                }
            case MENUS.BACK:
                {
                    const botDesc = await bot.getMe();
                    bot.editMessageText("Welcome to " + botDesc.first_name, {
                        chat_id: chatId,
                        message_id: msgId,
                        reply_markup: {
                            inline_keyboard: await getOptionMenu(chatId),
                        },
                    });
                    return;
                }
            case MENUS.DOWNLOAD_PLAYLIST:
                {
                    if (cmd.args != null)
                        downloadPlaylist(chatId, cmd.args);
                    else
                        bot.editMessageText("Select which playlist you want to download:", {
                            chat_id: chatId,
                            message_id: msgId,
                            reply_markup: {
                                inline_keyboard: await getDownloadMenu(chatId, true),
                            },
                        });
                    return;
                }
            case MENUS.EXPORT_PLAYLIST:
                {
                    if (cmd.args != null)
                        exportPlaylist(chatId, cmd.args);
                    else
                        bot.editMessageText("Select which playlist you want to export:", {
                            chat_id: chatId,
                            message_id: msgId,
                            reply_markup: {
                                inline_keyboard: await getExportMenu(chatId, true),
                            },
                        });
                    return;
                }
            case MENUS.HELP:
                {
                    let description = "**List of all commands**:\n";
                    for (let menu of Object.values(MENUS)) {
                        description += `/${MENU_NAMES[menu]} - ${MENU_DESCRIPTIONS[menu]}\n`;
                    }
                    bot.editMessageText(description, {
                        chat_id: chatId,
                        message_id: msgId,
                        reply_markup: {
                            inline_keyboard: [[{
                                        text: "◀️", callback_data: CommandStringify({
                                            command: MENUS.BACK,
                                            args: null
                                        })
                                    }]]
                        },
                        parse_mode: 'Markdown'
                    });
                }
            case MENUS.LOGIN:
                {
                    await logout(chatId);
                    SpotifyUser.get(chatId, bot);
                }
            case MENUS.LOGOUT:
                {
                    logout(chatId);
                }
        }
    }
    catch (e) {
        console.error(e);
    }
});
async function exportPlaylist(chatId, args) {
    const user = await User.findOne({ telegram_chat_id: chatId });
    const playlist = (await Playlist.findOne({ spotifyId: args.playlistId, owner: user._id }));
    const playlistSongs = await PlaylistSong.find({ playlistId: playlist._id })
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
        filename: playlist.name + ".m3u",
        contentType: 'application/octet-stream'
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
        let tmp = await Song.findOne({ spotify_id: song.track.id });
        if (tmp) {
            console.log("Skipping (already downloaded): " + song.track.name);
            let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: tmp.id });
            if (!record)
                (new PlaylistSong({ playlistId: playlist.id, songId: tmp.id, added_at: new Date(song.added_at) })).save();
            if (!tmp.lyric)
                lyricQueue.addTask(new LyricTask(tmp.toTags()));
            count++;
            continue;
        }
        if (song.track.external_ids.isrc == undefined) {
            count++;
            bot.sendMessage(chatId, `❌ Failed to download: ${song.track.name} ${song.track.external_urls.spotify}\n metadata not available.`);
            continue;
        }
        downloadQueue.addTask(new TelegramTask({
            track: song.track,
            added_at: new Date(song.added_at),
            handlers: {
                onSuccess: async (result) => {
                    let sng = Song.parse(song.track);
                    sng.filename = result.filename;
                    await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), sng.toTags());
                    sng.save();
                    let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: sng.id });
                    if (!record)
                        (new PlaylistSong({ playlistId: playlist.id, songId: sng.id, added_at: new Date(song.added_at) })).save();
                    console.log("✅ Saved:", song.track.name);
                    if (!sng.lyric)
                        lyricQueue.addTask(new LyricTask(sng.toTags()));
                    count++;
                    if (count >= tracks.length)
                        bot.sendMessage(chatId, `✅ playlist downloaded`);
                },
                // try another time
                onFailure: async () => {
                    downloadQueue.addTask(new TelegramTask({
                        track: song.track,
                        added_at: new Date(song.added_at),
                        handlers: {
                            onSuccess: async (result) => {
                                let sng = Song.parse(song.track);
                                sng.filename = result.filename;
                                await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags());
                                sng.save();
                                let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: sng.id });
                                if (!record)
                                    (new PlaylistSong({ playlistId: playlist.id, songId: sng.id, added_at: new Date(song.added_at) })).save();
                                console.log("✅ Saved:", song.track.name);
                                if (!sng.lyric)
                                    lyricQueue.addTask(new LyricTask(sng.toTags()));
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
                        }
                    }));
                }
            }
        }));
    }
}
app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});
app.listen(3000, () => console.log("Server running on port 3000"));
