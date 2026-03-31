import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function App() {
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [type, setType] = useState("audio");
  const [loading, setLoading] = useState(false);

  const fetchInfo = async () => {
    if (!url) return alert("Paste URL first");

    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/info?url=${encodeURIComponent(url)}`
      );
      setVideo(res.data);
    } catch {
      alert("Error fetching info");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const endpoint =
      type === "audio"
        ? `/audio?url=${encodeURIComponent(url)}`
        : `/video?url=${encodeURIComponent(url)}`;

    window.open(`${API}${endpoint}`, "_blank");
  };

  return (
    <div className="app">
      <div className="glass-card">
        <h1>🚀 YT Downloader</h1>

        <div className="input-box">
          <input
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={fetchInfo}>
            {loading ? "..." : "Fetch"}
          </button>
        </div>

        {video && (
          <div className="card">
            <img src={video.thumbnail} alt="" />
            <p className="title">{video.title}</p>

            <div className="type-buttons">
              <button
                className={type === "audio" ? "active" : ""}
                onClick={() => setType("audio")}
              >
                🎵 Audio
              </button>

              <button
                className={type === "video" ? "active" : ""}
                onClick={() => setType("video")}
              >
                🎬 Video
              </button>
            </div>

            <button className="download-btn" onClick={download}>
              ⬇ Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}  