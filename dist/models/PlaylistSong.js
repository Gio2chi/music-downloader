import { Schema, model } from "mongoose";
const PlaylistSongSchema = new Schema({
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist", required: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", required: true },
    added_at: { type: Date, default: Date.now }
});
PlaylistSongSchema.index({ playlistId: 1, songId: 1, added_at: 1 }, { unique: true });
export const PlaylistSong = model("PlaylistSong", PlaylistSongSchema);
