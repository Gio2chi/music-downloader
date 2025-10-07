import { Schema, model } from "mongoose";
export const UserSchema = new Schema({
    spotify_id: { type: String, required: true, index: true },
    telegram_chat_id: { type: String, required: true, index: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    playlists: { type: [Schema.Types.ObjectId], ref: "Playlist", default: [] },
    email: String
}, { autoIndex: false });
export const User = model("User", UserSchema);
