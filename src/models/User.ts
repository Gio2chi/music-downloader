import { Schema, model } from "mongoose"

export interface IUser {
    spotify_id: string,
    telegram_chat_id: string,
    access_token: string,
    refresh_token: string,
    expires_at: number,
    playlists?: Schema.Types.ObjectId[]
    email?: string
}
export const UserSchema = new Schema<IUser>({
    spotify_id: { type: String, required: true, index: true },
    telegram_chat_id: { type: String, required: true, index: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Number, required: true },
    playlists: { type: [Schema.Types.ObjectId], ref: "Playlist", default: [] },
    email: String
}, { autoIndex: false })

export const User = model("User", UserSchema)