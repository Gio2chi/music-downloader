import { Schema, model } from "mongoose"

export interface IPlaylist {
    owner: Schema.Types.ObjectId,
    name: string,
    spotifyId: string,
    downloaded: boolean
    // TODO: #11 inProgress: boolean to track if the download has been completed in order to notify when exporting
}

export const PlaylistSchema = new Schema<IPlaylist>({
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    spotifyId: { type: String, required: true, default: "saved"},
    downloaded: { type: Schema.Types.Boolean, default: false }
});

export const Playlist = model("Playlist", PlaylistSchema);
