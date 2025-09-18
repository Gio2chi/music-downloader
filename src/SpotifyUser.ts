import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "./Secrets"
import SpotifyWebApi from "spotify-web-api-node"
import Database, { UserSchema } from "./Database";

type Resolver = (user: SpotifyUser) => void;
type Rejecter = (err: Error) => void;

import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";

const app = express();

app.use(session({ secret: "supersecret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Spotify strategy that returns only tokens
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
      callbackURL: "http://localhost:3000/auth/spotify/callback",
    },
    (accessToken, refreshToken, expires_in, profile, done) => {
      const tokenData = { accessToken, refreshToken, expiresIn: expires_in };
      return done(null, tokenData);
    }
  )
);

app.get(
  "/auth/spotify",
  passport.authenticate("spotify", { scope: ["user-read-email"] })
);

app.get(
  "/auth/spotify/callback",
  passport.authenticate("spotify", { failureRedirect: "/" }),
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

    res.send("You are logged in with Spotify. You can close this window.");
  }
);

app.listen(3000, () => console.log("Server running on port 3000"));

class SpotifyUser {
    private userId: string
    private userChatId: string
    private accessToken: string
    private refreshToken: string
    private expiresAt: number
    private email: string

    private spotifyWebApi = new SpotifyWebApi({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    });


    private static pendingLogins = new Map<string, { resolve: Resolver; reject: Rejecter; timer: NodeJS.Timeout }>();
    private static DATABASE: Database

    private constructor(userId: string, chatId: string, accessToken: string, refreshToken: string, expiresAt:number, email: string) {
        this.userId = userId;
        this.userChatId = chatId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.email = email;
        this.expiresAt = expiresAt;
    }

    public static setDatabase(db: Database) {
        this.DATABASE = db;
    }

    public static async get(chatId: string, timeoutMs = 60000): Promise<SpotifyUser> {
        let user = await this.loadFromDatabase(chatId);
        if (user) return user;

        user = await new Promise<SpotifyUser>((resolve, reject) => {
            if (this.pendingLogins.has(chatId)) {
                return reject(new Error("Login already pending for this chat"));
            }

            const timer = setTimeout(() => {
                this.pendingLogins.delete(chatId);
                reject(new Error("Login timed out"));
            }, timeoutMs);

            this.pendingLogins.set(chatId, { resolve, reject, timer });
        })

        user.loadTokens()
        this.DATABASE.insertOrUpdateUser(this.getUserSchema(user));
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
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET
        })

        spotifyApi.setAccessToken(tokens.accessToken)
        spotifyApi.setRefreshToken(tokens.refreshToken)

        let user = (await spotifyApi.getMe()).body

        pending.resolve(new SpotifyUser(user.id, chatId, tokens.accessToken, tokens.refreshToken, tokens.expiresIn, user.email));
        this.pendingLogins.delete(chatId);
    }

    public save() {
        SpotifyUser.DATABASE.insertOrUpdateUser(SpotifyUser.getUserSchema(this));
    }

    private static async loadFromDatabase(chatId: string): Promise<SpotifyUser | null> {
        let user = this.parse(await this.DATABASE.getUser(chatId));
        user?.loadTokens();
        return user;
    }

    private static parse(user: UserSchema | null): SpotifyUser | null {
        if (!user)
            return null

        return new SpotifyUser(user.userId, user.chatId, user.access_token, user.refresh_token, user.expires_at, user.email)
    }

    private static getUserSchema(user: SpotifyUser): UserSchema {
        return {
            userId: user.userId,
            chatId: user.userChatId,
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

    public async getPlaylists() {
        return (await this.spotifyWebApi.getUserPlaylists(this.userChatId)).body.items
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