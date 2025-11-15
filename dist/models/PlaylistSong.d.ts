import { Schema } from "mongoose";
export interface IPlaylistSong {
    playlistId: Schema.Types.ObjectId;
    songId: Schema.Types.ObjectId;
    added_at: Date;
}
export declare const PlaylistSong: import("mongoose").Model<IPlaylistSong, {}, {}, {}, import("mongoose").Document<unknown, {}, IPlaylistSong, {}, import("mongoose").DefaultSchemaOptions> & IPlaylistSong & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<IPlaylistSong, import("mongoose").Model<IPlaylistSong, any, any, any, import("mongoose").Document<unknown, any, IPlaylistSong, any, {}> & IPlaylistSong & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPlaylistSong, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IPlaylistSong>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IPlaylistSong> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
