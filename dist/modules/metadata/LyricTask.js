import fs from "fs";
import DownloadResolver from "../download/DownloadResolver.js";
import path from "path";
import getLogger from "../../core/logSystem.js";
import { LoggerConfigs, Modules } from "../../app/config/configs.js";
import { toLRC } from "./utils.js";
export class LyricTask {
    constructor(body, onSuccess, onFailure) {
        this.filename = body.filename;
        this.title = body.title;
        this.artist = body.composer;
        this.album = body.album;
        this.released_at = body.released_at;
        this.spotify_id = body.ids.spotify;
        this.isrc = body.ids.isrc;
        this.duration = body.duration;
        this.onSuccess = onSuccess ?? this.onSuccess;
        this.onFailure = onFailure ?? this.onFailure;
    }
    async onSuccess(result) {
        if (!result.instrumental)
            fs.writeFileSync(path.join(DownloadResolver.getFolder(), this.filename.replace(/\.(mp3|flac)(?=$|\?|#)/i, ".lrc")), `
                [ar:${this.artist}]
                [ti:${this.title}]
                [al:${this.album}]

                ${toLRC(result.lyric)}
                `.replace(/^[ \t]+/gm, '').trim());
        getLogger(LoggerConfigs[Modules.LYRIC_TASK]).debug(`✅ Saved ${result.synced ? "synced" : "unsynced"} lyric for: ${this.title}`, { meta: {
                songId: this.spotify_id, lyricPath: path.join(DownloadResolver.getFolder(), this.filename.replace(/\.(mp3|flac)(?=$|\?|#)/i, ".lrc"))
            } });
    }
    async onFailure() { }
}
