import { TelegramClient } from "telegram";
import { Api as TelegramApi } from "telegram";
declare const client: TelegramClient;
declare const createNewTopic: (title: string) => Promise<number>;
declare const downloadSong: (url: string) => Promise<string>;
declare const displayMessage: (message: TelegramApi.Message) => string;
export { client, createNewTopic, downloadSong, displayMessage };
