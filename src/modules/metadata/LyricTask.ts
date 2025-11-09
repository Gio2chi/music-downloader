import fs from "fs";
import TaskInterface from "../../core/TaskInterface.js";
import { Song } from "../../models/Song.js";
import { TBasicTags, TLyricLine, TLyricTaskResult, TUniversalIds } from "../../types/index.js";
import DownloadResolver from "../download/DownloadResolver.js";
import path from "path";

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

    private toLRC(lines: TLyricLine[]) {
        return lines.reduce((acc, { text, timestamp }) => {
            if (!text) return acc; // skip empty text
            if (typeof timestamp === 'number') {
                const totalSeconds = timestamp / 1000;
                const m = Math.floor(totalSeconds / 60);
                const s = Math.floor(totalSeconds % 60);
                const cs = Math.floor((totalSeconds * 100) % 100); // hundredths
                acc += `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}]${text}\n`;
            } else {
                acc += `${text}\n`; // unsynced line
            }
            return acc;
        }, '');
    }

    async onSuccess(result: TLyricTaskResult): Promise<void> {
        let sng = await Song.findOne({ spotify_id: this.spotify_id })
        sng!.lyric = {
            instrumental: result.instrumental,
            synced: result.synced,
            lines: result.lyric
        }
        await sng!.save()
        console.log(`✅ Saved ${result.synced ? "synced" : "unsynced"} lyric for:`, this.title);
        
        if(!result.instrumental)
            fs.writeFileSync(
                path.join(DownloadResolver.getFolder(), this.filename.replace(/\.(mp3|flac)(?=$|\?|#)/i, ".lrc")),
                `
                [ar:${this.artist}]
                [ti:${this.title}]
                [al:${this.album}]

                ${this.toLRC(result.lyric)}
                `.replace(/^[ \t]+/gm, '').trim()
            )
    }
    async onFailure(): Promise<void> { }
}