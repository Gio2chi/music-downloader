import TelegramBot from "node-telegram-bot-api";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/StringSession.js";
import path from "path"
import mongoose, { HydratedDocument } from "mongoose";

import { TELEGRAM_BOT, DATABASE, RESOLVERS, TELEGRAM_CLIENT } from "./secrets.js"
import SpotifyUser from "./SpotifyUser.js"
import { app } from "./serverInstance.js"
import DownloadResolver, { MediaNotFoundError, TimeoutError } from "./DownloadResolver.js";
import { updateMetadata } from "./metadataManager.js"
import { Song } from "./models/Song.js";
import { IPlaylist, Playlist } from "./models/Playlist.js";
import { IUser, User } from "./models/User.js";
import { PlaylistSong } from "./models/PlaylistSong.js";

enum DownloadStatus {
    DOWNLOADED,
    ALREADY_EXISTING,
    FAILED
}

const bot = new TelegramBot(TELEGRAM_BOT.BOT_TOKEN);
await mongoose.connect(DATABASE.DB_URL)

let stringSession = new StringSession(TELEGRAM_CLIENT.TELEGRAM_LOGIN_TOKEN);
const client = new TelegramClient(
    stringSession,
    parseInt(TELEGRAM_CLIENT.TELEGRAM_API_ID, 10),
    TELEGRAM_CLIENT.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
);

await client.connect()
DownloadResolver.setClient(client);

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

    for (const resolver of RESOLVERS)
        resolver.startSession()
    for (let song of tracks) {
        if (song.track == null)
            continue

        let ormSong = Song.parse(song.track)

        if (tmp = await Song.findOne({ spotify_id: song.track.id })) {

            if( !(await PlaylistSong.findOne({ playlistId: playlist._id, songId: tmp._id, added_at: song.added_at })))
            {
                tmp = new PlaylistSong({ playlistId: playlist._id, songId: tmp._id, added_at: song.added_at })
                tmp.save()
            }

            console.log("Skipping (already downloaded): " + song.track!.name)
            continue;
        }

        let response: DownloadStatus = DownloadStatus.FAILED;

        // Download song
        for (const resolver of RESOLVERS) {
            try {
                let filename = await resolver.downloadSong(song.track!.external_urls.spotify)
                ormSong.filename = filename
                ormSong.save()

                if( !(await PlaylistSong.findOne({ playlistId: playlist._id, songId: ormSong._id, added_at: song.added_at })))
                {
                    tmp = new PlaylistSong({ playlistId: playlist._id, songId: ormSong._id, added_at: song.added_at })
                    tmp.save()
                }

                response = DownloadStatus.DOWNLOADED
            } catch (e) {
                if (e instanceof MediaNotFoundError) {
                    response = DownloadStatus.FAILED
                    console.error(e)
                } else if (e instanceof TimeoutError) {
                    console.error(e)
                    console.log("trying again")
                    // try again
                    try {
                        let filename = await resolver.downloadSong(song.track!.external_urls.spotify)
                        ormSong.filename = filename
                        ormSong.save()

                        if( !(await PlaylistSong.findOne({ playlistId: playlist._id, songId: ormSong._id, added_at: song.added_at })))
                        {
                            tmp = new PlaylistSong({ playlistId: playlist._id, songId: ormSong._id, added_at: song.added_at })
                            tmp.save()
                        }

                        response = DownloadStatus.DOWNLOADED
                    } catch (e) {
                        response = DownloadStatus.FAILED
                        console.error(e)
                    }
                } else {
                    console.error("Unexpected error:", e)
                    response = DownloadStatus.FAILED
                }
            }
            if (response != DownloadStatus.FAILED)
                break;
        }

        // Update metadata
        if (response == DownloadStatus.DOWNLOADED) {
            updateMetadata(path.join(DownloadResolver.getFolder(), ormSong.filename), await ormSong.toTags())
            console.log("✅ Saved:", song.track!.name);
        } else if (response == DownloadStatus.FAILED) {
            await bot.sendMessage(chatId, `❌ Failed to download: ${song.track!.name}`);
            console.log(`❌ Failed to download: ${song.track!.name}`)
        }
    }
    bot.sendMessage(chatId, `✅ playlist downloaded`)
})

app.post("/spotifydl/webhook", function (req, res) {
    bot.processUpdate(req.body);
    res.send(200);
});

app.listen(3000, () => console.log("Server running on port 3000"));