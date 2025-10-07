import { Schema, model } from "mongoose";
export const PlaylistSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
});
export const Playlist = model("Playlist", PlaylistSchema);
