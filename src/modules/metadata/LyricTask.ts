import fs from "fs";
import TaskInterface from "../../core/TaskInterface.js";
import { Song } from "../../models/Song.js";
import { TBasicTags, TLyricLine, TLyricTaskResult, TUniversalIds } from "../../types/index.js";
import DownloadResolver from "../download/DownloadResolver.js";
import path from "path";
import getLogger from "../../core/logSystem.js";
import { LoggerConfigs, Modules } from "../../app/config/configs.js";
import { toLRC } from "./utils.js";

export class LyricTask implements TaskInterface<TLyricTaskResult> {
    filename: string;
    title: string;
    artist: string;
    album: string;
    released_at: Date;
    spotify_id: string;
    isrc?: string;
    duration: number;

    constructor(body: Required<TBasicTags> & Required<TUniversalIds> & { filename: string },
        onSuccess?: ((result: TLyricTaskResult) => Promise<void>),
        onFailure?: (() => Promise<void>)) {
        this.filename = body.filename
        this.title = body.title
        this.artist = body.composer
        this.album = body.album
        this.released_at = body.released_at
        this.spotify_id = body.ids.spotify!
        this.isrc = body.ids.isrc!
        this.duration = body.duration

        this.onSuccess = onSuccess ?? this.onSuccess
        this.onFailure = onFailure ?? this.onFailure
    }

    async onSuccess(result: TLyricTaskResult): Promise<void> {        
        if(!result.instrumental)
            fs.writeFileSync(
                path.join(DownloadResolver.getFolder(), this.filename.replace(/\.(mp3|flac)(?=$|\?|#)/i, ".lrc")),
                `
                [ar:${this.artist}]
                [ti:${this.title}]
                [al:${this.album}]

                ${toLRC(result.lyric)}
                `.replace(/^[ \t]+/gm, '').trim()
            )

        getLogger(LoggerConfigs[Modules.LYRIC_TASK]).debug(`✅ Saved ${result.synced ? "synced" : "unsynced"} lyric for: ${this.title}`, 
            { meta: {
                songId: this.spotify_id, lyricPath: path.join(DownloadResolver.getFolder(), this.filename.replace(/\.(mp3|flac)(?=$|\?|#)/i, ".lrc"))
            }});
    }
    async onFailure(): Promise<void> { }
}