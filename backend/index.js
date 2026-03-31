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
app.get("/info", async (req, res) => {
    try {
        let { url } = req.query;
        url = cleanURL(url);

        const yt = spawn("/opt/homebrew/bin/yt-dlp", [
            "--dump-json",
            "--no-playlist",
            url,
        ]);

        yt.on("error", (err) => {
            console.log("❌ ERROR:", err);
            res.status(500).send("yt-dlp error");
        });
        let data = "";

        yt.stdout.on("data", (chunk) => {
            data += chunk;
        });

        yt.on("close", () => {
            const json = JSON.parse(data);
            res.json({
                title: json.title,
                thumbnail: json.thumbnail,
            });
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Info error");
    }
});

/* 🎵 AUDIO */
app.get("/audio", (req, res) => {
    try {
        let { url } = req.query;
        url = cleanURL(url);

        res.header("Content-Disposition", 'attachment; filename="audio.mp3"');

        const yt = spawn("yt-dlp", [
            "-x",
            "--audio-format", "mp3",
            "-o", "-",
            url,
        ]);

        yt.stdout.pipe(res);

        yt.stderr.on("data", (err) => {
            console.log("❌ AUDIO ERROR:", err.toString());
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Audio error");
    }
});

/* 🎬 VIDEO */
app.get("/video", (req, res) => {
    try {
        let { url } = req.query;
        url = cleanURL(url);

        res.header("Content-Disposition", 'attachment; filename="video.mp4"');

        const yt = spawn("yt-dlp", [
            "-f", "best",
            "-o", "-",
            url,
        ]);

        yt.stdout.pipe(res);

        yt.stderr.on("data", (err) => {
            console.log("❌ VIDEO ERROR:", err.toString());
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Video error");
    }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));