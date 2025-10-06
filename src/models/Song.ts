import { Schema, model } from "mongoose"

export interface IAlbum {
    name: string,
    spotify_id: string,
    released_at: Date,
    cover_url: string
}
export const AlbumSchema = new Schema<IAlbum>({
    name: { type: String, required: true },
    spotify_id: { type: String, required: true },
    released_at: { type: Date, required: true },
    cover_url: { type: String, required: true }
}, { autoIndex: false })

export interface IArtist {
    name: string,
    spotify_id: string,
    img_url?: string
}
export const ArtistSchema = new Schema<IArtist>({
    name: { type: String, required: true },
    spotify_id: { type: String, required: true },
    img_url: String
}, { autoIndex: false })

export interface ISong {
    filename: string,
    artists: IArtist[],
    title: string,
    album: IAlbum,
    released_at: Date,
    genres: string[],
    track_number: number,
    lyrics?: string,
    cover_url?: string,
    spotify_id: string,
    isrc: string
}
export const SongSchema = new Schema<ISong>({
    filename: { type: String, required: true },
    artists: [ArtistSchema],
    title: { type: String, required: true, index: true },
    album: AlbumSchema,
    released_at: { type: Date, required: true },
    genres: { type: [String], required: true, index: true },
    track_number: { type: Number, required: true },
    lyrics: String,
    cover_url: String,
    spotify_id: { type: String, required: true, index: true },
    isrc: { type: String, required: true, index: true }
})

export const Song = model("Song", SongSchema)