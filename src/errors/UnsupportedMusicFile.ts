export class UnsupportedMusicFileError extends Error {
    constructor(msg?: string) {
        super(msg?? "Unsupported format. Only MP3 and FLAC are supported.")
    }
}