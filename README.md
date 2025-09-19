# 🎵 Song Downloader Server (Telegram + Spotify)

A server application that allows users to **download their Spotify playlists** in **FLAC or MP3 quality** with full metadata embedding.  
The interaction happens via a **Telegram bot**, while the backend server handles Spotify authentication and metadata fetching.  

---

## ⚠️ Disclaimer
This project is provided **for educational purposes only**.  
The server itself does not host or distribute copyrighted music — it only provides the **infrastructure** to interact with Telegram bots and fetch metadata from Spotify.  
The choice of which Telegram bot to use, and the act of downloading music, is entirely the **user’s responsibility**.  
By using this software, you agree that the author assumes **no liability** for misuse, copyright violations, or illegal activity.  

---

## ✨ Features
- ✅ Login to your **Spotify account** via Telegram  
- ✅ Browse and select **playlists** to download  
- ✅ Server downloads songs in **FLAC (lossless)** or **MP3 (compressed)** quality  
- ✅ Metadata automatically fetched and embedded from **Spotify**:
  - Title, artist(s), album, cover art, release date, genre (if available)  
- ✅ Telegram-based control – no need for a separate UI  
- ✅ Unique filenames and proper tagging for easy library management  

---

## 🏗️ Architecture
1. **Telegram Bot** – interface where the user logs in and selects music.  
2. **MTProto Client** – handles communication between Telegram and the server.  
3. **Spotify API** – used to fetch metadata (after user login).  
4. **Downloader Module** – downloads and tags files with metadata.  

---

## 🚀 How It Works
1. User starts the Telegram bot.  
2. Bot asks them to log in with Spotify (OAuth).  
3. User selects a playlist.  
4. The server (via MTProto client) fetches metadata from Spotify and downloads the track(s).  

---

## 📦 Requirements
- Node.js (or Python backend, depending on your implementation)  
- A Telegram bot token  
- A Telegram client API ID and hash  
- A Spotify API client (ID + secret)  
- A running server (VPS or local) with storage for downloads  
- (Optional) Docker for containerized deployment  

---

## ⚙️ Setup & Installation

### Local Installation
1. Clone this repo:
   ```bash
   git clone https://github.com/Gio2chi/music-downloader.git
   cd music-downloader
   ```
2. Configure the environment (.env file).
3. Initialize the database (entrypoint.sh).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm run start
   ```
### Docker Deployment
1. Build the image:
   ```bash
   docker build -t music-downloader .
   ```
2. Run the container:
   ```bash
   docker run -d --name music-downloader --env-file .env -p 3000:3000 music-downloader
   ```
## 📌 Notes
 - This software does not bypass Spotify DRM; it only relies on Telegram bots chosen by the user.
 - The author does not provide or endorse any specific Telegram music bots.
 - It is the user’s responsibility to ensure compliance with copyright laws in their jurisdiction.

## 📜 License
MIT License – see the LICENSE file for details.
