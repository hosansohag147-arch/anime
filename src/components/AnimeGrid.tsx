import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import AnimeCard from "./AnimeCard";
import { AnimeItem } from "../types";

interface AnimeGridProps {
  onSelect: (anime: AnimeItem) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}

export default function AnimeGrid({ onSelect, bookmarkedIds, onToggleBookmark }: AnimeGridProps) {
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => { fetchAnimes(); }, [page, search]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setSearch(searchInput); }, 600);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function fetchAnimes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/anime/feed?search=${encodeURIComponent(search)}&page=${page}`);
      const data = await res.json();
      if (data.success && data.animes?.length > 0) {
        setAnimes(data.animes);
      } else {
        setError(data.error || "কোনো anime পাওয়া যায়নি।");
        setAnimes([]);
      }
    } catch {
      setError("Anime load করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Hindi anime search করুন... (Naruto, Dragon Ball...)"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-dark-border bg-zinc-950 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 transition"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-950 bg-red-950/20 p-4 text-sm text-red-400 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {animes.map(anime => (
            <AnimeCard key={anime.id} anime={anime} onSelect={onSelect}
              isBookmarked={bookmarkedIds.includes(anime.id)}
              onToggleBookmark={(e) => onToggleBookmark(anime.id, e)} />
          ))}
        </div>
      )}

      {!loading && animes.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm font-mono text-zinc-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
