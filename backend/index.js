const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();

// 🔥 IMPORTANT (Render + frontend)
app.use(cors({
    origin: "*"
}));

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

// ✅ ROOT ROUTE (Render health check)
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

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
        return res.status(500).send("yt-dlp failed");
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
            res.status(500).send("Parse error");
        }
    });
});

/* 🎵 AUDIO */
app.get("/audio", (req, res) => {
    let { url } = req.query;

    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    res.header("Content-Disposition", 'attachment; filename="audio.mp3"');

    const yt = spawn("yt-dlp", [
        "-x",
        "--audio-format", "mp3",
        "-o", "-",
        url,
    ]);

    yt.stderr.on("data", (err) => {
        console.log("❌ AUDIO ERROR:", err.toString());
    });

    yt.on("error", () => {
        res.status(500).send("Audio failed");
    });

    yt.stdout.pipe(res);
});

/* 🎬 VIDEO */
app.get("/video", (req, res) => {
    let { url } = req.query;

    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    res.header("Content-Disposition", 'attachment; filename="video.mp4"');

    const yt = spawn("yt-dlp", [
        "-f", "best",
        "-o", "-",
        url,
    ]);

    yt.stderr.on("data", (err) => {
        console.log("❌ VIDEO ERROR:", err.toString());
    });

    yt.on("error", () => {
        res.status(500).send("Video failed");
    });

    yt.stdout.pipe(res);
});

// 🔥 VERY IMPORTANT FOR RENDER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});   