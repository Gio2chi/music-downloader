import { Api, TelegramClient } from "telegram";
import fs from "fs"
import path, { resolve } from "path";

export class TimeoutError extends Error { }
export class MediaNotFoundError extends Error { }

class DownloadResolver {
    private static client: TelegramClient;
    private static downloadFolder: string;
    private botUsername: string;
    private msgPerDownload: number;
    private songsPerMinute: number;
    private intervalBetweenPollsMs: number;
    private timeout: number;
    private time = 0;
    private count = 0;

    constructor(
        botUsername: string,
        config: {
            msgPerDownload?: number,
            songsPerMinute?: number,
            intervalBetweenPollsMs?: number,
            timeout?: number
        } = {}
    ) {
        this.botUsername = botUsername;
        this.msgPerDownload = config.msgPerDownload ?? 1;
        this.songsPerMinute = config.songsPerMinute ?? 10;
        this.intervalBetweenPollsMs = config.intervalBetweenPollsMs ?? 1000;
        this.timeout = config.timeout ?? 60 * 1000;
    }

    public static setClient(client: TelegramClient) {
        this.client = client;
    }

    public static setFolder(folder: string) {
        this.downloadFolder = folder;
    }

    public static getFolder() {
        return this.downloadFolder;
    }

    private static UUID(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    public getMaxSongsPerMinute() {
        return this.songsPerMinute;
    }

    public startSession() {
        this.time = Date.now()
    }

    public async downloadSong(url: string, filenameWithoutExtension = DownloadResolver.UUID()): Promise<string> {
        if (this.count >= this.songsPerMinute) {
            let waitTime = 60000 - (Date.now() - this.time);
            if (waitTime > 0) {
                console.log(`Rate limit reached. Waiting for ${waitTime} ms`);
                await new Promise(r => setTimeout(r, waitTime));
            }
            this.count = 0;
            this.time = Date.now();
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new TimeoutError("Download Timed out")), this.timeout)
        );

        const downloadPromise = new Promise<string>(async (resolve, reject) => {
            const msg = await DownloadResolver.client.sendMessage(this.botUsername, {
                message: url,
            });

            let found = false;

            while (!found) {
                await new Promise((r) => setTimeout(r, this.intervalBetweenPollsMs));

                const history = await DownloadResolver.client.invoke(
                    new Api.messages.GetHistory({
                        peer: await msg.getChat(),
                        minId: msg.id,
                        limit: this.msgPerDownload + 1,
                    })
                );

                if (history instanceof Api.messages.MessagesNotModified)
                    continue;

                if (history.messages.length < this.msgPerDownload) {
                    continue;
                }

                for (const historyMsg of history.messages) {
                    if (found) break;

                    if (
                        !("media" in historyMsg)
                        || !historyMsg.media
                        || !("document" in historyMsg.media)
                        || !historyMsg.media.document
                        || !(historyMsg.media.document instanceof Api.Document)
                    ) {
                        continue;
                    }

                    let fileExtension = ".mp3";
                    const attrs = historyMsg.media.document.attributes;

                    for (const attr of attrs) {
                        if (attr.className === "DocumentAttributeFilename") {
                            fileExtension = attr.fileName.slice(attr.fileName.lastIndexOf("."));
                        }
                    }

                    const buffer = await DownloadResolver.client.downloadMedia(historyMsg.media);

                    const filename = filenameWithoutExtension + fileExtension;
                    fs.writeFileSync(path.join(DownloadResolver.downloadFolder, filename), buffer as Buffer);

                    found = true;
                    this.count++;
                    resolve(filename);
                    return;
                }

                if (!found) {
                    reject(new MediaNotFoundError("No media found in the message."));
                }
            }
            reject(new Error("Unexpected error while downloading."));
        })

        return Promise.race([downloadPromise, timeoutPromise])
    }
}

export default DownloadResolver