import { SPOTIFY } from "./secrets.js"
import SpotifyWebApi from "spotify-web-api-node"
import TelegramBot from "node-telegram-bot-api"

type Resolver = (user: SpotifyUser) => void;
type Rejecter = (err: Error) => void;

import { Strategy as SpotifyStrategy } from "passport-spotify";
import { app, passport } from "./serverInstance.js"
import { IUser, User } from "./models/User.js";

// Spotify strategy that returns only tokens
passport.use(
    new SpotifyStrategy(
        {
            clientID: SPOTIFY.CLIENT_ID,
            clientSecret: SPOTIFY.CLIENT_SECRET,
            callbackURL: SPOTIFY.REDIRECT_URI + "/callback",
        },
        (accessToken, refreshToken, expires_in, profile, done) => {
            const tokenData = { accessToken, refreshToken, expiresIn: expires_in };
            return done(null, tokenData);
        }
    )
);

app.get('/login', (req, res, next) => {
    const chatId = req.query.chat_id as string;
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

app.get(
    "/callback",
    passport.authenticate("spotify", { failureRedirect: "/", session: false }),
    (req, res) => {
        const chatId = req.query.state as string;
        const user = req.user as {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };

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
    }
);

class SpotifyUser {
    private userId: string
    private userChatId: string
    private accessToken: string
    private refreshToken: string
    private expiresAt: Date
    private email?: string

    private spotifyWebApi = new SpotifyWebApi({
        clientId: SPOTIFY.CLIENT_ID,
        clientSecret: SPOTIFY.CLIENT_SECRET
    });

    private static pendingLogins = new Map<string, { resolve: Resolver; reject: Rejecter; timer: NodeJS.Timeout }>();

    private constructor(userId: string, chatId: string, accessToken: string, refreshToken: string, expiresAt: Date, email?: string) {
        this.userId = userId;
        this.userChatId = chatId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        if(email)
            this.email = email
    }

    public static async get(chatId: string, bot: TelegramBot, timeoutMs = 60000): Promise<SpotifyUser> {
        let user = await this.loadFromDatabase(chatId);
        if (user) return user;

        user = await new Promise<SpotifyUser>(async (resolve, reject) => {
            if (this.pendingLogins.has(chatId)) {
                return reject(new Error("Login already pending for this chat"));
            }

            const timer = setTimeout(() => {
                this.pendingLogins.delete(chatId);
                reject(new Error("Login timed out"));
            }, timeoutMs);

            await bot.sendMessage(chatId, "Welcome to the Spotify Downloader Bot! To get started, please log in to your Spotify account.")
            await bot.sendMessage(chatId, "Please visit the following link to log in to Spotify and authorize the bot:\n" + SPOTIFY.REDIRECT_URI + "/login?chat_id=" + chatId)

            this.pendingLogins.set(chatId, { resolve, reject, timer });
        })

        user.loadTokens();
        (new User(this.getUserSchema(user))).save()
        return user
    }

    public static async resolveLogin(
        chatId: string,
        tokens: { accessToken: string; refreshToken: string; expiresIn: number }
    ) {
        const pending = this.pendingLogins.get(chatId);
        if (!pending) return;

        clearTimeout(pending.timer);

        let spotifyApi = new SpotifyWebApi({
            clientId: SPOTIFY.CLIENT_ID,
            clientSecret: SPOTIFY.CLIENT_SECRET
        })

        spotifyApi.setAccessToken(tokens.accessToken)
        spotifyApi.setRefreshToken(tokens.refreshToken)

        let user = (await spotifyApi.getMe()).body

        pending.resolve(new SpotifyUser(user.id, chatId, tokens.accessToken, tokens.refreshToken, new Date(Date.now() + tokens.expiresIn), user.email));
        this.pendingLogins.delete(chatId);
    }

    private static async loadFromDatabase(chatId: string): Promise<SpotifyUser | null> {
        let user = this.parse(await User.findOne({telegram_chat_id: chatId}));
        user?.loadTokens();
        let newToken = await user?.spotifyWebApi.refreshAccessToken()
        user?.spotifyWebApi.setAccessToken(newToken!.body.access_token)
        return user;
    }

    private static parse(user: IUser | null): SpotifyUser | null {
        if (!user)
            return null

        return new SpotifyUser(user.spotify_id, user.telegram_chat_id, user.access_token, user.refresh_token, user.expires_at, user.email)
    }

    private static getUserSchema(user: SpotifyUser): IUser {
        return {
            spotify_id: user.userId,
            telegram_chat_id: user.userChatId,
            access_token: user.accessToken,
            refresh_token: user.refreshToken,
            expires_at: user.expiresAt,
            email: user.email
        }
    }

    private loadTokens() {
        this.spotifyWebApi.setAccessToken(this.accessToken);
        this.spotifyWebApi.setRefreshToken(this.refreshToken);
    }

    public getChatId() {
        return this.userChatId;
    }

    public async getPlaylists() {
        return (await this.spotifyWebApi.getUserPlaylists(this.userId)).body.items
    }

    public async getSavedTracks() {
        const songs = []

        let offset = 0
        let incoming
        while ((incoming = await this.spotifyWebApi.getMySavedTracks({ offset, limit: 50 })).body.items.length > 0) {
            songs.push(...incoming.body.items)
            offset += 50
        }

        return songs
    }

    public async getPlaylistTracks(playlistId: string) {
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

export default SpotifyUser