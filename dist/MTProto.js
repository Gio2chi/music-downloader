import dotenv from "dotenv";
dotenv.config();
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";
import fs from "fs";
import bigInt from "big-integer";
// ✅ Environment variable type safety
const { TELEGRAM_LOGIN_TOKEN, TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_CHANNEL_ID, TELEGRAM_ACCESS_HASH, TELEGRAM_DOWNLOAD_BOT_USERNAME, TELEGRAM_MAX_MSG_PER_DOWNLOAD, } = process.env;
if (!TELEGRAM_LOGIN_TOKEN ||
    !TELEGRAM_API_ID ||
    !TELEGRAM_API_HASH ||
    !TELEGRAM_CHANNEL_ID ||
    !TELEGRAM_ACCESS_HASH ||
    !TELEGRAM_DOWNLOAD_BOT_USERNAME ||
    !TELEGRAM_MAX_MSG_PER_DOWNLOAD) {
    throw new Error("❌ Missing one or more required environment variables.");
}
let stringSession = new StringSession(TELEGRAM_LOGIN_TOKEN);
const client = new TelegramClient(stringSession, parseInt(TELEGRAM_API_ID, 10), TELEGRAM_API_HASH, { connectionRetries: 5 });
await client.connect();
const inputChannel = new Api.InputChannel({
    channelId: bigInt(TELEGRAM_CHANNEL_ID),
    accessHash: bigInt(TELEGRAM_ACCESS_HASH),
});
// 🔹 Create new topic
const createNewTopic = async (title) => {
    const newTopic = await client.invoke(new Api.channels.CreateForumTopic({
        channel: inputChannel,
        title: "🎵 " + title,
        iconColor: 0x3f51b5,
    }));
    // @ts-expect-error: updates[0] should exist, but depends on API
    return newTopic.updates[0].id;
};
// 🔹 Download a song from a bot
const downloadSong = async (url) => {
    const msg = await client.sendMessage(TELEGRAM_DOWNLOAD_BOT_USERNAME, {
        message: url,
    });
    let found = false;
    while (!found) {
        await new Promise((r) => setTimeout(r, 1000));
        const history = await client.invoke(new Api.messages.GetHistory({
            peer: await msg.getChat(),
            minId: msg.id,
            limit: parseInt(TELEGRAM_MAX_MSG_PER_DOWNLOAD, 10) + 1,
        }));
        if (history instanceof Api.messages.MessagesNotModified)
            continue;
        if (history.messages.length < parseInt(TELEGRAM_MAX_MSG_PER_DOWNLOAD, 10)) {
            continue;
        }
        for (const historyMsg of history.messages) {
            if (found)
                break;
            if (!("media" in historyMsg) ||
                !historyMsg.media ||
                !("document" in historyMsg.media) ||
                !historyMsg.media.document ||
                !(historyMsg.media.document instanceof Api.Document)) {
                continue;
            }
            const displayMsg = displayMessage(historyMsg);
            console.log("Downloading: " + displayMsg);
            let fileExtension = ".mp3";
            const attrs = historyMsg.media.document.attributes;
            for (const attr of attrs) {
                if (attr.className === "DocumentAttributeFilename") {
                    fileExtension = attr.fileName.slice(attr.fileName.lastIndexOf("."));
                }
            }
            const buffer = await client.downloadMedia(historyMsg.media);
            const filename = UUID() + fileExtension;
            fs.writeFileSync("./downloads/" + filename, buffer);
            console.log("✅ Saved:", displayMsg);
            found = true;
            return filename;
        }
        if (!found) {
            console.log("Failed to download: " + url);
            throw new Error("No media found in the message.");
        }
    }
    throw new Error("Unexpected error while downloading.");
};
// 🔹 Display message metadata
const displayMessage = (message) => {
    if (message.message) {
        return message.message;
    }
    else if (message.media &&
        "document" in message.media &&
        message.media.document instanceof Api.Document) {
        const attrs = message.media.document?.attributes ?? [];
        let fileName = "unknown.mp3";
        let title = null;
        let performer = null;
        for (const attr of attrs) {
            if (attr.className === "DocumentAttributeFilename") {
                fileName = attr.fileName;
            }
            if (attr.className === "DocumentAttributeAudio") {
                title = attr.title || null;
                performer = attr.performer || null;
            }
        }
        return `${title ?? fileName} by ${performer ?? "unknown"}`;
    }
    return "Unknown message";
};
// 🔹 UUID generator
const UUID = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});
export { client, createNewTopic, downloadSong, displayMessage };
