import path from "path"
import mongoose, { HydratedDocument } from "mongoose";
import { TelegramClient } from "telegram";
import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";

import { TELEGRAM_BOT, DATABASE, RESOLVERS, TELEGRAM_CLIENTS } from "./secrets.js"
import SpotifyUser from "./SpotifyUser.js"
import { app } from "./serverInstance.js"
import PriorityWorkerQueue from "./core/PriorityWorkerQueue.js";

import DownloadResolver from "./download/DownloadResolver.js";
import { DownloadTaskResult } from "./download/DownloadTask.js";
import { updateMetadata } from "./metadata/metadataManager.js"

import { ISong, Song } from "./models/Song.js";
import { IPlaylist, Playlist } from "./models/Playlist.js";
import { IUser, User } from "./models/User.js";
import { IPlaylistSong, PlaylistSong } from "./models/PlaylistSong.js";

import TelegramWorker from "./telegram/TelegramWorker.js";
import { TelegramTask, TelegramTaskBody } from "./telegram/TelegramTask.js";

const DownloadQueue = PriorityWorkerQueue<void, TelegramTask, TelegramWorker>;
type DownloadQueue = InstanceType<typeof DownloadQueue>;

let tgWorkers: TelegramWorker[] = TELEGRAM_CLIENTS.map((client: TelegramClient) => new TelegramWorker(client, RESOLVERS))
let downloadQueue = new DownloadQueue(tgWorkers)

const bot = new TelegramBot(TELEGRAM_BOT.TELEGRAM_BOT_TOKEN);

await mongoose.connect(DATABASE.DB_URL)

enum MENUS {
    OPTIONS = 'O',
    HELP = 'H',
    LOGIN = 'LI',
    LOGOUT = 'LO',
    DOWNLOAD_PLAYLIST = 'DP',
    EXPORT_PLAYLIST = 'EP',
    BACK = 'B'
}

const MENU_DESCRIPTIONS = {
    [MENUS.OPTIONS]: "Overview of all the commands",
    [MENUS.HELP]: "Full description of all the commands",
    [MENUS.LOGIN]: "Sign in into Spotify",
    [MENUS.LOGOUT]: "Sign out from Spotify",
    [MENUS.DOWNLOAD_PLAYLIST]: "Select a playlist of yours from Spotify to download",
    [MENUS.EXPORT_PLAYLIST]: "Select a playlist of yours from Spotify to export as .m3u file",
    [MENUS.BACK]: "go back to the previous menu"
}

const MENU_NAMES = {
    [MENUS.OPTIONS]: "start",
    [MENUS.HELP]: "help",
    [MENUS.LOGIN]: "login",
    [MENUS.LOGOUT]: "logout",
    [MENUS.DOWNLOAD_PLAYLIST]: "download",
    [MENUS.EXPORT_PLAYLIST]: "export",
    [MENUS.BACK]: "back"
}

type CommandArgs = {
    [MENUS.OPTIONS]: { option: MENUS };
    [MENUS.HELP]: null;
    [MENUS.LOGIN]: null;
    [MENUS.LOGOUT]: null;
    [MENUS.DOWNLOAD_PLAYLIST]: { playlistId: string } | null;
    [MENUS.EXPORT_PLAYLIST]: { playlistId: string } | null;
    [MENUS.BACK]: any;
}

type Command<C extends MENUS = MENUS> = {
    name?: string;
    command: C;
    args: CommandArgs[C];
    description?: string;
    back?: boolean
};

const SEP = '|'

// Needs to make a string that can fit in 64 bytes
function CommandStringify<C extends MENUS>(cmd: Command<C>): string {
    switch (cmd.command) {
        case MENUS.DOWNLOAD_PLAYLIST:
            {
                let args = cmd.args as CommandArgs[MENUS.DOWNLOAD_PLAYLIST]
                if (args)
                    return `${MENUS.DOWNLOAD_PLAYLIST}${SEP}${args.playlistId}`
                return MENUS.DOWNLOAD_PLAYLIST
            }
        case MENUS.EXPORT_PLAYLIST:
            {
                let args = cmd.args as CommandArgs[MENUS.EXPORT_PLAYLIST]
                if (args)
                    return `${MENUS.EXPORT_PLAYLIST}${SEP}${args.playlistId}`
                return MENUS.EXPORT_PLAYLIST
            }
        case MENUS.OPTIONS:
            {
                let args = cmd.args as CommandArgs[MENUS.OPTIONS]
                return `${MENUS.OPTIONS}${SEP}${args.option}`
            }
        default:
            return cmd.command
    }
}

