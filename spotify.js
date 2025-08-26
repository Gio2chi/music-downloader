import dotenv from "dotenv";
dotenv.config();
import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();
import SpotifyWebApi from "spotify-web-api-node"
import querystring from "querystring"

const db = new sqlite3.Database(process.env.DB_PATH)

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});

const login = (code, chatId, callback) => {
    const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        form: {
            code: code,
            redirect_uri: process.env.URL + "/callback",
            grant_type: "authorization_code",
        },
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                new Buffer.from(
                    process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
                ).toString("base64"),
        },
        json: true,
    };

    fetch(authOptions.url, {
        method: "POST",
        headers: authOptions.headers,
        body: querystring.stringify(authOptions.form),
    }).then(async (response) => {
        const responseData = await response.json();

        spotifyApi.setAccessToken(responseData.access_token);
        spotifyApi.setRefreshToken(responseData.refresh_token);
        let user = (await spotifyApi.getMe()).body

        db.run("UPDATE tokens SET access_token = ?, refresh_token = ?, email = ?, expires_at = ? WHERE chatId = ?", 
            [responseData.access_token, responseData.refresh_token, user.email, Date.now() + responseData.expires_in - 20, chatId], (err) => {
            callback(err)
        });

    });

}

const getPlaylists = async (chatId) => {
    await loadTokens(chatId)

    return (await spotifyApi.getUserPlaylists()).body.items
}

const getSavedTracks = async (chatId) => {
    await loadTokens(chatId);

    const songs = []

    let offset = 0
    let incoming
    while ((incoming = await spotifyApi.getMySavedTracks({ offset, limit: 50 })).body.items.length > 0) {
        songs.push(...incoming.body.items)
        offset += 50
    }

    return songs
}

const getPlaylistTracks = async (chatId, playlistId) => {
    const limit = 50;
    let offset = 0;
    let allTracks = [];

    // Prima chiamata per sapere il totale
    let data = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
    let total = data.body.total;

    while (offset < total) {
        data = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
        allTracks.push(...data.body.items);

        offset += limit;
    }

    return allTracks;
}

const loadTokens = async (chatId) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM tokens WHERE chatId = ?", [chatId], async (err, row) => {
            if (err) {
                console.error("Error fetching user from database:", err);
                return reject(err);
            }
            if (!row) {
                return resolve(null);
            }

            spotifyApi.setAccessToken(row.access_token);
            spotifyApi.setRefreshToken(row.refresh_token);
            try {
                const refreshedTokens = (await spotifyApi.refreshAccessToken()).body;
                let newAccessToken = refreshedTokens.access_token
                let newRefreshToken = refreshedTokens.refresh_token ? refreshedTokens.refresh_token : row.refresh_token
                spotifyApi.setAccessToken(newAccessToken);
                spotifyApi.setRefreshToken(newRefreshToken);
                db.run("UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ? WHERE chatId = ?",
                    [newAccessToken, newRefreshToken, Date.now() + refreshedTokens.expires_in - 20, chatId],
                    reject
                );
                resolve(refreshedTokens);
            } catch (error) {
                console.error("Error refreshing access token:", error);
                reject(error);
            }
        });
    });
}

export { login, getSavedTracks, getPlaylistTracks, getPlaylists, loadTokens, spotifyApi }