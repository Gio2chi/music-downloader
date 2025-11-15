import { Schema, Model, HydratedDocument } from "mongoose";
import { TAlbum, TArtist, TLyric, TSong, TSongMethods } from "../types/index.js";
export declare const AlbumSchema: Schema<TAlbum, Model<TAlbum, any, any, any, import("mongoose").Document<unknown, any, TAlbum, any, {}> & TAlbum & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TAlbum, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TAlbum>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TAlbum> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const ArtistSchema: Schema<TArtist, Model<TArtist, any, any, any, import("mongoose").Document<unknown, any, TArtist, any, {}> & TArtist & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TArtist, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TArtist>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TArtist> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const LyricSchema: Schema<TLyric, Model<TLyric, any, any, any, import("mongoose").Document<unknown, any, TLyric, any, {}> & TLyric & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TLyric, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TLyric>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TLyric> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export interface ISongModel extends Model<TSong, {}, TSongMethods> {
    parse(track: SpotifyApi.TrackObjectFull): HydratedDocument<TSong, TSongMethods>;
}
export declare const SongSchema: Schema<TSong, ISongModel, TSongMethods, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TSong, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TSong>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<import("mongoose").FlatRecord<TSong> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "toTags"> & TSongMethods>;
export declare const Song: ISongModel;