function CommandParse(str: string): Command {
    const parts = str.split(SEP);

    let back = false
    // routing: OPTIONS|EXPORT|spotifyId --> EXPORT|spotifyId
    if (parts.length !== 1 && parts[0] == MENUS.OPTIONS) {
        parts.shift()
        back = true
    }

    const command = parts[0] as MENUS;

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

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    try {
        let botDesc = await bot.getMe()
        const chatId = msg.chat.id.toString()

        bot.sendMessage(chatId, "Welcome to " + botDesc.first_name, {
            reply_markup: {
                inline_keyboard: await getOptionMenu(chatId),
            },
        });
    } catch (e) {
        console.error(e)
    }
})

async function getOptionMenu(chatId: string): Promise<TelegramBot.InlineKeyboardButton[][]> {
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
    ]

    return menu
}

bot.onText(/\/help/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id.toString();

    let description = "**List of all commands**:\n"
    for (let menu of Object.values(MENUS)) {
        description += `/${MENU_NAMES[menu]} - ${MENU_DESCRIPTIONS[menu]}\n`
    }

    bot.sendMessage(chatId, description, { parse_mode: 'Markdown' })
})

bot.onText(/\/login/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id.toString()

    try {
        await logout(chatId)

        SpotifyUser.get(chatId, bot)
    } catch (e) {
        console.log(e)
    }
})

bot.onText(/\/logout/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id.toString()

    try {
        logout(chatId)
    } catch (e) {
        console.log(e)
    }
})

async function logout(chatId: string) {
    let user = await User.findOne({ telegram_chat_id: chatId })
        .populate("playlists")
        .exec() as unknown as Omit<HydratedDocument<IUser>, 'playlists'> & Record<'playlists', HydratedDocument<IPlaylist>[]>

    if (!user)
        return

    for (let playlist of user.playlists) {
        await PlaylistSong.deleteMany({ playlistId: playlist._id })
    }

    await Playlist.deleteMany({ owner: user._id })
    await User.deleteOne({ telegram_chat_id: chatId })
}

bot.onText(/\/download/, async (msg: TelegramBot.Message) => {
    try {
        const chatId = msg.chat.id.toString()

        bot.sendMessage(chatId, "Select which playlist you want to download:", {
            reply_markup: {
                inline_keyboard: await getDownloadMenu(chatId),
            },
        });
    } catch (e) {
        console.log(e)
    }
});

async function getDownloadMenu(chatId: string, back = false): Promise<TelegramBot.InlineKeyboardButton[][]> {
    let user = await SpotifyUser.get(chatId, bot)

    const playlists = await user.getPlaylists()
    let menu = [[{
        text: "🎵 Saved Music",
        callback_data: CommandStringify({
            command: MENUS.DOWNLOAD_PLAYLIST,
            args: { playlistId: "saved" }
        })
    }]]

    let userRecord = (await User.findOne({ telegram_chat_id: chatId }))!;
    let playlistData = {
        spotifyId: "saved",
        name: "🎵 Saved Music",
        owner: userRecord._id
    }

    let tmp: any
    let playlist: HydratedDocument<IPlaylist>
    if ((tmp = await Playlist.findOne(playlistData)))
        playlist = tmp
    else {
        playlist = new Playlist(playlistData)
        playlist.downloaded = false
        playlist.save()

        userRecord.playlists!.push(playlist._id as unknown as mongoose.Schema.Types.ObjectId)
    }

    for (let p of playlists) {
        menu.push([{
            text: p.name,
            callback_data: CommandStringify({
                command: MENUS.DOWNLOAD_PLAYLIST,
                args: { playlistId: p.id }
            })
        }])

        playlistData = {
            spotifyId: p.id,
            name: p.name,
            owner: userRecord._id
        }

        if ((tmp = await Playlist.findOne(playlistData)))
            playlist = tmp
        else {
            playlist = new Playlist(playlistData)
            playlist.downloaded = false
            playlist.save()

            userRecord.playlists!.push(playlist._id as unknown as mongoose.Schema.Types.ObjectId)
        }
    }

    userRecord.save()

    if (back)
        menu.push([{
            text: "◀️", callback_data: CommandStringify({
                command: MENUS.BACK,
                args: null
            })
        }])

    return menu
}

