const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");

const app = express();

// ✅ CORS
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

// ✅ ROOT
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});


// 🎥 VIDEO INFO
app.get("/info", async (req, res) => {
    try {
        let { url } = req.query;
        if (!url) return res.status(400).send("URL missing");

        url = cleanURL(url);

        const data = await ytdlp(url, {
            dumpSingleJson: true,
            noPlaylist: true,
        });

        res.json({
            title: data.title,
            thumbnail: data.thumbnail,
        });

    } catch (err) {
        console.log("❌ INFO ERROR:", err);
        res.status(500).send("Failed to fetch info");
    }
});


// 🎵 AUDIO DOWNLOAD
app.get("/audio", async (req, res) => {
    try {
        let { url } = req.query;
        if (!url) return res.status(400).send("URL missing");

        url = cleanURL(url);

        res.header("Content-Disposition", 'attachment; filename="audio.mp3"');

        const stream = ytdlp.exec(url, {
            extractAudio: true,
            audioFormat: "mp3",
            output: "-",
        });

        stream.stdout.pipe(res);

        stream.stderr.on("data", (err) => {
            console.log("⚠️ AUDIO STDERR:", err.toString());
        });

    } catch (err) {
        console.log("❌ AUDIO ERROR:", err);
        res.status(500).send("Audio failed");
    }
});


// 🎬 VIDEO DOWNLOAD
app.get("/video", async (req, res) => {
    try {
        let { url } = req.query;
        if (!url) return res.status(400).send("URL missing");

        url = cleanURL(url);

        res.header("Content-Disposition", 'attachment; filename="video.mp4"');

        const stream = ytdlp.exec(url, {
            format: "best",
            output: "-",
        });

        stream.stdout.pipe(res);

        stream.stderr.on("data", (err) => {
            console.log("⚠️ VIDEO STDERR:", err.toString());
        });

    } catch (err) {
        console.log("❌ VIDEO ERROR:", err);
        res.status(500).send("Video failed");
    }
});


// 🔥 IMPORTANT (Render ke liye)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});