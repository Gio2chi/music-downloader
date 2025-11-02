import { Schema, model } from "mongoose";
export const AlbumSchema = new Schema({
    name: { type: String, required: true },
    spotify_id: { type: String, required: true },
    released_at: { type: Date, required: true },
    cover_url: { type: String, required: true }
}, { autoIndex: false });
export const ArtistSchema = new Schema({
    name: { type: String, required: true },
    spotify_id: { type: String, required: true },
    img_url: String
}, { autoIndex: false });
export const LyricSchema = new Schema({
    synced: Schema.Types.Boolean,
    lines: { type: [{ timestamp: Number, text: String }] }
});
export const SongSchema = new Schema({
    filename: { type: String, required: true },
    artists: [ArtistSchema],
    title: { type: String, required: true, index: true },
    album: AlbumSchema,
    released_at: { type: Date, required: true },
    genres: { type: [String], required: true, index: true },
    track_number: { type: Number, required: true },
    lyric: LyricSchema,
    duration: { type: Number, required: true },
    cover_url: String,
    spotify_id: { type: String, required: true, index: true },
    isrc: { type: String, required: true, index: true }
}, {
    methods: {
        toTags() {
            return {
                filename: this.filename,
                title: this.title,
                composer: this.artists[0].name,
                artists: this.artists.map(artist => artist.name),
                album: this.album.name,
                year: this.album.released_at.getFullYear(),
                releaseDate: this.released_at,
                trackNumber: this.track_number,
                ids: { isrc: this.isrc, spotify: this.spotify_id },
                cover: this.cover_url ? { url: this.cover_url } : undefined,
                duration: this.duration,
            };
        }
    },
    statics: {
        parse(track) {
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
                duration: track.duration_ms,
                released_at: track.album.release_date,
                track_number: track.track_number,
                isrc: track.external_ids.isrc
            });
        }
    }
});
export const Song = model("Song", SongSchema);
