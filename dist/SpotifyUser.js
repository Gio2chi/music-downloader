import { SPOTIFY } from "./secrets.js";
import SpotifyWebApi from "spotify-web-api-node";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { app, passport } from "./serverInstance.js";
// Spotify strategy that returns only tokens
passport.use(new SpotifyStrategy({
    clientID: SPOTIFY.SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY.SPOTIFY_CLIENT_SECRET,
    callbackURL: SPOTIFY.SPOTIFY_REDIRECT_URI + "/callback",
}, (accessToken, refreshToken, expires_in, profile, done) => {
    const tokenData = { accessToken, refreshToken, expiresIn: expires_in };
    return done(null, tokenData);
}));
app.get('/login', (req, res, next) => {
    const chatId = req.query.chat_id;
    passport.authenticate('spotify', {
        scope: [
            "user-library-read",
            "user-read-private",
            "user-read-email",
            "playlist-read-collaborative",
            "playlist-modify-public",
            "playlist-modify-private"
        ],
        state: chatId,
        session: false
    })(req, res, next);
});
app.get("/callback", passport.authenticate("spotify", { failureRedirect: "/", session: false }), (req, res) => {
    const chatId = req.query.state;
    const user = req.user;
    if (chatId) {
        SpotifyUser.resolveLogin(chatId, user);
    }
    res.send(`
            <html>
            <body>
                <script type="text/javascript">
                window.close();
                </script>
                <p>You can close this window.</p>
            </body>
            </html>
        `);
});
class SpotifyUser {
    constructor(userId, chatId, accessToken, refreshToken, expiresAt, email) {
        this.spotifyWebApi = new SpotifyWebApi({
            clientId: SPOTIFY.SPOTIFY_CLIENT_ID,
            clientSecret: SPOTIFY.SPOTIFY_CLIENT_SECRET
        });
        this.userId = userId;
        this.userChatId = chatId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.email = email;
        this.expiresAt = expiresAt;
    }
    static setDatabase(db) {
        this.DATABASE = db;
    }
    static async get(chatId, bot, timeoutMs = 60000) {
        let user = await this.loadFromDatabase(chatId);
        if (user)
            return user;
        user = await new Promise(async (resolve, reject) => {
            if (this.pendingLogins.has(chatId)) {
                return reject(new Error("Login already pending for this chat"));
            }
            const timer = setTimeout(() => {
                this.pendingLogins.delete(chatId);
                reject(new Error("Login timed out"));
            }, timeoutMs);
            await bot.sendMessage(chatId, "Welcome to the Spotify Downloader Bot! To get started, please log in to your Spotify account.");
            await bot.sendMessage(chatId, "Please visit the following link to log in to Spotify and authorize the bot:\n" + SPOTIFY.SPOTIFY_REDIRECT_URI + "/login?chat_id=" + chatId);
            this.pendingLogins.set(chatId, { resolve, reject, timer });
        });
        user.loadTokens();
        this.DATABASE.insertOrUpdateUser(this.getUserSchema(user));
        return user;
    }
    static async resolveLogin(chatId, tokens) {
        const pending = this.pendingLogins.get(chatId);
        if (!pending)
            return;
        clearTimeout(pending.timer);
        let spotifyApi = new SpotifyWebApi({
            clientId: SPOTIFY.SPOTIFY_CLIENT_ID,
            clientSecret: SPOTIFY.SPOTIFY_CLIENT_SECRET
        });
        spotifyApi.setAccessToken(tokens.accessToken);
        spotifyApi.setRefreshToken(tokens.refreshToken);
        let user = (await spotifyApi.getMe()).body;
        pending.resolve(new SpotifyUser(user.id, chatId, tokens.accessToken, tokens.refreshToken, tokens.expiresIn, user.email));
        this.pendingLogins.delete(chatId);
    }
    save() {
        SpotifyUser.DATABASE.insertOrUpdateUser(SpotifyUser.getUserSchema(this));
    }
    static async loadFromDatabase(chatId) {
        let user = this.parse(await this.DATABASE.getUser(chatId));
        user?.loadTokens();
        return user;
    }
    static parse(user) {
        if (!user)
            return null;
        return new SpotifyUser(user.userId, user.chatId, user.accessToken, user.refreshToken, user.expiresAt, user.email);
    }
    static getUserSchema(user) {
        return {
            userId: user.userId,
            chatId: user.userChatId,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
            expiresAt: user.expiresAt,
            email: user.email
        };
    }
    loadTokens() {
        this.spotifyWebApi.setAccessToken(this.accessToken);
        this.spotifyWebApi.setRefreshToken(this.refreshToken);
    }
    getChatId() {
        return this.userChatId;
    }
    async getPlaylists() {
        return (await this.spotifyWebApi.getUserPlaylists(this.userId)).body.items;
    }
    async getSavedTracks() {
        const songs = [];
        let offset = 0;
        let incoming;
        while ((incoming = await this.spotifyWebApi.getMySavedTracks({ offset, limit: 50 })).body.items.length > 0) {
            songs.push(...incoming.body.items);
            offset += 50;
        }
        return songs;
    }
    async getPlaylistTracks(playlistId) {
        const limit = 50;
        let offset = 0;
        let allTracks = [];
        // Prima chiamata per sapere il totale
        let data = await this.spotifyWebApi.getPlaylistTracks(playlistId, { limit, offset });
        let total = data.body.total;
        while (offset < total) {
            data = await this.spotifyWebApi.getPlaylistTracks(playlistId, { limit, offset });
            allTracks.push(...data.body.items);
            offset += limit;
        }
        return allTracks;
    }
}
SpotifyUser.pendingLogins = new Map();
export default SpotifyUser;
