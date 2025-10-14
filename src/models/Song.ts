import { Schema, model, Model, HydratedDocument } from "mongoose"
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";
import { Tags } from "../metadataManager";

async function fetchImage(url: string | URL) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
}

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

interface ISongMethods {
    toTags(): Promise<Tags>;
}

interface ISongModel extends Model<ISong, {}, ISongMethods> {
    parse(track: SpotifyApi.TrackObjectFull): HydratedDocument<ISong, ISongMethods>;
}

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
export const SongSchema = new Schema<ISong, ISongModel, ISongMethods>({
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
}, {
    methods: {
        async toTags() {
            let cover_url = this.album.cover_url
            const buffer = await fetchImage(cover_url)
            const { mime } = (await fileTypeFromBuffer(buffer))!

            if (mime !== 'image/jpeg' && mime !== 'image/png') {
                throw new Error(`only support image/jpeg and image/png picture temporarily, current import ${mime}`);
            }
            return {
                spotifyId: this.spotify_id,
                title: this.title,
                artists: this.artists.map(artist => artist.name),
                album: this.album.name,
                year: this.album.released_at.toString(),
                trackNumber: this.track_number.toString(),
                isrc: this.isrc,
                cover: {
                    buffer: buffer,
                    mime: mime
                },
                spotifyUrl: "https://open.spotify.com/track/" + this.spotify_id,
            }
        }
    },
    statics: {
        parse(track: SpotifyApi.TrackObjectFull) {
            return new this({
                spotify_id: track.id,
                title: track.name,
                artists: track.artists.map(a => ({ name: a.name, spotify_id: a.id })),
                album: {
                    name: track.album.name,
                    spotify_id: track.album.id,
                    released_at: track.album.release_date,
                    cover_url: track.album.images.find(img => img.height === 640)?.url ?? track.album.images[0]?.url
                },
                released_at: track.album.release_date,
                track_number: track.track_number,
                isrc: track.external_ids.isrc
            });
        }
    }
})

export const Song = model<ISong, ISongModel>("Song", SongSchema)