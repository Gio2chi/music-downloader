import dotenv from "dotenv";
dotenv.config();
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";
import fs from "fs";

let stringSession = new StringSession(process.env.TELEGRAM_LOGIN_TOKEN);
const client = new TelegramClient(stringSession, parseInt(process.env.TELEGRAM_API_ID), process.env.TELEGRAM_API_HASH, { connectionRetries: 5 });
await client.start({});

const inputChannel = new Api.InputChannel({
    channelId: BigInt(process.env.TELEGRAM_CHANNEL_ID),
    accessHash: BigInt(process.env.TELEGRAM_ACCESS_HASH)
});

/**
 * @param {string} title
 * @returns {Promise<number>}
 */
const createNewTopic = async (title) => {
    const newTopic = await client.invoke(
        new Api.channels.CreateForumTopic({
            channel: inputChannel,
            title: "🎵 " + title,
            iconColor: 0x3F51B5,
        })
    );
    return newTopic.updates[0].id;
};

if (fs.existsSync("./downloads") === false) {
    fs.mkdirSync("./downloads");
}
if (fs.existsSync("./tmp") === false) {
    fs.mkdirSync("./tmp");
}

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
const downloadSong = (url) => {
    return new Promise(async (resolve, reject) => {
        const msg = await client.sendMessage(process.env.TELEGRAM_DOWNLOAD_BOT_USERNAME, { message: url })

        let found = false;
        while (!found) {
            await new Promise(r => setTimeout(r, 1000));
            const history = await client.invoke(
                new Api.messages.GetHistory({
                    peer: await msg.getChat(),
                    minId: msg.id,
                    limit: parseInt(process.env.TELEGRAM_MAX_MSG_PER_DOWNLOAD) + 1,
                }));

            if (history.messages.length < parseInt(process.env.TELEGRAM_MAX_MSG_PER_DOWNLOAD))
                continue;


            for (let msg of history.messages) {
                if(found) return;

                if (msg.media === null || msg.media === undefined || 
                    msg.media.document === null || msg.media.document === undefined
                ) 
                    continue;

                let displayMsg = displayMessage(msg)
                console.log("Downloading: " + displayMsg)

                let fileExtentsion = ".mp3";
                const attrs = msg.media.document.attributes;
                for (const attr of attrs)
                    if (attr.className === "DocumentAttributeFilename") {
                        fileExtentsion = attr.fileName.slice(attr.fileName.lastIndexOf('.'));
                    }

                await client.downloadMedia(msg.media, { workers: 1 }).then(buffer => {

                    let filename = UUID() + fileExtentsion;
                    fs.writeFileSync("./downloads/" + filename, buffer);
                    console.log("✅ Saved:", displayMsg);

                    resolve(filename)
                    found = true;
                });
            }

            if (!found) {
                console.log("Failed to download: " + url)
                reject("No media found in the message.");
            }

            return;
        }
    });
}

/**
 * @param {import("telegram").Api.Message} message
 * @returns {string}
 */
const displayMessage = (message) => {
    if (message.message)
        return message.message;
    else if (message && message.media && message.media.document instanceof Api.Document ) {
        const attrs = message.media.document.attributes;

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

        return title + " by " + performer;
    }
}

/** 
 * Generate a UUID string 
 * @returns {string}
 */
const UUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

export { client, createNewTopic, downloadSong, displayMessage };