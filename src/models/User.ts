import { Schema, model } from "mongoose"

export interface IUser {
    userId: string,
    chatId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
    playlists: Schema.Types.ObjectId[]
    email?: string
}
export const UserSchema = new Schema<IUser>({
    userId: { type: String, required: true },
    chatId: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Number, required: true },
    playlists: [{ type: Schema.Types.ObjectId, ref: "Playlist" }],
    email: String
})

export const User = model("User", UserSchema)