// export a playlist as M3U
bot.onText(/\/export/, async (msg: TelegramBot.Message) => {
    try {
        const chatId = msg.chat.id.toString()

        bot.sendMessage(chatId, "Select which playlist you want to export:", {
            reply_markup: {
                inline_keyboard: await getExportMenu(chatId),
            },
        });

    } catch (e) {
        console.log(e)
    }
});

async function getExportMenu(chatId: string, back = false): Promise<TelegramBot.InlineKeyboardButton[][]> {
    let user = await User.findOne({ telegram_chat_id: chatId })
        .populate("playlists")
        .exec() as unknown as Omit<HydratedDocument<IUser>, 'playlists'> & Record<'playlists', HydratedDocument<IPlaylist>[]>

    let menu: TelegramBot.InlineKeyboardButton[][] = []
    user!.playlists.filter(p => p.downloaded).forEach(playlist => {
        menu.push([{
            text: playlist.name,
            callback_data: CommandStringify({
                command: MENUS.EXPORT_PLAYLIST,
                args: { playlistId: playlist.spotifyId }
            })
        }])
    })

    if (back)
        menu.push([{
            text: "◀️", callback_data: CommandStringify({
                command: MENUS.BACK,
                args: null
            })
        }])

    return menu
}

bot.on("callback_query", async (query: CallbackQuery) => {
    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);

    if (!query.message || !query.data)
        return

    const chatId = query.message.chat.id.toString();
    const msgId = query.message.message_id
    const cmd: Command = CommandParse(query.data)

    try {
        switch (cmd.command) {
            case MENUS.OPTIONS:
                {
                    const botDesc = await bot.getMe()
                    bot.editMessageText("Welcome to " + botDesc.first_name, {
                        chat_id: chatId,
                        message_id: msgId,
                        reply_markup: {
                            inline_keyboard: await getOptionMenu(chatId),
                        },
                    });
                    return
                }
            case MENUS.BACK:
                {
                    const botDesc = await bot.getMe()
                    bot.editMessageText("Welcome to " + botDesc.first_name, {
                        chat_id: chatId,
                        message_id: msgId,
                        reply_markup: {
                            inline_keyboard: await getOptionMenu(chatId),
                        },
                    });
                    return
                }
            case MENUS.DOWNLOAD_PLAYLIST:
                {
                    if (cmd.args != null)
                        downloadPlaylist(chatId, cmd.args as NonNullable<CommandArgs[MENUS.DOWNLOAD_PLAYLIST]>);
                    else
                        bot.editMessageText("Select which playlist you want to download:", {
                            chat_id: chatId,
                            message_id: msgId,
                            reply_markup: {
                                inline_keyboard: await getDownloadMenu(chatId, true),
                            },
                        });

                    return
                }
            case MENUS.EXPORT_PLAYLIST:
                {
                    if (cmd.args != null)
                        exportPlaylist(chatId, cmd.args as NonNullable<CommandArgs[MENUS.EXPORT_PLAYLIST]>);

                    else
                        bot.editMessageText("Select which playlist you want to export:", {
                            chat_id: chatId,
                            message_id: msgId,
                            reply_markup: {
                                inline_keyboard: await getExportMenu(chatId, true),
                            },
                        });
                    return
                }
            case MENUS.HELP:
                {
                    let description = "**List of all commands**:\n"
                    for (let menu of Object.values(MENUS)) {
                        description += `/${MENU_NAMES[menu]} - ${MENU_DESCRIPTIONS[menu]}\n`
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
                    })
                }
            case MENUS.LOGIN:
                {
                    await logout(chatId)
                    SpotifyUser.get(chatId, bot)
                }
            case MENUS.LOGOUT:
                {
                    logout(chatId)
                }
        }
    } catch (e) {
        console.error(e)
    }

})

