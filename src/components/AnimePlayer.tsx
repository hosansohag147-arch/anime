import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Loader2, AlertCircle, ChevronLeft, ChevronRight, List, ExternalLink, Volume2 } from "lucide-react";
import { AnimeItem, AnimeEpisode } from "../types";

interface AnimePlayerProps {
  anime: AnimeItem;
  onBack: () => void;
}

export default function AnimePlayer({ anime, onBack }: AnimePlayerProps) {
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [selectedEp, setSelectedEp] = useState<AnimeEpisode | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [loadingEps, setLoadingEps] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [error, setError] = useState("");
  const [showEpList, setShowEpList] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    loadEpisodes();
  }, [anime]);

  useEffect(() => {
    if (selectedEp) loadStream(selectedEp);
  }, [selectedEp]);

  // HLS.js setup when streamUrl changes
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    if (streamUrl.includes(".m3u8")) {
      // Use HLS.js for m3u8
      const proxyUrl = `/api/anime/hls-proxy?url=${encodeURIComponent(streamUrl)}`;

      if ((window as any).Hls && (window as any).Hls.isSupported()) {
        const Hls = (window as any).Hls;
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = hls;
        hls.loadSource(proxyUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) setError("Video load করতে সমস্যা হচ্ছে।");
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = proxyUrl;
        video.play().catch(() => {});
      }
    } else if (streamUrl.startsWith("http")) {
      video.src = streamUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Load HLS.js script dynamically
  useEffect(() => {
    if (!(window as any).Hls) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js";
      document.head.appendChild(script);
    }
  }, []);

  async function loadEpisodes() {
    setLoadingEps(true);
    setError("");
    try {
      const pageUrl = (anime as any).pageUrl || "";
      if (!pageUrl) {
        setError("Anime URL পাওয়া যায়নি।");
        setLoadingEps(false);
        return;
      }
      const res = await fetch(`/api/anime/episodes?url=${encodeURIComponent(pageUrl)}`);
      const data = await res.json();
      if (data.success && data.episodes.length > 0) {
        setEpisodes(data.episodes);
        setSelectedEp(data.episodes[0]);
      } else {
        setError("Episode list পাওয়া যায়নি।");
      }
    } catch {
      setError("Episode load করতে সমস্যা হয়েছে।");
    } finally {
      setLoadingEps(false);
    }
  }

  async function loadStream(ep: AnimeEpisode) {
    setLoadingStream(true);
    setStreamUrl("");
    setError("");
    try {
      const res = await fetch(`/api/anime/stream?url=${encodeURIComponent(ep.url)}`);
      const data = await res.json();
      if (data.success && data.streamUrl) {
        setStreamUrl(data.streamUrl);
      } else {
        setError(data.error || "Stream পাওয়া যায়নি।");
      }
    } catch {
      setError("Stream load করতে ব্যর্থ।");
    } finally {
      setLoadingStream(false);
    }
  }

  const currentIdx = episodes.findIndex(e => e.id === selectedEp?.id);
  const prevEp = currentIdx > 0 ? episodes[currentIdx - 1] : null;
  const nextEp = currentIdx < episodes.length - 1 ? episodes[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-dark-border bg-dark-bg/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm font-bold text-white">{anime.title}</h1>
            {selectedEp && <p className="text-[10px] font-mono text-violet-400">Episode {selectedEp.episode} — {selectedEp.title}</p>}
          </div>
          <button onClick={() => setShowEpList(!showEpList)} className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer">
            <List className="h-3.5 w-3.5" /> Episodes ({episodes.length})
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Player */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800 bg-black" style={{ aspectRatio: "16/9" }}>
            {(loadingEps || loadingStream) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                <p className="text-xs text-zinc-400 font-mono">
                  {loadingEps ? "Episode list লোড হচ্ছে..." : "Stream খোঁজা হচ্ছে..."}
                </p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <p className="text-sm text-red-400">{error}</p>
                {selectedEp && (
                  <a href={selectedEp.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition">
                    <ExternalLink className="h-3.5 w-3.5" /> সরাসরি দেখুন
                  </a>
                )}
              </div>
            ) : (
              <video
                ref={videoRef}
                controls
                className="absolute inset-0 w-full h-full bg-black"
                onError={() => setError("Video play করা যাচ্ছে না।")}
              >
                আপনার browser এই video format support করে না।
              </video>
            )}

            {/* Loading overlay on video */}
            {streamUrl && loadingStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Navigation */}
          {selectedEp && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button onClick={() => prevEp && setSelectedEp(prevEp)} disabled={!prevEp} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-white">EP {selectedEp.episode}</p>
                <p className="text-[10px] text-zinc-500 font-mono">{currentIdx + 1} / {episodes.length}</p>
              </div>
              <button onClick={() => nextEp && setSelectedEp(nextEp)} disabled={!nextEp} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 rounded-xl border border-zinc-800 bg-dark-card p-4">
            <div className="flex gap-4">
              {anime.cover && <img src={anime.cover} alt={anime.title} className="h-24 w-16 rounded-lg object-cover flex-shrink-0" />}
              <div>
                <h2 className="text-base font-bold text-white">{anime.title}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {anime.tags?.map((tag, i) => (
                    <span key={i} className="text-[9px] bg-violet-900/40 border border-violet-800/40 text-violet-300 px-2 py-0.5 rounded font-mono">{tag}</span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Hindi Dubbed • Source: AniWatch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Episode List */}
        {showEpList && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="rounded-xl border border-zinc-800 bg-dark-card overflow-hidden">
              <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <List className="h-4 w-4 text-violet-400" /> Episodes
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">{episodes.length} total</span>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                {loadingEps ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                  </div>
                ) : episodes.map((ep) => (
                  <button key={ep.id} onClick={() => setSelectedEp(ep)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-900/60 transition hover:bg-zinc-900 cursor-pointer ${selectedEp?.id === ep.id ? "bg-violet-900/30 border-l-2 border-l-violet-500" : ""}`}>
                    <p className={`text-xs font-bold ${selectedEp?.id === ep.id ? "text-violet-300" : "text-zinc-300"}`}>
                      Episode {ep.episode}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-mono truncate">{ep.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
