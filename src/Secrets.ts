import dotenv from "dotenv";
dotenv.config();

const {
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
} = process.env;

if (
    !CLIENT_ID ||
    !CLIENT_SECRET ||
    !REDIRECT_URI
) {
    throw new Error("❌ Missing one or more required environment variables.");
}

export {CLIENT_ID, CLIENT_SECRET, REDIRECT_URI}