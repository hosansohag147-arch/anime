/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Flame, ShieldAlert, Library, Star, Calendar, BookOpen, Tv } from "lucide-react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MangaGrid from "./components/MangaGrid";
import MangaReader from "./components/MangaReader";
import AnimeGrid from "./components/AnimeGrid";
import AnimePlayer from "./components/AnimePlayer";
import { Gallery, AnimeItem } from "./types";
import AdminDashboard from "./components/AdminDashboard";

const reactFeedCache: Record<string, { galleries: Gallery[]; sourceType: string }> = {};

function getReactCacheKey(page: number, search: string) {
  return `${page}_${encodeURIComponent((search || "").trim().toLowerCase())}`;
}

type MainView = "manga" | "anime";
type SubView = "home" | "reader" | "anime-player" | "secret-upload";

export default function App() {
  const [mainView, setMainView] = useState<MainView>("manga");
  const [currentView, setCurrentView] = useState<SubView>("home");
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);

  const [passwordVerified, setPasswordVerified] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const triggerOpenPasswordModal = () => {
    setPasswordInput("");
    setPasswordError("");
    setIsPasswordModalOpen(true);
  };

  const handleOpenPasswordModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    triggerOpenPasswordModal();
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "9221") {
      setPasswordVerified(true);
      setIsPasswordModalOpen(false);
      setCurrentView("secret-upload");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPasswordError("Invalid access passcode. Access Denied.");
    }
  };

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [galleries, setGalleries] = useState<Gallery[]>(() => {
    const initialKey = getReactCacheKey(0, "");
    return reactFeedCache[initialKey]?.galleries || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const initialKey = getReactCacheKey(0, "");
    return !reactFeedCache[initialKey];
  });
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sourceType, setSourceType] = useState<string>(() => {
    const initialKey = getReactCacheKey(0, "");
    return reactFeedCache[initialKey]?.sourceType || "live";
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("hanami_bookmarks") || "[]"); }
    catch (e) { return []; }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [isWeeklyReleasesOpen, setIsWeeklyReleasesOpen] = useState<boolean>(false);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter(item => item !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    localStorage.setItem("hanami_bookmarks", JSON.stringify(updated));
  };

  useEffect(() => { fetchFeed(); }, [currentPage]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (currentPage !== 0) setCurrentPage(0);
      else fetchFeed();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchFeed = async () => {
    const cacheKey = getReactCacheKey(currentPage, searchTerm);
    const cached = reactFeedCache[cacheKey];
    if (cached) {
      setGalleries(cached.galleries);
      setSourceType(cached.sourceType);
      setIsLoading(false);
    } else {
      if (galleries.length === 0) setIsLoading(true);
    }
    setIsFetching(true);
    setErrorMessage("");
    let completed = false;
    const timeoutId = setTimeout(() => {
      if (!completed) { completed = true; setIsLoading(false); setIsFetching(false); setIsRefreshing(false); }
    }, 15000);
    try {
      const url = `/api/manga/feed?search=${encodeURIComponent(searchTerm)}&page=${currentPage}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Local scraper gateway did not resolve successfully");
      const data = await response.json();
      if (completed) return;
      completed = true;
      clearTimeout(timeoutId);
      if (data.success && data.galleries && data.galleries.length > 0) {
        reactFeedCache[cacheKey] = { galleries: data.galleries, sourceType: data.source || "live" };
        setGalleries(data.galleries);
        setSourceType(data.source || "live");
      } else {
        throw new Error("No payload found inside api grid");
      }
    } catch (err: any) {
      if (completed) return;
      completed = true;
      clearTimeout(timeoutId);
      const hasContent = (cached && cached.galleries.length > 0) || galleries.length > 0;
      if (!hasContent) {
        setGalleries([]);
        setSourceType("live");
        setErrorMessage(err.message || "Failed to load live scraper catalog feed");
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); fetchFeed(); };

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setCurrentView("reader");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectAnime = (anime: AnimeItem) => {
    setSelectedAnime(anime);
    setCurrentView("anime-player");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToHome = () => {
    setIsRefreshing(false);
    setErrorMessage("");
    setSelectedGallery(null);
    setSelectedAnime(null);
    setCurrentView("home");
  };

  useEffect(() => {
    if (currentView === "home") {
      setIsRefreshing(false);
      setErrorMessage("");
      if (mainView === "manga") fetchFeed();
    }
  }, [currentView, mainView]);

  const getHeroGallery = (): Gallery | null => galleries.length > 0 ? galleries[0] : null;

  const isInPlayer = currentView === "reader" || currentView === "anime-player";

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100 flex flex-col">
      <Header
        currentView={currentView}
        onBack={handleBackToHome}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          if (showBookmarksOnly) setShowBookmarksOnly(false);
        }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenUpload={triggerOpenPasswordModal}
        onSelectPopularTags={() => {
          setShowBookmarksOnly(false);
          const el = document.getElementById("search-input");
          if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); }
          else window.scrollTo({ top: 320, behavior: "smooth" });
        }}
        onSelectWeeklyReleases={() => setIsWeeklyReleasesOpen(true)}
        onSelectBookmarks={() => setShowBookmarksOnly(!showBookmarksOnly)}
        showBookmarksOnly={showBookmarksOnly}
      />

      {/* ── Manga / Anime Tab Switcher ── */}
      {!isInPlayer && currentView !== "secret-upload" && (
        <div className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-sm sticky top-[57px] z-30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0">
              <button
                onClick={() => { setMainView("manga"); setCurrentView("home"); }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                  mainView === "manga"
                    ? "border-accent-rose text-accent-rose"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Manga
              </button>
              <button
                onClick={() => { setMainView("anime"); setCurrentView("home"); }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                  mainView === "anime"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Tv className="h-4 w-4" />
                Anime
                <span className="text-[9px] font-mono bg-violet-900/60 border border-violet-700/40 text-violet-300 px-1.5 py-0.5 rounded">
                  Hindi
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Views ── */}
      {currentView === "reader" && selectedGallery ? (
        <div className="flex-1 animate-fade-in">
          <MangaReader gallery={selectedGallery} onBack={handleBackToHome} />
        </div>
      ) : currentView === "anime-player" && selectedAnime ? (
        <div className="flex-1 animate-fade-in">
          <AnimePlayer anime={selectedAnime} onBack={handleBackToHome} />
        </div>
      ) : currentView === "secret-upload" ? (
        <AdminDashboard passwordVerified={passwordVerified} onBack={handleBackToHome} />
      ) : mainView === "anime" ? (
        // ── Anime Home ──
        <main className="flex-1 animate-fade-in">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Tv className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">Hindi Dubbed Anime</h2>
              <span className="text-[10px] font-mono bg-violet-900/40 border border-violet-800/40 text-violet-300 px-2 py-0.5 rounded">
                Powered by Gogoanime
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Search করুন অথবা scroll করে Hindi dubbed anime দেখুন
            </p>
          </div>
          <AnimeGrid
            onSelect={handleSelectAnime}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        </main>
      ) : (
        // ── Manga Home ──
        <main className="flex-1 animate-fade-in">
          {!searchTerm && !showBookmarksOnly && galleries.length > 0 && (
            <Hero gallery={getHeroGallery()} onReadNow={handleSelectGallery} />
          )}

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-dark-border bg-dark-card/30 p-4 md:grid-cols-4">
              <div className="flex items-center gap-2.5">
                <Flame className="h-4.5 w-4.5 text-accent-rose animate-bounce" />
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Top Trending</div>
                  <div className="text-xs font-bold text-white">Manga Scraped</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-l border-zinc-900 pl-4">
                <Library className="h-4.5 w-4.5 text-cyan-400" />
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Language</div>
                  <div className="text-xs font-bold text-white">English Filter Active</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-l border-zinc-900 pl-4">
                <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Sleek Layout</div>
                  <div className="text-xs font-bold text-white">Vertical Reader</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-l border-zinc-900 pl-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Connection</div>
                  <div className="text-xs font-bold text-emerald-400">Secure CDN Tunnel</div>
                </div>
              </div>
            </div>
          </div>

          {showBookmarksOnly && (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
              <div className="flex items-center justify-between rounded-xl border border-accent-rose/30 bg-accent-rose/10 p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent-rose fill-accent-rose" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Your Bookmarked Series</h3>
                    <p className="text-xs text-zinc-400">Showing saved titles from local storage</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookmarksOnly(false)}
                  className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  Show All Catalog
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mx-auto max-w-2xl mt-8 px-4">
              <div className="flex items-center gap-3 rounded-lg border border-red-950 bg-red-950/20 p-4 text-sm text-red-400 shadow">
                <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Network Ingress Notification:</span> {errorMessage}
                </div>
              </div>
            </div>
          )}

          <MangaGrid
            galleries={
              showBookmarksOnly
                ? galleries.filter(g => bookmarkedIds.includes(g.id))
                : (searchTerm ? galleries : galleries.slice(1))
            }
            isLoading={isLoading}
            isFetching={isFetching}
            onSelect={handleSelectGallery}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            sourceType={sourceType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            onMount={fetchFeed}
          />
        </main>
      )}

      {currentView === "reader" && (
        <div id="reader-dynamic-pagination-footer" className="hidden pointer-events-none" aria-hidden="true" />
      )}

      <footer className="mt-auto border-t border-dark-border bg-dark-bg py-8 text-center text-xs text-zinc-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-display font-semibold text-zinc-400 tracking-wide">
            Hanami HoHo Premium Portal
          </p>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">
            Manga + Hindi Anime streaming via live proxy pipelines.
          </p>
          <div className="mt-3 text-[10px] text-zinc-700 flex items-center justify-center gap-1.5 flex-wrap">
            <span>© 2026 Hanami HoHo Group Ltd. All rights reserved.</span>
            <span>•</span>
            <button
              onClick={handleOpenPasswordModal}
              className="text-zinc-850 hover:text-accent-rose transition-colors cursor-pointer text-[10px] font-mono hover:underline focus:outline-none"
            >
              hoho
            </button>
          </div>
        </div>
      </footer>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl relative">
            <h3 className="font-display text-lg font-bold text-white mb-2 text-center">Administrator Verification</h3>
            <p className="text-zinc-400 text-xs text-center mb-5 leading-normal">
              Please enter the standard Hanami config security code to unlock local upload permissions.
            </p>
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              {passwordError && (
                <p className="text-center text-[11px] font-semibold text-red-400 bg-red-950/20 border border-red-950/60 py-1.5 px-3 rounded-lg">
                  {passwordError}
                </p>
              )}
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter Password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
                className="w-full h-11 px-4 text-center rounded-xl border border-dark-border bg-zinc-950 text-white font-mono text-sm tracking-widest outline-none focus:border-accent-rose transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 h-10 border border-dark-border bg-transparent hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-accent-rose hover:bg-accent-rose-dark text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg shadow-accent-rose/10"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Releases Modal */}
      {isWeeklyReleasesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <h3 className="font-display text-lg font-bold text-white">Weekly Releases Schedule</h3>
              </div>
              <button onClick={() => setIsWeeklyReleasesOpen(false)} className="text-zinc-500 hover:text-white transition cursor-pointer text-xl">×</button>
            </div>
            <div className="space-y-3 font-sans">
              {[
                { day: "Monday", title: "Aesthetic Schoolgirl Doujin Archives", tag: "Schoolgirl", time: "09:00 UTC" },
                { day: "Wednesday", title: "Milf Fantasy & Uncensored Updates", tag: "Milf", time: "14:30 UTC" },
                { day: "Thursday", title: "Sole Female & Sole Male Series", tag: "Sole Female", time: "11:00 UTC" },
                { day: "Friday", title: "Exclusive Artist CG & Full Color Collections", tag: "Full Color", time: "20:00 UTC" },
                { day: "Weekend Hotlist", title: "Top-Scraped Weekly Masterpieces", tag: "Doujinshi", time: "Saturdays 18:00 UTC" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-900/60 hover:border-zinc-800 transition">
                  <div>
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-900/40 px-2 py-0.5 rounded mr-2">{item.day}</span>
                    <span className="text-xs font-semibold text-white">{item.title}</span>
                  </div>
                  <div className="mt-1 sm:mt-0 flex items-center gap-2">
                    <span className="text-[9px] font-mono text-zinc-500">{item.time}</span>
                    <button
                      onClick={() => { setIsWeeklyReleasesOpen(false); setSearchTerm(item.tag); }}
                      className="text-[10px] font-bold text-accent-rose hover:underline"
                    >Filter tag</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsWeeklyReleasesOpen(false)} className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-lg transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
