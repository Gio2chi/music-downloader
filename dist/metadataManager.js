import * as mm from "music-metadata";
import NodeID3 from "node-id3";
import Metaflac from 'metaflac-js';
import { fileTypeFromBuffer } from "file-type";
async function fetchImage(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
}
export async function parseSpotifyMetadata(track) {
    let err;
    let cover = undefined;
    try {
        let cover_url = track.album.images.filter(image => image.height == 640).map(image => image.url).pop();
        if (cover_url == undefined)
            throw new Error("no cover found");
        let buffer = await fetchImage(cover_url);
        let mime = (await fileTypeFromBuffer(buffer)).mime;
        if (mime !== 'image/jpeg' && mime !== 'image/png') {
            throw new Error(`only support image/jpeg and image/png picture temporarily, current import ${mime}`);
        }
        cover = { buffer, mime };
    }
    catch (e) {
        if (e instanceof Error)
            err = e.message;
    }
    let parsed = {
        spotifyId: track.id,
        title: track.name,
        artists: track.artists.map(artist => artist.name),
        album: track.album.name,
        year: track.album.release_date,
        disc: track.disc_number,
        trackNumber: track.track_number.toString(),
        isrc: track.external_ids.isrc,
        cover,
        spotifyUrl: track.external_urls.spotify,
    };
    return { tags: parsed, error: err };
}
/**
 * Update metadata for MP3 & FLAC files..
 */
export async function updateMetadata(filePath, tags) {
    // Detect file type
    const metadata = await mm.parseFile(filePath);
    const format = metadata.format.container.toLowerCase();
    if (format.includes("mpeg")) {
        // ----- MP3 -----
        const id3Tags = {
            title: tags.title, // Title
            artist: Array.isArray(tags.artists) ? tags.artists.join(";") : tags.artists, // Artists
            album: tags.album, // Album
            year: tags.year, // Year
            genre: tags.genres ? tags.genres.join(";") : undefined, // Genre
            trackNumber: tags.trackNumber, // Track number
            composer: tags.composer, // Composer
            publisher: tags.publisher, // Publisher
            unsynchronisedLyrics: tags.lyrics
                ? { language: "eng", text: tags.lyrics }
                : undefined,
            image: tags.cover
                ? {
                    mime: tags.cover.mime,
                    type: {
                        id: 3,
                        name: "front cover"
                    },
                    description: "Album Art",
                    imageBuffer: tags.cover.buffer
                }
                : undefined
        };
        const success = NodeID3.update(id3Tags, filePath);
        if (!success)
            throw new Error("Failed to update MP3 metadata");
    }
    else if (format.includes("flac")) {
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
            });
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
        if (tags.cover) {
            flac.pictures = [];
            flac.picturesDatas = [];
            flac.picturesSpecs = [];
            const spec = flac.buildSpecification({
                mime: tags.cover.mime,
                width: 640,
                height: 640,
            });
            flac.pictures.push(flac.buildPictureBlock(await tags.cover.buffer, spec));
            flac.picturesSpecs.push(spec);
        }
        flac.save();
    }
    else {
        throw new Error("Unsupported format. Only MP3 and FLAC are supported.");
    }
}
