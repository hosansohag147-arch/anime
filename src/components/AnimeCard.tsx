import React from "react";
import { Star, Play } from "lucide-react";
import { AnimeItem } from "../types";

interface AnimeCardProps {
  anime: AnimeItem;
  onSelect: (anime: AnimeItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (e: React.MouseEvent) => void;
}

export default function AnimeCard({ anime, onSelect, isBookmarked, onToggleBookmark }: AnimeCardProps) {
  return (
    <div
      onClick={() => onSelect(anime)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-card cursor-pointer transition-all duration-300 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1"
    >
      {/* Cover image — 3/4 ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        {anime.cover ? (
          <img
            src={anime.cover}
            alt={anime.title}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-900">
            <Play className="h-12 w-12 text-zinc-700" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Category badge */}
        <span className="absolute top-2.5 left-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow bg-violet-600/90 text-white border border-violet-500/30">
          Anime
        </span>

        {/* Rating */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-sm">
          <Star className="h-3 w-3 fill-amber-400" />
          <span>{anime.rating || "4.8"}</span>
        </div>

        {/* Hover play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-90">
          <span className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/30">
            <Play className="h-3.5 w-3.5 fill-white" />
            Watch Now
          </span>
        </div>

        {/* Bookmark button */}
        <button
          onClick={(e) => onToggleBookmark(e)}
          className="absolute bottom-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-zinc-300 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80 hover:text-white"
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Anime"}
        >
          <Star className={`h-3.5 w-3.5 ${isBookmarked ? "text-amber-400 fill-amber-400" : "text-zinc-400"}`} />
        </button>
      </div>

      {/* Metadata */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h2 className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-violet-400 transition-colors duration-200">
            {anime.title}
          </h2>
          {anime.tags && anime.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {anime.tags.slice(0, 2).map((t, i) => (
                <span key={i} className="text-[9px] text-zinc-500 bg-zinc-800/30 px-1.5 py-0.5 rounded border border-zinc-800">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-zinc-900 pt-2 text-[10px] font-mono text-zinc-500">
          <span className="truncate max-w-[100px]">@{anime.uploader || "Gogoanime"}</span>
          {anime.posted && <span>{anime.posted}</span>}
        </div>
      </div>
    </div>
  );
}
