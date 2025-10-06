import { Schema, model } from "mongoose";
export const PlaylistSchema = new Schema({
    name: { type: String, required: true },
});
export const Playlist = model("Playlist", PlaylistSchema);
