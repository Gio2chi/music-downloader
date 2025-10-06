import { Schema, model } from "mongoose";

export interface IPlaylistSong {
    playlistId: Schema.Types.ObjectId;
    songId: Schema.Types.ObjectId;
    added_at: Date;
}

const PlaylistSongSchema = new Schema<IPlaylistSong>({
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist", required: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", required: true },
    added_at: { type: Date, default: Date.now }
});

export const PlaylistSong = model("PlaylistSong", PlaylistSongSchema);
