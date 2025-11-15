import dotenv from "dotenv";
dotenv.config()
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";

// replace with your values
const apiId = parseInt(process.env.TELEGRAM_CLIENT_API_ID || "YOUR_API_ID", 10);
const apiHash = process.env.TELEGRAM_CLIENT_API_HASH || "YOUR_API_HASH";

(async () => {
  try {
    // empty to start new session, or put your stored session string
    const stringSession = new StringSession("");

    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    // start handles sending code and password callbacks
    await client.start({
      phoneNumber: async () => await input.text("Phone number (international): "),
      phoneCode: async () => await input.text("Code you received: "),
      password: async () => await input.text("Two-step password (if enabled): "),
      onError: (err) => console.error("Auth error:", err),
    });

    console.log("✅ Logged in!");
    // Save session string to reuse later without re-login
    const saved = client.session.save();
    console.log("Session string (save this somewhere secure):", saved);

    await client.disconnect();
  } catch (e) {
    console.error("Failed:", e);
  }
})();
