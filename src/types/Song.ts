import { TAlbum } from "./Album";
import { TArtist } from "./Artist";
import { TLyric } from "./Lyric";
import { TBasicTags, TUniversalIds, TCoverTag } from "./Tags";

export type TSongMethods = {
    toTags(): Required<TBasicTags> & Required<TUniversalIds> & TCoverTag & { filename: string };
}

export type TSong = {
    filename: string,
    artists: TArtist[],
    title: string,
    album: TAlbum,
    released_at: Date,
    genres: string[],
    track_number: number,
    lyric?: TLyric,
    duration: number,
    cover_url?: string,
    spotify_id: string,
    isrc: string
}