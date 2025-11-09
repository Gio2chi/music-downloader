export class UnsupportedMimeTypeError extends Error {
    constructor(msg?: string) {
        super(msg?? `Unsupported mime type for cover: only support image/jpeg and image/png picture`)
    }
}