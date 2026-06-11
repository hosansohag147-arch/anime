import React, { useState } from "react";
import { Book, Grid, SlidersHorizontal, ArrowLeft, ArrowRight, Compass, Sparkles } from "lucide-react";
import { Gallery } from "../types";
import MangaCard from "./MangaCard";

interface MangaGridProps {
  galleries: Gallery[];
  isLoading: boolean;
  isFetching?: boolean;
  onSelect: (gallery: Gallery) => void;
  currentPage: number;
  onPageChange: (p: number) => void;
  sourceType: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onMount?: () => void;
}

const POPULAR_TAGS = [
  "Sole Female", "Sole Male", "Schoolgirl", "Milf", "Full Color", 
  "Uncensored", "Nakadashi", "Group", "Yuri", "Yaoi", "Imouto", 
  "Netorare", "Stockings", "Futanari"
];

export default function MangaGrid({
  galleries,
  isLoading,
  isFetching = false,
  onSelect,
  currentPage,
  onPageChange,
  sourceType,
  searchTerm,
  onSearchChange,
  bookmarkedIds,
  onToggleBookmark,
  onMount,
}: MangaGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [localIsLoading, setLocalIsLoading] = useState(isLoading);

  const mangaList = galleries;

  React.useEffect(() => {
    setLocalIsLoading(isLoading);
  }, [isLoading]);

  React.useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, []);

  // Automatic recovery: If database index returns empty, dispatch fresh scrap/fetch to rebuild index
  React.useEffect(() => {
    if (onMount && (!mangaList || mangaList.length === 0) && !isLoading) {
      console.log("[MangaGrid] Index returns empty or uninitialized. Dispatched scraper rebuild.");
      onMount();
    }
  }, [mangaList, isLoading, onMount]);

  // Immediate loading completion safety trigger when data array is populated
  React.useEffect(() => {
    if (galleries && galleries.length > 0) {
      setLocalIsLoading(false);
    }
  }, [galleries]);

  const categories = ["All", "Hentai Manga", "Doujinshi", "Artist CG", "Game CG"];

  // Client side categories filtering (complements scraper filtering)
  const filteredGalleries = selectedCategory === "All"
    ? galleries
    : galleries.filter(g => g.category.toLowerCase() === selectedCategory.toLowerCase());

  // We only show the full loader skeleton if we are loading AND there is no content displayed on screen
  const showMainSkeleton = localIsLoading && filteredGalleries.length === 0;

  // Protect the empty state: only render when not loading, not fetching, and there are genuinely 0 results
  const showEmptyState = !localIsLoading && !isFetching && filteredGalleries.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-1 py-2 sm:px-2 lg:px-3">
      {/* Category controls and status badges */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-accent-rose animate-pulse" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white">
            Discover Manga
          </h2>
          {sourceType === "fallback" && (
            <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-500">
              Curated Masterpieces
            </span>
          )}
          {sourceType === "live" && (
            <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              Live Scraped Feed
            </span>
          )}
        </div>

        {/* Categories filters panel */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-accent-rose text-white shadow-md shadow-accent-rose/30"
                  : "bg-dark-card/60 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-dark-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Online Hentai Manga Keyword Tags Bar */}
      <div className="mb-8 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-900/80">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-accent-rose" />
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Popular Hentai & Manga Tags</span>
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="ml-auto rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-400 px-2 py-0.5 text-[10px] uppercase font-semibold transition"
            >
              Clear ×
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => {
            const isActive = searchTerm.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => onSearchChange(isActive ? "" : tag)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-mono font-medium tracking-wide border transition duration-200 cursor-pointer ${
                  isActive
                    ? "bg-accent-rose text-white border-accent-rose/40 shadow-sm shadow-accent-rose/10"
                    : "bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:bg-zinc-950 hover:text-zinc-200 hover:border-zinc-800"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle loader inline progress bar */}
      {isFetching && filteredGalleries.length > 0 && (
        <div className="w-full h-1 overflow-hidden bg-zinc-950 rounded mb-4">
          <div className="h-full bg-accent-rose animate-pulse" style={{ width: "35%" }}></div>
        </div>
      )}

      {/* Floating toast update indicator */}
      {isFetching && filteredGalleries.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/90 px-4 py-2.5 shadow-xl transition-all font-mono text-[11px] text-zinc-300 pointer-events-none animate-fade-in">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-700 border-t-accent-rose"></div>
          <span>Archiving index updates...</span>
        </div>
      )}

      {showMainSkeleton ? (
        /* Loading skeleton state */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-pulse">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-zinc-900 bg-zinc-900/40 p-1">
              <div className="aspect-[3/4] w-full rounded-lg bg-zinc-800/80"></div>
              <div className="mt-3 px-2 pb-2">
                <div className="h-4 rounded bg-zinc-800/80 w-5/6"></div>
                <div className="mt-2 h-3.5 rounded bg-zinc-800/50 w-2/3"></div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-3 rounded bg-zinc-800/40 w-1/3"></div>
                  <div className="h-3 rounded bg-zinc-800/45 w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : showEmptyState ? (
        /* Empty results state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dark-border bg-dark-card/30 py-24 text-center px-4 animate-fade-in">
          <Book className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="font-display text-lg font-bold text-white">No Manga Available</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm">
            We couldn't find any manga in the '{selectedCategory}' category that matches your search. Try other keywords or categories.
          </p>
          <button
            onClick={() => setSelectedCategory("All")}
            className="mt-6 rounded-full bg-zinc-900 px-5 py-2 text-xs font-semibold text-zinc-300 border border-dark-border transition-colors hover:bg-zinc-800"
          >
            Reset filter to All
          </button>
        </div>
      ) : (
        /* Grid containing Manga cards */
        <>
<div className="grid grid-cols-3 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredGalleries.map((gallery) => (
              <MangaCard 
                key={gallery.id} 
                gallery={gallery} 
                onSelect={onSelect} 
                isBookmarked={bookmarkedIds.includes(gallery.id)}
                onToggleBookmark={(e) => onToggleBookmark(gallery.id, e)}
              />
            ))}
          </div>

          {/* Premium Pagination view */}
          {sourceType !== "fallback" && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="flex items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Prev Page</span>
              </button>
              
              <span className="text-xs font-mono font-bold text-zinc-400 border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 rounded-lg">
                PAGE {currentPage + 1}
              </span>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                className="flex items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-30"
              >
                <span>Next Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
