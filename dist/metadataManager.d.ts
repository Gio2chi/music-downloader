export declare function parseSpotifyMetadata(track: SpotifyApi.TrackObjectFull): Promise<{
    tags: Tags;
    error?: string;
}>;
type Tags = {
    title?: string;
    artists?: string[];
    album?: string;
    year?: string;
    genres?: string[];
    trackNumber?: string;
    composer?: string;
    publisher?: string;
    lyrics?: string;
    cover?: {
        mime: string;
        buffer: Buffer;
    };
};
/**
 * Update metadata for MP3 & FLAC files..
 */
export declare function updateMetadata(filePath: string, tags: Tags): Promise<void>;
export {};
