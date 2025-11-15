import { TExtendedTags, TLyricLine } from "../../types/index.js";
/**
 * Update metadata for MP3 & FLAC files..
 */
export declare function updateMetadata(filePath: string, tags: TExtendedTags): Promise<void>;
export declare function toLRC(lines: TLyricLine[]): string;
