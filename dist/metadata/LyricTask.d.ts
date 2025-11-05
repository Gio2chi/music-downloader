import TaskInterface from "../core/TaskInterface.js";
import { TBasicTags, TLyricTaskResult, TUniversalIds } from "../types/index.js";
export declare class LyricTask implements TaskInterface<TLyricTaskResult> {
    filename: string;
    title: string;
    artist: string;
    album: string;
    released_at: Date;
    spotify_id: string;
    isrc?: string;
    duration: number;
    constructor(body: Required<TBasicTags> & Required<TUniversalIds> & {
        filename: string;
    }, onSuccess?: ((result: TLyricTaskResult) => Promise<void>), onFailure?: (() => Promise<void>));
    private toLRC;
    onSuccess(result: TLyricTaskResult): Promise<void>;
    onFailure(): Promise<void>;
}
