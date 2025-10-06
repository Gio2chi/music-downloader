import { Schema, Model, HydratedDocument } from "mongoose";
import { Tags } from "../metadataManager";
export interface IAlbum {
    name: string;
    spotify_id: string;
    released_at: Date;
    cover_url: string;
}
export declare const AlbumSchema: Schema<IAlbum, Model<IAlbum, any, any, any, import("mongoose").Document<unknown, any, IAlbum, any, {}> & IAlbum & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IAlbum, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IAlbum>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IAlbum> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export interface IArtist {
    name: string;
    spotify_id: string;
    img_url?: string;
}
export declare const ArtistSchema: Schema<IArtist, Model<IArtist, any, any, any, import("mongoose").Document<unknown, any, IArtist, any, {}> & IArtist & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IArtist, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IArtist>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IArtist> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
interface ISongMethods {
    toTags(): Promise<Tags>;
}
interface ISongModel extends Model<ISong, {}, ISongMethods> {
    parse(track: SpotifyApi.TrackObjectFull): HydratedDocument<ISong, ISongMethods>;
}
export interface ISong {
    filename: string;
    artists: IArtist[];
    title: string;
    album: IAlbum;
    released_at: Date;
    genres: string[];
    track_number: number;
    lyrics?: string;
    cover_url?: string;
    spotify_id: string;
    isrc: string;
}
export declare const SongSchema: Schema<ISong, ISongModel, ISongMethods, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ISong, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ISong>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<import("mongoose").FlatRecord<ISong> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "toTags"> & ISongMethods>;
export declare const Song: ISongModel;
export {};
