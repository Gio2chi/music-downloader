export class UnsupportedMusicFileError extends Error {
    constructor(msg) {
        super(msg ?? "Unsupported format. Only MP3 and FLAC are supported.");
    }
}
