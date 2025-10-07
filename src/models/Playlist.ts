import { Schema, model } from "mongoose"

export interface IPlaylist {
    owner: Schema.Types.ObjectId,
    name: string,
}

export const PlaylistSchema = new Schema<IPlaylist>({
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
});

export const Playlist = model("Playlist", PlaylistSchema);
