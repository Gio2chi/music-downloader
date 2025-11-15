export class UnsupportedMimeTypeError extends Error {
    constructor(msg) {
        super(msg ?? `Unsupported mime type for cover: only support image/jpeg and image/png picture`);
    }
}
