import { Schema, model } from "mongoose"

export interface IPlaylist {
    name: string,
}

export const PlaylistSchema = new Schema<IPlaylist>({
    name: { type: String, required: true },
});

export const Playlist = model("Playlist", PlaylistSchema);
