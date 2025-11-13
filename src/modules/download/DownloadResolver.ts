import { Api, TelegramClient } from "telegram";
import fs from "fs"
import path from "path";
import { DownloadErrors } from "../../errors/index.js";
import getLogger from "../../core/logSystem.js";

class DownloadResolver {
    private static downloadFolder: string;
    private botUsername: string;
    private msgPerDownload: number;
    private songsPerMinute: number;
    private intervalBetweenPollsMs: number;
    private timeout: number;
    private time = 0;
    private count = 0;

    private priority: number
    private timer: NodeJS.Timeout | undefined;

    constructor(
        botUsername: string,
        config: {
            msgPerDownload?: number,
            songsPerMinute?: number,
            intervalBetweenPollsMs?: number,
            timeout?: number
        } = {},
        priority?: number
    ) {
        this.botUsername = botUsername;
        this.msgPerDownload = config.msgPerDownload ?? 1;
        this.songsPerMinute = config.songsPerMinute ?? 10;
        this.intervalBetweenPollsMs = config.intervalBetweenPollsMs ?? 1000;
        this.timeout = config.timeout ?? 60 * 1000;
        this.priority = priority ?? 0
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

    public getBot() {
        return this.botUsername
    }

    public getPriority() {
        return this.priority
    }

    public getMaxSongsPerMinute() {
        return this.songsPerMinute;
    }

    public startSession() {
        this.time = Date.now()
    }

    public async downloadSong(client: TelegramClient, url: string, filenameWithoutExtension = DownloadResolver.UUID()): Promise<string> {
        await client.connect()
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(async () => {
            if(!client.connected)
                await client.disconnect();
        }, 5 * 60 * 1000);

        if (this.count >= this.songsPerMinute) {
            let waitTime = 60000 - (Date.now() - this.time);
            if (waitTime > 0) {
                getLogger('DownloadResolver').info(`Rate limit reached. Waiting for ${waitTime} ms`, { meta: { botUsername: this.botUsername }});
                await new Promise(r => setTimeout(r, waitTime));
            }
            this.count = 0;
            this.time = Date.now();
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new DownloadErrors.DownloadTimeoutError()), this.timeout)
        );

        const downloadPromise = new Promise<string>(async (resolve, reject) => {
            const msg = await client.sendMessage(this.botUsername, {
                message: url,
            });

            let found = false;

            while (!found) {
                await new Promise((r) => setTimeout(r, this.intervalBetweenPollsMs));

                const history = await client.invoke(
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

                    const buffer = await client.downloadMedia(historyMsg.media);

                    const filename = filenameWithoutExtension + fileExtension;
                    fs.writeFileSync(path.join(DownloadResolver.downloadFolder, filename), buffer as Buffer);

                    found = true;
                    this.count++;
                    resolve(filename);
                    return;
                }

                if (!found) {
                    reject(new DownloadErrors.MediaNotFoundError());
                    return
                }
            }
            reject(new DownloadErrors.UnexpectedBehaviourError("Unexpected error while downloading."));
            return
        })

        return Promise.race([downloadPromise, timeoutPromise])
    }
}

export default DownloadResolver