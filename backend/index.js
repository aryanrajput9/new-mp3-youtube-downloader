const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
app.use(cors());

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

/* 🎥 VIDEO INFO */
app.get("/info", (req, res) => {
    let { url } = req.query;

    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    const yt = spawn("yt-dlp", [
        "--dump-json",
        "--no-playlist",
        url,
    ]);

    let data = "";
    let hasError = false;

    yt.stdout.on("data", (chunk) => {
        data += chunk;
    });

    yt.stderr.on("data", (err) => {
        console.log("❌ STDERR:", err.toString());
        hasError = true;
    });

    yt.on("error", (err) => {
        console.log("❌ SPAWN ERROR:", err);
        res.status(500).send("yt-dlp not found or failed");
    });

    yt.on("close", (code) => {
        if (code !== 0 || hasError) {
            return res.status(500).send("Failed to fetch video info");
        }

        try {
            const json = JSON.parse(data);

            res.json({
                title: json.title,
                thumbnail: json.thumbnail,
            });
        } catch (e) {
            console.log("❌ JSON ERROR:", e);
            res.status(500).send("Failed to parse video info");
        }
    });
});

/* 🎵 AUDIO */
app.get("/audio", (req, res) => {
    let { url } = req.query;

    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    const yt = spawn("yt-dlp", [
        "-x",
        "--audio-format", "mp3",
        "-o", "-",
        url,
    ]);

    let errorOccurred = false;

    yt.stderr.on("data", (err) => {
        console.log("❌ AUDIO ERROR:", err.toString());
        errorOccurred = true;
    });

    yt.on("error", () => {
        errorOccurred = true;
        res.status(500).send("Audio download failed");
    });

    yt.on("close", (code) => {
        if (code !== 0 && !errorOccurred) {
            res.status(500).send("Audio download failed");
        }
    });

    res.header("Content-Disposition", 'attachment; filename="audio.mp3"');
    yt.stdout.pipe(res);
});

/* 🎬 VIDEO */
app.get("/video", (req, res) => {
    let { url } = req.query;

    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    const yt = spawn("yt-dlp", [
        "-f", "best",
        "-o", "-",
        url,
    ]);

    let errorOccurred = false;

    yt.stderr.on("data", (err) => {
        console.log("❌ VIDEO ERROR:", err.toString());
        errorOccurred = true;
    });

    yt.on("error", () => {
        errorOccurred = true;
        res.status(500).send("Video download failed");
    });

    yt.on("close", (code) => {
        if (code !== 0 && !errorOccurred) {
            res.status(500).send("Video download failed");
        }
    });

    res.header("Content-Disposition", 'attachment; filename="video.mp4"');
    yt.stdout.pipe(res);
});

app.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
});