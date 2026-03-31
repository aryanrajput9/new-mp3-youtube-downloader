import React, { useState } from "react";
import axios from "axios";

// 🔥 CHANGE THIS AFTER DEPLOY
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">

      <div className="w-[90%] max-w-xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-6">
          🚀 YT Downloader PRO
        </h1>

        {/* INPUT */}
        <div className="flex gap-2 mb-5">
          <input
            className="flex-1 p-3 rounded-lg bg-black/40 border border-white/20 outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={fetchInfo}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            {loading ? "..." : "Fetch"}
          </button>
        </div>

        {/* VIDEO CARD */}
        {video && (
          <div className="bg-black/40 p-4 rounded-xl border border-white/10">

            <img
              src={video.thumbnail}
              alt=""
              className="rounded-lg mb-3 w-full"
            />

            <p className="text-sm mb-4 line-clamp-2">
              {video.title}
            </p>

            {/* TYPE BUTTONS */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setType("audio")}
                className={`flex-1 py-2 rounded-lg ${type === "audio"
                  ? "bg-green-600"
                  : "bg-white/10 hover:bg-white/20"
                  }`}
              >
                🎵 Audio
              </button>

              <button
                onClick={() => setType("video")}
                className={`flex-1 py-2 rounded-lg ${type === "video"
                  ? "bg-blue-600"
                  : "bg-white/10 hover:bg-white/20"
                  }`}
              >
                🎬 Video
              </button>
            </div>

            {/* DOWNLOAD */}
            <button
              onClick={download}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-bold hover:scale-105 transition"
            >
              ⬇ Download Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}