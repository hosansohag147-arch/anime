import React, { useState } from "react";
import { 
  BookOpen, Search, ArrowLeft, RefreshCw, UploadCloud, Compass, Sparkles, 
  Menu, Tag, Calendar, Bookmark, ChevronDown 
} from "lucide-react";

interface HeaderProps {
  currentView: "home" | "reader" | "secret-upload";
  onBack: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenUpload: () => void;
  onSelectWeeklyReleases: () => void;
  onSelectPopularTags: () => void;
  onSelectBookmarks: () => void;
  showBookmarksOnly: boolean;
}

export default function Header({
  currentView,
  onBack,
  searchTerm,
  onSearchChange,
  onRefresh,
  isRefreshing,
  onOpenUpload,
  onSelectWeeklyReleases,
  onSelectPopularTags,
  onSelectBookmarks,
  showBookmarksOnly,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Logo & Quick Desktop Nav */}
        <div className="flex items-center gap-6">
          {currentView !== "home" ? (
            <button
              onClick={onBack}
              id="back-button"
              className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-card px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-accent-rose" />
              <span>Back to home</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onBack}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-rose text-white shadow-lg shadow-accent-rose/30">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-accent-rose bg-clip-text text-transparent">
                Hanami <span className="text-accent-rose">HoHo</span>
              </span>
            </div>
          )}

          {/* New Desktop-only Genre Navigation pills */}
          {currentView === "home" && (
            <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold text-zinc-400">
              <button 
                onClick={() => onSearchChange("")} 
                className={`transition-colors hover:text-white cursor-pointer ${!searchTerm ? "text-accent-rose" : ""}`}
              >
                All Feed
              </button>
              <span className="text-zinc-800">|</span>
              <button 
                onClick={() => onSearchChange("Doujinshi")} 
                className={`transition-colors hover:text-white cursor-pointer ${searchTerm.toLowerCase() === "doujinshi" ? "text-accent-rose" : ""}`}
              >
                Doujinshi
              </button>
              <span className="text-zinc-800">|</span>
              <button 
                onClick={() => onSearchChange("Manga")} 
                className={`transition-colors hover:text-white cursor-pointer ${searchTerm.toLowerCase() === "manga" ? "text-accent-rose" : ""}`}
              >
                Manga
              </button>
              <span className="text-zinc-800">|</span>
              <button 
                onClick={() => onSearchChange("Uncensored")} 
                className={`transition-colors hover:text-white cursor-pointer ${searchTerm.toLowerCase() === "uncensored" ? "text-accent-rose" : ""}`}
              >
                Uncensored
              </button>
            </nav>
          )}
        </div>

        {/* Center Section: Search Bar (Hidden when on reader or upload dashboard) */}
        {currentView === "home" && (
          <div className="relative max-w-sm flex-1 px-4">
            <div className="relative">
              <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search series or keywords..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                id="search-input"
                className="w-full rounded-full border border-dark-border bg-dark-card py-2 pr-4 pl-10 text-xs text-white placeholder-zinc-500 shadow-inner outline-none transition-all duration-300 focus:border-accent-rose focus:ring-1 focus:ring-accent-rose/50"
              />
            </div>
          </div>
        )}

        {/* Right Section: Actions & Shortcut for Upload Dashboard */}
        <div className="flex items-center gap-3">
          {currentView === "home" && (
            <>
              {/* Shortcut to verify/upload directly right from header */}
              <button
                onClick={onOpenUpload}
                id="header-upload-btn"
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-accent-rose hover:border-accent-rose/30 cursor-pointer"
                title="Admin Upload Portal"
              >
                <UploadCloud className="h-3.5 w-3.5 text-accent-rose" />
                <span>Upload ZIP</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                id="refresh-button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-border bg-dark-card text-zinc-400 transition-all hover:bg-zinc-800 hover:text-accent-rose disabled:opacity-50"
                title="Refresh Live Scraper Feed"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-accent-rose" : ""}`} />
              </button>
            </>
          )}

          {/* Top-Right Menu & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-3 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white cursor-pointer"
              title="Site Navigation Menu"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">Explore</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-dark-border bg-dark-card p-1.5 shadow-2xl z-50">
                  <div className="px-3 py-1.5 border-b border-zinc-900">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Portal Navigation</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSelectPopularTags();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Tag className="h-3.5 w-3.5 text-accent-rose" />
                      <span>Popular Tags</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSelectWeeklyReleases();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Weekly Releases</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSelectBookmarks();
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        showBookmarksOnly 
                          ? "bg-accent-rose/10 text-accent-rose border border-accent-rose/20" 
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${showBookmarksOnly ? "fill-accent-rose text-accent-rose" : "text-amber-400"}`} />
                      <span>Bookmarks {showBookmarksOnly ? "(Active)" : ""}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <span className="hidden select-none items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[10px] font-mono text-zinc-500 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            LIVE DBTUNNEL
          </span>
        </div>
      </div>
    </header>
  );
}
