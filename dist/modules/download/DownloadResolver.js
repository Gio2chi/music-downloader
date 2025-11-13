import { Api } from "telegram";
import fs from "fs";
import path from "path";
import { DownloadErrors } from "../../errors/index.js";
import getLogger from "../../core/logSystem.js";
class DownloadResolver {
    constructor(botUsername, config = {}, priority) {
        this.time = 0;
        this.count = 0;
        this.botUsername = botUsername;
        this.msgPerDownload = config.msgPerDownload ?? 1;
        this.songsPerMinute = config.songsPerMinute ?? 10;
        this.intervalBetweenPollsMs = config.intervalBetweenPollsMs ?? 1000;
        this.timeout = config.timeout ?? 60 * 1000;
        this.priority = priority ?? 0;
    }
    static setFolder(folder) {
        this.downloadFolder = folder;
    }
    static getFolder() {
        return this.downloadFolder;
    }
    static UUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    getBot() {
        return this.botUsername;
    }
    getPriority() {
        return this.priority;
    }
    getMaxSongsPerMinute() {
        return this.songsPerMinute;
    }
    startSession() {
        this.time = Date.now();
    }
    async downloadSong(client, url, filenameWithoutExtension = DownloadResolver.UUID()) {
        await client.connect();
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = setTimeout(async () => {
            if (!client.connected)
                await client.disconnect();
        }, 5 * 60 * 1000);
        if (this.count >= this.songsPerMinute) {
            let waitTime = 60000 - (Date.now() - this.time);
            if (waitTime > 0) {
                getLogger('DownloadResolver').info(`Rate limit reached. Waiting for ${waitTime} ms`, { meta: { botUsername: this.botUsername } });
                await new Promise(r => setTimeout(r, waitTime));
            }
            this.count = 0;
            this.time = Date.now();
        }
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new DownloadErrors.DownloadTimeoutError()), this.timeout));
        const downloadPromise = new Promise(async (resolve, reject) => {
            const msg = await client.sendMessage(this.botUsername, {
                message: url,
            });
            let found = false;
            while (!found) {
                await new Promise((r) => setTimeout(r, this.intervalBetweenPollsMs));
                const history = await client.invoke(new Api.messages.GetHistory({
                    peer: await msg.getChat(),
                    minId: msg.id,
                    limit: this.msgPerDownload + 1,
                }));
                if (history instanceof Api.messages.MessagesNotModified)
                    continue;
                if (history.messages.length < this.msgPerDownload) {
                    continue;
                }
                for (const historyMsg of history.messages) {
                    if (found)
                        break;
                    if (!("media" in historyMsg)
                        || !historyMsg.media
                        || !("document" in historyMsg.media)
                        || !historyMsg.media.document
                        || !(historyMsg.media.document instanceof Api.Document)) {
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
                    fs.writeFileSync(path.join(DownloadResolver.downloadFolder, filename), buffer);
                    found = true;
                    this.count++;
                    resolve(filename);
                    return;
                }
                if (!found) {
                    reject(new DownloadErrors.MediaNotFoundError());
                    return;
                }
            }
            reject(new DownloadErrors.UnexpectedBehaviourError("Unexpected error while downloading."));
            return;
        });
        return Promise.race([downloadPromise, timeoutPromise]);
    }
}
export default DownloadResolver;