async function exportPlaylist(chatId: string, args: NonNullable<CommandArgs[MENUS.EXPORT_PLAYLIST]>): Promise<void> {
    type Populated<T, K extends keyof T, P> = Omit<HydratedDocument<T>, K> & Record<K, HydratedDocument<P> | null>;

    const user = await User.findOne({ telegram_chat_id: chatId })
    const playlist = (await Playlist.findOne({ spotifyId: args.playlistId, owner: user!._id }))!
    const playlistSongs = await PlaylistSong.find({ playlistId: playlist._id })
        .populate("songId")
        .exec() as unknown as Populated<IPlaylistSong, 'songId', ISong>[];

    let rawData = "#EXTM3U\n#PLAYLIST:" + playlist.name + "\n"
    for (let song of playlistSongs.sort((a, b) => b.added_at.getTime() - a.added_at.getTime())) {
        if (!song.songId) {
            song.deleteOne()
            continue
        }

        rawData = rawData.concat(song.songId.filename + "\n")
    }

    const data = Buffer.from(rawData, 'utf-8');

    bot.sendDocument(chatId, data, {}, {
        filename: playlist.name + ".m3u",
        contentType: 'application/octet-stream'
    });
}

async function downloadPlaylist(chatId: string, args: NonNullable<CommandArgs[MENUS.DOWNLOAD_PLAYLIST]>): Promise<void> {
    let user = await SpotifyUser.get(chatId, bot)

    let playlistData: any = { spotifyId: args.playlistId, owner: (await User.findOne({ telegram_chat_id: chatId }))?._id }
    let playlist = (await Playlist.findOne(playlistData))!

    playlist.downloaded = true
    playlist.save()

    let tracks: SpotifyApi.SavedTrackObject[] | SpotifyApi.PlaylistTrackObject[]
    if (args.playlistId == "saved")
        tracks = await user.getSavedTracks()
    else
        tracks = await user.getPlaylistTracks(args.playlistId)

    let count = 0
    for (const song of tracks) {
        if (song.track == null) {
            count++;
            continue
        }

        let tmp: any
        if (tmp = await Song.findOne({ spotify_id: song.track.id })) {
            console.log("Skipping (already downloaded): " + song.track.name)
            let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: tmp.id })
            if (!record)
                (new PlaylistSong({ playlistId: playlist.id, songId: tmp.id, added_at: new Date(song.added_at) })).save()
            count++;
            continue;
        }

        if (song.track.external_ids.isrc == undefined) {
            count++
            bot.sendMessage(chatId, `❌ Failed to download: ${song.track.name} ${song.track.external_urls.spotify}\n metadata not available.`)
            continue;
        }

        downloadQueue.addTask(new TelegramTask({
            track: song.track,
            added_at: new Date(song.added_at),
            handlers: {
                onSuccess: async (result: DownloadTaskResult) => {
                    let sng = Song.parse(song.track!)
                    sng.filename = result.filename
                    await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags())
                    sng.save()

                    let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: sng.id })
                    if (!record)
                        (new PlaylistSong({ playlistId: playlist.id, songId: sng.id, added_at: new Date(song.added_at) })).save()

                    console.log("✅ Saved:", song.track!.name);
                    count++;
                    if (count >= tracks.length)
                        bot.sendMessage(chatId, `✅ playlist downloaded`)
                },
                // try another time
                onFailure: async () => {
                    downloadQueue.addTask(new TelegramTask({
                        track: song.track!,
                        added_at: new Date(song.added_at),
                        handlers: {
                            onSuccess: async (result: DownloadTaskResult) => {
                                let sng = Song.parse(song.track!)
                                sng.filename = result.filename
                                await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags())
                                sng.save()

                                let record = await PlaylistSong.findOne({ playlistId: playlist.id, songId: sng.id })
                                if (!record)
                                    (new PlaylistSong({ playlistId: playlist.id, songId: sng.id, added_at: new Date(song.added_at) })).save()

                                console.log("✅ Saved:", song.track!.name);
                                count++;
                                if (count >= tracks.length)
                                    bot.sendMessage(chatId, `✅ playlist downloaded`)
                            },
                            onFailure: async () => {
                                bot.sendMessage(chatId, `❌ Failed to download: ${song.track!.name}`)
                                console.log(`❌ Failed to download: ${song.track!.name}`)
                                count++;
                                if (count >= tracks.length)
                                    bot.sendMessage(chatId, `✅ playlist downloaded`)
                            }
                        }
                    }))
                }
            }
        }))
    }
}

app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});

app.listen(3000, () => console.log("Server running on port 3000"));