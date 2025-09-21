import fs from "fs";
import * as mm from "music-metadata";
import NodeID3 from "node-id3";
import Metaflac from 'metaflac-js';
import fileType from "file-type";

export async function fetchImage(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(new Uint8Array(arrayBuffer));
}

export async function parseSpotifyMetadata(metadata) {

  let cover_url = metadata.track.album.images.filter(image => image.height == 640).map(image => image.url).pop()
  const buffer = await fetchImage(cover_url)
  const {mime} = fileType(buffer)

  if (mime !== 'image/jpeg' && mime !== 'image/png') {
            throw new Error(`only support image/jpeg and image/png picture temporarily, current import ${mime}`);
        }

  let parsed = {
    spotifyId: metadata.track.id,
    title: metadata.track.name,
    artists: metadata.track.artists.map(artist => artist.name),
    album: metadata.track.album.name,
    year: metadata.track.album.release_date,
    disc: metadata.track.disc_number,
    trackNumber: metadata.track.track_number,
    isrc: metadata.track.external_ids.isrc,
    cover: {
      buffer: buffer,
      mime: mime
    },
    spotifyUrl: metadata.track.external_urls.spotify,
  }

  return parsed
}

/**
 * Update metadata for MP3 & FLAC files.
 * @param {string} filePath - Path to the audio file.
 * @param {object} tags - Metadata object.
 */
export async function updateMetadata(filePath, tags) {
  // Detect file type
  const metadata = await mm.parseFile(filePath);
  const format = metadata.format.container?.toLowerCase();

  if (format.includes("mpeg")) {
    // ----- MP3 -----
    const id3Tags = {
      TIT2: tags.title,        // Title
      TPE1: tags.artists       // Artists
        ? tags.artist.join("/") : undefined,
      TALB: tags.album,        // Album
      TYER: tags.year,         // Year
      TCON: tags.genre,        // Genre
      TRCK: tags.trackNumber,  // Track number
      TCOM: tags.composer,     // Composer
      TPUB: tags.publisher,    // Publisher
      USLT: tags.lyrics        // Lyrics
        ? { language: "eng", description: "", lyrics: tags.lyrics }
        : undefined,
      APIC: tags.cover
        ? {
          mime: tags.cover.mime,
          type: { id: 3, name: "front cover" },
          description: "Album Art",
          imageBuffer: tags.cover.buffer
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
    if (tags.cover) {
      flac.pictures = []
      flac.picturesDatas = []
      flac.picturesSpecs = []

      const spec = flac.buildSpecification({
        mime: tags.cover.mime,
        width: 640,
        height: 640,
      });
      flac.pictures.push(flac.buildPictureBlock(await tags.cover.buffer, spec));
      flac.picturesSpecs.push(spec);
    }

    flac.save();
  } else {
    throw new Error("Unsupported format. Only MP3 and FLAC are supported.");
  }
}

