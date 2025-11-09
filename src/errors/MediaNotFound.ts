export class MediaNotFoundError extends Error {
    constructor(msg?: string) {
        super(msg ?? "No media found in the message.")
    }
}