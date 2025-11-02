import dotenv from "dotenv";
dotenv.config();
import { Song } from "./dist/models/Song.js";
import { User } from "./dist/models/User.js"
import mongoose from "mongoose";
import SpotifyWebApi from "spotify-web-api-node";

const SpotifyAPI = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

async function update() {
    let conn = await mongoose.connect(process.env.DB_URL);

    let token = (await User.findOne()).refresh_token
    SpotifyAPI.setRefreshToken(token);
    let newToken = await SpotifyAPI.refreshAccessToken()
    SpotifyAPI.setAccessToken(newToken.body.access_token)

    const songs = await Song.find();
    const ids = songs.map(s => s.spotify_id);

    // Spotify API limit = 50 tracks per request
    let dict = {};
    for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const data = await SpotifyAPI.getTracks(batch);
        data.body.tracks.filter(Boolean).forEach(t => {
            dict[t.id] = t.duration_ms;
        });
    }

    // Update each song
    for (const sng of songs) {
        if (dict[sng.spotify_id] != null) {
            sng.duration = dict[sng.spotify_id];
            await sng.save();
        }
    }

    console.log("Updated song durations successfully!");
    await conn.disconnect()
}

update().catch(console.error);
