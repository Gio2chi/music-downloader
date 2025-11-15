export class MediaNotFoundError extends Error {
    constructor(msg) {
        super(msg ?? "No media found in the message.");
    }
}
