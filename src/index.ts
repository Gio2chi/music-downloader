import TelegramBot from "node-telegram-bot-api";
import path from "path"
import mongoose, { HydratedDocument } from "mongoose";

import { TELEGRAM_BOT, DATABASE, RESOLVERS, TELEGRAM_CLIENTS } from "./secrets.js"
import SpotifyUser from "./SpotifyUser.js"
import { app } from "./serverInstance.js"

import DownloadResolver from "./download/DownloadResolver.js";
import { updateMetadata } from "./metadataManager.js"
import { Song } from "./models/Song.js";
import { IPlaylist, Playlist } from "./models/Playlist.js";
import { IUser, User } from "./models/User.js";
import { PlaylistSong } from "./models/PlaylistSong.js";

import PriorityWorkerQueue from "./core/PriorityWorkerQueue.js";
import TelegramWorker from "./telegram/TelegramWorker.js";
import { TelegramTask, TelegramTaskBody } from "./telegram/TelegramTask.js";
import { TelegramClient } from "telegram";
import { DownloadTaskResult } from "./download/DownloadTask.js";

const DownloadQueue = PriorityWorkerQueue<TelegramTaskBody, void, TelegramWorker>;
type DownloadQueue = InstanceType<typeof DownloadQueue>;

TELEGRAM_CLIENTS.forEach(async (client: TelegramClient) => await client.connect())

let tgWorkers: TelegramWorker[] = TELEGRAM_CLIENTS.map((client: TelegramClient) => new TelegramWorker(client, RESOLVERS))
let downloadQueue = new DownloadQueue(tgWorkers)

const bot = new TelegramBot(TELEGRAM_BOT.TELEGRAM_BOT_TOKEN);

await mongoose.connect(DATABASE.DB_URL)

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    try {
        let user = await SpotifyUser.get(msg.chat.id.toString(), bot)
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
    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);

    const chatId = query.message.chat.id;
    const playlistSpotifyId = query.data;

    let user = await SpotifyUser.get(chatId, bot)

    let playlistData: any = { name: playlistSpotifyId, owner: (await User.findOne({ telegram_chat_id: chatId }))?._id }
    let tmp: any
    let playlist: HydratedDocument<IPlaylist>
    if ((tmp = await Playlist.findOne(playlistData)))
        playlist = tmp
    else {
        playlist = new Playlist(playlistData)
        playlist.save()

        let usr = await User.findById(playlist.owner)
        usr!.playlists!.push(playlist._id as unknown as mongoose.Schema.Types.ObjectId)
        usr!.save()
    }



    let tracks: SpotifyApi.SavedTrackObject[] | SpotifyApi.PlaylistTrackObject[]
    if (playlistSpotifyId == "saved")
        tracks = await user.getSavedTracks()
    else
        tracks = await user.getPlaylistTracks(playlistSpotifyId)

    let count = 0
    for (const song of tracks) {
        if (song.track == null) {
            count++;
            continue
        }

        if (await Song.findOne({ spotify_id: song.track.id })) {
            console.log("Skipping (already downloaded): " + song.track.name)
            count++;
            continue;
        }

        downloadQueue.addTask(new TelegramTask({
            track: song.track,
            added_at: new Date(song.added_at),
            onSuccess: async (result: DownloadTaskResult) => {
                let sng = Song.parse(song.track!)
                await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags())
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
                    onSuccess: async (result: DownloadTaskResult) => {
                        let sng = Song.parse(song.track!)
                        await updateMetadata(path.join(DownloadResolver.getFolder(), result.filename), await sng.toTags())
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
                }))
            }
        }))
    }
})

app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});

app.listen(3000, () => console.log("Server running on port 3000"));