import { Schema } from "mongoose";
export interface IPlaylist {
    owner: Schema.Types.ObjectId;
    name: string;
}
export declare const PlaylistSchema: Schema<IPlaylist, import("mongoose").Model<IPlaylist, any, any, any, import("mongoose").Document<unknown, any, IPlaylist, any, {}> & IPlaylist & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPlaylist, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IPlaylist>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IPlaylist> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const Playlist: import("mongoose").Model<IPlaylist, {}, {}, {}, import("mongoose").Document<unknown, {}, IPlaylist, {}, import("mongoose").DefaultSchemaOptions> & IPlaylist & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<IPlaylist, import("mongoose").Model<IPlaylist, any, any, any, import("mongoose").Document<unknown, any, IPlaylist, any, {}> & IPlaylist & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPlaylist, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IPlaylist>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IPlaylist> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
