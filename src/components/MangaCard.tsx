import React from "react";
import { Star, Eye, Layers } from "lucide-react";
import { Gallery } from "../types";

interface MangaCardProps {
  key?: React.Key;
  gallery: Gallery;
  onSelect: (gallery: Gallery) => void;
  isBookmarked: boolean;
  onToggleBookmark: (e: React.MouseEvent) => void;
}

export default function MangaCard({ gallery, onSelect, isBookmarked, onToggleBookmark }: MangaCardProps) {
  // Category coloring mapping helper
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "hentai manga":
        return "bg-rose-650/90 text-white border border-rose-500/30";
      case "doujinshi":
        return "bg-pink-500/95 text-white";
      case "artist cg":
        return "bg-purple-500/90 text-white";
      case "game cg":
        return "bg-blue-550/90 text-white";
      default:
        return "bg-zinc-800 text-white border border-zinc-700";
    }
  };

  return (
    <div
      onClick={() => onSelect(gallery)}
      id={`manga-card-${gallery.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-card cursor-pointer transition-all duration-300 hover:border-accent-rose hover:shadow-lg hover:shadow-accent-rose/10 hover:-translate-y-1"
    >
      {/* Container aspect 2/3 for official cover ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        <img
          src={gallery.cover}
          alt={gallery.title}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
        />

        {/* Backdrop overlay gradients */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-accent-rose/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

        {/* Floating Category Badge */}
        <span className={`absolute top-2.5 left-2.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow ${getCategoryColor(gallery.category)}`}>
          {gallery.category}
        </span>

        {/* Rating overlay and Quick view */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-sm">
          <Star className="h-3 w-3 fill-amber-400" />
          <span>{gallery.rating || "4.8"}</span>
        </div>

        {/* Hover info overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-90">
          <span className="flex items-center gap-1.5 rounded-full bg-accent-rose px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent-rose/30">
            <Eye className="h-3.5 w-3.5" />
            <span>Read Scroll</span>
          </span>
        </div>

        {/* Floating Bookmark Button */}
        <button
          onClick={(e) => onToggleBookmark(e)}
          className="absolute bottom-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-zinc-300 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80 hover:text-white"
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Manga"}
        >
          <Star className={`h-3.5 w-3.5 ${isBookmarked ? "text-amber-400 fill-amber-400" : "text-zinc-400"}`} />
        </button>
      </div>

      {/* Comic metadata representation */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h2 className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-accent-rose transition-colors duration-200">
            {gallery.title}
          </h2>
          {gallery.tags && gallery.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {gallery.tags.slice(0, 2).map((t, i) => (
                <span key={i} className="text-[9px] text-zinc-500 bg-zinc-800/30 px-1.5 py-0.5 rounded border border-zinc-800">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-zinc-900 pt-2 text-[10px] font-mono text-zinc-500">
          <span className="truncate max-w-[100px]" title={gallery.uploader || "Scribe"}>
            @{gallery.uploader || "Global CDN"}
          </span>
          {gallery.posted && (
            <span>{gallery.posted.split(" ")[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
