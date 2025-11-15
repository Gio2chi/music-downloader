export type TBasicTags = {
    title?: string,
    composer?: string,
    artists?: string[],
    album?: string,
    year?: number,
    released_at?: Date,
    trackNumber?: number,
    duration?: number,
}

export type TCoverTag = {
    cover?: {
        mime: string,
        buffer: Buffer<ArrayBuffer>
    }
} | {
    cover?: { url: string }
}

export type TUniversalIds = {
    ids: {
        spotify?: string,
        isrc?: string
    }
}

export type TExtendedTags = TBasicTags & TCoverTag & TUniversalIds & {
    genres?: string[],
    publisher?: string,
    lyrics?: string,
} & { filename?: string }