const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();

app.use(cors({ origin: "*" }));

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
// 🎥 VIDEO INFO (FIXED)
// =======================
app.get("/info", (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    const yt = spawn("yt-dlp", [
        "--dump-json",
        "--no-playlist",
        "--no-warnings",
        "--user-agent", "Mozilla/5.0",
        "--extractor-args", "youtube:player_client=android",
        url,
    ]);

    let data = "";

    yt.stdout.on("data", (chunk) => {
        data += chunk;
    });

    yt.stderr.on("data", (err) => {
        console.log("❌ STDERR:", err.toString());
    });

    yt.on("close", () => {
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


// =======================
// 🎵 AUDIO (FIXED)
// =======================
app.get("/audio", (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    res.header("Content-Disposition", 'attachment; filename="audio.mp3"');

    const yt = spawn("yt-dlp", [
        "-f", "bestaudio",
        "--no-playlist",
        "--no-warnings",
        "--user-agent", "Mozilla/5.0",
        "--extractor-args", "youtube:player_client=android",
        "-o", "-",
        url,
    ]);

    yt.stderr.on("data", (err) => {
        console.log("❌ AUDIO ERROR:", err.toString());
    });

    yt.stdout.pipe(res);
});


// =======================
// 🎬 VIDEO (FIXED)
// =======================
app.get("/video", (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).send("URL missing");

    url = cleanURL(url);

    res.header("Content-Disposition", 'attachment; filename="video.mp4"');

    const yt = spawn("yt-dlp", [
        "-f", "best",
        "--no-playlist",
        "--no-warnings",
        "--user-agent", "Mozilla/5.0",
        "--extractor-args", "youtube:player_client=android",
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