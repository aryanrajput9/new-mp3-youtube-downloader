const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.use(cors({ origin: "*" }));

// 📁 cookies file path
const cookiesPath = path.join(__dirname, "cookies.txt");

// 🔥 Normalize URL
const cleanURL = (url) => {
    try {
        const parsed = new URL(url);

        if (parsed.hostname === "youtu.be") {
            return `https://www.youtube.com/watch?v=${parsed.pathname.slice(1)}`;
        }

        if (parsed.pathname.includes("/shorts/")) {
            const id = parsed.pathname.split("/shorts/")[1].split("?")[0];
            return `https://www.youtube.com/watch?v=${id}`;
        }

        return url;
    } catch {
        return url;
    }
};

// ✅ ROOT
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});


// =======================
// 🎥 VIDEO INFO
// =======================
app.get("/info", (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    const yt = spawn("python3", [
        "-m", "yt_dlp",

        "--cookies", cookiesPath,

        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--no-check-certificate",
        "--geo-bypass",

        "--extractor-args", "youtube:player_client=android",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

        url,
    ]);

    let data = "";

    yt.stdout.on("data", (chunk) => {
        data += chunk;
    });

    yt.stderr.on("data", (err) => {
        console.log("❌ INFO ERROR:", err.toString());
    });

    yt.on("close", () => {
        if (!data) return res.status(500).send("No data");

        try {
            const json = JSON.parse(data);
            res.json({
                title: json.title,
                thumbnail: json.thumbnail,
            });
        } catch {
            res.status(500).send("Parse error");
        }
    });
});


// =======================
// 🎵 AUDIO DOWNLOAD
// =======================
app.get("/audio", (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    res.header("Content-Disposition", 'attachment; filename="audio.mp3"');

    const yt = spawn("python3", [
        "-m", "yt_dlp",

        "--cookies", cookiesPath,

        "-f", "bestaudio/best",
        "--extract-audio",
        "--audio-format", "mp3",

        "--no-playlist",
        "--no-warnings",
        "--no-check-certificate",
        "--geo-bypass",

        "--extractor-args", "youtube:player_client=android",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

        "-o", "-",
        url,
    ]);

    yt.stderr.on("data", (err) => {
        console.log("❌ AUDIO ERROR:", err.toString());
    });

    yt.stdout.pipe(res);
});


// =======================
// 🎬 VIDEO DOWNLOAD
// =======================
app.get("/video", (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    res.header("Content-Disposition", 'attachment; filename="video.mp4"');

    const yt = spawn("python3", [
        "-m", "yt_dlp",

        "--cookies", cookiesPath,

        "-f", "bv*+ba/best",

        "--no-playlist",
        "--no-warnings",
        "--no-check-certificate",
        "--geo-bypass",

        "--extractor-args", "youtube:player_client=android",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

        "-o", "-",
        url,
    ]);

    yt.stderr.on("data", (err) => {
        console.log("❌ VIDEO ERROR:", err.toString());
    });

    yt.stdout.pipe(res);
});


// =======================
// 🚀 SERVER
// =======================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});