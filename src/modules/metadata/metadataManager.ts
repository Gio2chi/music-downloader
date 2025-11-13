import * as mm from "music-metadata";
import { fileTypeFromBuffer } from "file-type";
import NodeID3 from "node-id3";
import Metaflac from 'metaflac-js';
import { TExtendedTags } from "../../types/index.js";
import { MetadataErrors } from "../../errors/index.js";
import getLogger from "../../core/logSystem.js";

async function fetchImage(url: string | URL) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
}

/**
 * Update metadata for MP3 & FLAC files..
 */
export async function updateMetadata(filePath: string, tags: TExtendedTags) {
    // Detect file type
    const metadata = await mm.parseFile(filePath);
    const format = metadata.format.container!.toLowerCase();

    let buffer: Buffer<ArrayBuffer> | undefined
    let mime: string | undefined
    try {

        if (tags.cover == undefined)
            throw new MetadataErrors.NoCoverFoundError()

        if ('url' in tags.cover) {
            buffer = await fetchImage(tags.cover.url)
            mime = (await fileTypeFromBuffer(buffer))!.mime
        } else {
            mime = tags.cover.mime
            buffer = tags.cover.buffer
        }
        if (mime !== 'image/jpeg' && mime !== 'image/png') {
            throw new MetadataErrors.UnsupportedMimeTypeError();
        }

    } catch (e) {
        if(e instanceof MetadataErrors.UnsupportedMimeTypeError)
            getLogger('MetadataManager').error(e)
    }

    if (format.includes("mpeg")) {
        // ----- MP3 -----
        const id3Tags: NodeID3.Tags = {
            title: tags.title,        // Title
            artist: Array.isArray(tags.artists) ? tags.artists.join(";") : tags.artists, // Artists
            album: tags.album,        // Album
            year: tags.year?.toString(),          // Year
            releaseTime: tags.released_at?.toDateString(),
            genre: tags.genres ? tags.genres.join(";") : undefined, // Genre
            trackNumber: tags.trackNumber?.toString(),  // Track number
            composer: tags.composer,     // Composer
            publisher: tags.publisher,    // Publisher
            unsynchronisedLyrics: tags.lyrics
                ? { language: "eng", text: tags.lyrics }
                : undefined,
            image: (mime && buffer) ?
                {
                    mime,
                    type: {
                        id: 3,
                        name: "front cover"
                    },
                    description: "Album Art",
                    imageBuffer: buffer
                }
                : undefined
        };

        const success = NodeID3.update(id3Tags, filePath);
        if (!success) throw new Error("Failed to update MP3 metadata");

    } else if (format.includes("flac")) {
        // ----- FLAC -----
        const flac = new Metaflac(filePath);

        // Standard Vorbis comments
        if (tags.title) {
            flac.removeTag("TITLE");
            flac.setTag(`TITLE=${tags.title}`);
        }
        if (tags.artists) {
            flac.removeTag("ARTISTS");
            flac.removeTag("ARTIST");
            tags.artists.forEach(artist => {
                flac.setTag(`ARTIST=${artist}`);
                flac.setTag(`ARTISTS=${artist}`);
            });
        }
        if (tags.album) {
            flac.removeTag("ALBUM");
            flac.setTag(`ALBUM=${tags.album}`);
        }
        if (tags.genres) {
            flac.removeTag("GENRE");
            tags.genres.forEach(genre => {
                flac.setTag(`GENRE=${genre}`);
            })
        }
        if (tags.trackNumber) {
            flac.removeTag("TRACKNUMBER");
            flac.setTag(`TRACKNUMBER=${tags.trackNumber}`);
        }
        if (tags.year) {
            flac.removeTag("DATE");
            flac.setTag(`DATE=${tags.year}`);
        }
        if (tags.lyrics) {
            flac.removeTag("LYRICS");
            flac.setTag(`LYRICS=${tags.lyrics}`);
        }
        if (tags.composer) {
            flac.removeTag("COMPOSER");
            flac.setTag(`COMPOSER=${tags.composer}`);
        }
        if (tags.publisher) {
            flac.removeTag("PUBLISHER");
            flac.setTag(`PUBLISHER=${tags.publisher}`);
        }

        // Cover art
        if (mime && buffer) {
            flac.pictures = []
            flac.picturesDatas = []
            flac.picturesSpecs = []

            const spec = flac.buildSpecification({
                mime,
                width: 640,
                height: 640,
            });
            flac.pictures.push(flac.buildPictureBlock(buffer, spec));
            flac.picturesSpecs.push(spec);
        }

        flac.save();
    } else {
        throw new MetadataErrors.UnsupportedMusicFileError();
    }
}

