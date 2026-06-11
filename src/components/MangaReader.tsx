import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, Sparkles, Sliders, ChevronDown, Check, Columns, Maximize2, Minimize2 } from "lucide-react";
import { Gallery, GalleryDetails } from "../types";

interface MangaReaderProps {
  gallery: Gallery;
  onBack: () => void;
}

// Single page image loader element
function ReaderPage({ index, pageUrl, zoomMode }: { key?: React.Key; index: number; pageUrl: string; zoomMode: "standard" | "wide" | "fill" }) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    async function fetchImageSrc() {
      try {
        const response = await fetch(`/api/manga/page-image-src?url=${encodeURIComponent(pageUrl)}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Failed to crawl meta for page ${index}`);
        }
        const data = await response.json();
        if (active) {
          if (data.success && data.src) {
            setImageSrc(data.src);
            setLoading(false);
          } else {
            throw new Error("Invalid crawler database result");
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Page ${index} fetch aborted cleanly`);
          return;
        }
        console.error(`Page ${index} error:`, err.message);
        if (active) {
          // Retry automatically once
          if (retryCount < 2) {
            setRetryCount(prev => prev + 1);
          } else {
            setError(err.message || "Failed to load page");
            setLoading(false);
          }
        }
      }
    }

    fetchImageSrc();

    return () => {
      active = false;
      controller.abort();
    };
  }, [pageUrl, retryCount, index]);

  const getZoomClass = () => {
    switch (zoomMode) {
      case "wide":
        return "max-w-4xl";
      case "fill":
        return "max-w-full";
      default:
        return "max-w-2xl"; // standard comfortable reading size
    }
  };

  return (
    <div id={`reader-page-container-${index}`} className="group relative mx-auto my-6 flex flex-col items-center border border-zinc-900 bg-zinc-950/60 p-2 shadow-2xl transition-all duration-300 hover:border-zinc-800">
      {/* Top micro metadata header */}
      <div className="absolute top-2 right-4 z-10 flex select-none items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-mono text-zinc-400 backdrop-blur-md">
        <span>PAGE {index}</span>
        {loading && <span className="h-1.5 w-1.5 rounded-full bg-accent-rose animate-ping"></span>}
      </div>

      {loading && (
        <div className="flex h-96 w-full max-w-2xl flex-col items-center justify-center rounded-lg border border-dark-border bg-dark-card/30 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-accent-rose mb-3" />
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-500">
            Crawling Page {index} in Realtime...
          </span>
          <span className="mt-1 text-[10px] text-zinc-600 font-mono">
            Accessing CDN secure channel
          </span>
        </div>
      )}

      {error ? (
        <div className="flex h-96 w-full max-w-2xl flex-col items-center justify-center rounded-lg border border-dashed border-red-900/30 bg-red-950/10 text-red-400 p-4">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <span className="text-sm font-semibold">Broken Link Protection</span>
          <p className="mt-1.5 max-w-xs text-center text-xs text-zinc-500 leading-relaxed">
            The page could not be scraped live due to source-side network rate constraints.
          </p>
          <button
            onClick={() => setRetryCount(0)}
            className="mt-4 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-1.5 text-xs text-zinc-300 font-medium"
          >
            Retry Crawling page
          </button>
        </div>
      ) : (
        imageSrc && (
          <div className={`w-full ${getZoomClass()} transition-all duration-500`}>
            <img
              src={imageSrc}
              alt={`Page ${index}`}
              className="h-auto w-full object-contain pointer-events-none select-none opacity-0 transition-opacity duration-500 rounded-md"
              onLoad={(e) => {
                (e.target as HTMLImageElement).classList.remove("opacity-0");
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        )
      )}
    </div>
  );
}

export default function MangaReader({ gallery, onBack }: MangaReaderProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [zoomMode, setZoomMode] = useState<"standard" | "wide" | "fill">("standard");
  const [activeThumbPage, setActiveThumbPage] = useState<number>(0); // Chapter index state (0, 1, 2...)
  const [readingMode, setReadingMode] = useState<"next-all" | "next-one">("next-all");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    async function loadGalleryDetails() {
      try {
        const response = await fetch(`/api/manga/${gallery.id}/${gallery.token}/pages?p=${activeThumbPage}`);
        if (!response.ok) {
          throw new Error("Failed to parse gallery details and page maps");
        }
        const data = await response.json();
        if (active) {
          if (data.success) {
            setDetails(data);
            setLoading(false);
          } else {
            throw new Error(data.error || "Failed to parse chapters");
          }
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || "Failed to load reader pages. Verify gallery token.");
          setLoading(false);
        }
      }
    }

    loadGalleryDetails();

    return () => {
      active = false;
    };
  }, [gallery.id, gallery.token, activeThumbPage]);

  // Handle previous chapter action
  const handlePrevChapter = () => {
    if (activeThumbPage > 0) {
      setActiveThumbPage(prev => prev - 1);
      setActivePageIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle next chapter action
  const handleNextChapter = () => {
    if (details?.chapters && activeThumbPage < details.chapters.length - 1) {
      setActiveThumbPage(prev => prev + 1);
      setActivePageIndex(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-dark-bg text-zinc-100">
      
      {/* Dynamic Sub-header detailing current book */}
      <div className="border-b border-dark-border bg-dark-card/40 py-5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="rounded bg-accent-rose/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-rose border border-accent-rose/20">
                  {details ? details.category : gallery.category}
                </span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  ID: #{gallery.id}
                </span>
              </div>
              <h1 className="font-display text-lg font-bold tracking-tight text-white md:text-xl text-balance">
                {details ? details.title : gallery.title}
              </h1>
              <p className="mt-1 text-xs text-zinc-400 font-mono">
                Uploaded by <span className="text-zinc-200">@{details?.uploader || gallery.uploader || "Global Server"}</span> • {details?.posted || gallery.posted}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 sm:mt-0">
              {/* Dual Reading Mode Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <Columns className="h-3.5 w-3.5 text-accent-rose" />
                  Mode:
                </span>
                <div className="flex rounded-lg border border-dark-border bg-dark-card p-0.5">
                  <button
                    onClick={() => setReadingMode("next-all")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                      readingMode === "next-all"
                        ? "bg-accent-rose text-white shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Next All
                  </button>
                  <button
                    onClick={() => {
                      setReadingMode("next-one");
                      setActivePageIndex(0);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                      readingMode === "next-one"
                        ? "bg-accent-rose text-white shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Next One
                  </button>
                </div>
              </div>

              {/* Read Settings Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-accent-rose" />
                  Scale:
                </span>
                <div className="flex rounded-lg border border-dark-border bg-dark-card p-0.5">
                  {(["standard", "wide", "fill"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setZoomMode(mode)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                        zoomMode === mode
                          ? "bg-zinc-850 text-white shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chapter Selection Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-900 pt-4">
            <div className="flex items-center gap-2">
              <button
                disabled={activeThumbPage <= 0}
                onClick={handlePrevChapter}
                className="flex items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-dark-card"
              >
                &larr; Prev Ch
              </button>

              <div className="relative">
                <select
                  value={activeThumbPage}
                  onChange={(e) => {
                    setActiveThumbPage(parseInt(e.target.value, 10));
                    setActivePageIndex(0);
                  }}
                  className="appearance-none rounded-lg border border-dark-border bg-dark-card py-1.5 pl-3 pr-10 text-xs font-bold text-white outline-none focus:border-accent-rose cursor-pointer"
                >
                  {details?.chapters?.map((ch: any) => (
                    <option key={ch.index} value={ch.index}>
                      Chapter {ch.chapter} {ch.title ? `: ${ch.title}` : ""}
                    </option>
                  )) || (
                    <option value={activeThumbPage}>
                      Chapter {activeThumbPage + 1}
                    </option>
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute top-2 right-2.5 h-3.5 w-3.5 text-zinc-400" />
              </div>

              <button
                disabled={details?.chapters ? activeThumbPage >= details.chapters.length - 1 : true}
                onClick={handleNextChapter}
                className="flex items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-dark-card"
              >
                Next Ch &rarr;
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-500">
              Chapter Index: <span className="text-zinc-300 font-semibold">{activeThumbPage + 1}</span> of {details?.totalChapters || details?.chapters?.length || 1}
            </div>
          </div>

          {/* Tags displaying inside reader header */}
          {details?.tags && details.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-zinc-900 pt-3">
              {details.tags.map((tag, i) => (
                <span key={i} className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && !details && (
        <div className="flex flex-1 flex-col items-center justify-center py-36">
          <Loader2 className="h-10 w-10 animate-spin text-accent-rose mb-4" />
          <h2 className="font-display text-white font-bold text-lg">Initializing Reader Canvas</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs text-center leading-relaxed">
            Parsing image catalogs and indexing secure host channels. This takes a brief moment...
          </p>
        </div>
      )}

      {error && (
        <div className="mx-auto my-24 w-full max-w-md rounded-2xl border border-red-900/30 bg-red-950/10 p-8 text-center text-red-400">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="font-display text-base font-bold text-white">Parser Failure</h3>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            We encountered issues fetching this chapter index. The target links may have been deleted, or protected.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onBack}
              className="rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setActiveThumbPage(0);
                setError("");
              }}
              className="rounded-full bg-accent-rose px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-accent-rose/30"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Reader Mode Canvas */}
      {details && (
        <div className="flex-1 py-4 bg-zinc-950">
          <div className="text-center py-2 mb-4 bg-zinc-900/30 border-y border-zinc-900">
            <span className="text-[11px] font-mono text-accent-rose uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3 animate-bounce" />
              {readingMode === "next-all" ? "Scroll down to read" : `Single Page Active: ${activePageIndex + 1} of ${details.pages.length}`} • {details.pages.length} Pages Compiled
            </span>
          </div>

           {readingMode === "next-all" ? (
            /* Next All Mode: loads all the scraped chapter images sequentially in vertical scroll layout */
            <div className="flex flex-col">
              {details.pages.map((page) => (
                <ReaderPage
                  key={`${page.index}_${page.url}`}
                  index={page.index}
                  pageUrl={page.url}
                  zoomMode={zoomMode}
                />
              ))}
            </div>
          ) : (
            /* Next One Mode: displays only one active image at a time */
            <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
              {details.pages[activePageIndex] && (
                <ReaderPage
                  index={details.pages[activePageIndex].index}
                  pageUrl={details.pages[activePageIndex].url}
                  zoomMode={zoomMode}
                />
              )}

              {/* Precise Single Page Selector controls */}
              <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-xl bg-dark-card/40 border border-dark-border p-5 rounded-2xl backdrop-blur-md">
                <div className="flex items-center justify-between w-full">
                  <button
                    disabled={activePageIndex <= 0}
                    onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
                    className="flex h-10 px-4 items-center gap-1 rounded-full border border-dark-border bg-dark-card text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-dark-card transition-all"
                  >
                    &larr; Prev Page
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-semibold text-zinc-300">
                      Page <span className="text-accent-rose">{activePageIndex + 1}</span> of {details.pages.length}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={details.pages.length - 1}
                      value={activePageIndex}
                      onChange={(e) => setActivePageIndex(parseInt(e.target.value, 10))}
                      className="mt-2 h-1 w-32 rounded-lg bg-zinc-800 accent-accent-rose cursor-pointer"
                    />
                  </div>

                  <button
                    disabled={activePageIndex >= details.pages.length - 1}
                    onClick={() => setActivePageIndex(prev => Math.min(details.pages.length - 1, prev + 1))}
                    className="flex h-10 px-4 items-center gap-1 rounded-full border border-dark-border bg-dark-card text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-dark-card transition-all"
                  >
                    Next Page &rarr;
                  </button>
                </div>

                {/* Main Glossy progression 'Next One' button */}
                <button
                  onClick={() => {
                    if (activePageIndex < details.pages.length - 1) {
                      setActivePageIndex(prev => prev + 1);
                      // Smooth scroll container to center view
                      setTimeout(() => {
                        const element = document.getElementById(`reader-page-container-${details.pages[activePageIndex + 1].index}`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 50);
                    } else if (details?.chapters && activeThumbPage < details.chapters.length - 1) {
                      // Seamless jump to the next chapter on finishing single pages
                      setActiveThumbPage(prev => prev + 1);
                      setActivePageIndex(0);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      onBack();
                    }
                  }}
                  className="w-full flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-accent-rose to-pink-600 hover:from-accent-rose hover:to-pink-700 text-white font-bold text-sm shadow-xl shadow-accent-rose/20 transition-all duration-300 transform active:scale-95"
                >
                  {activePageIndex < details.pages.length - 1 ? (
                    "Next One Page"
                  ) : (
                    details?.chapters && activeThumbPage < details.chapters.length - 1 ? (
                      "Chapter Complete - Start Next Chapter"
                    ) : (
                      "Finish Chapter & Back to Catalog"
                    )
                  )}
                </button>
              </div>
            </div>
          )}

          {/* End of chapter banner */}
          <div className="mx-auto max-w-md my-16 p-8 rounded-2xl border border-dark-border bg-dark-card/60 text-center shadow-lg">
            <div className="h-8 w-8 rounded-full bg-accent-rose/10 text-accent-rose mx-auto flex items-center justify-center mb-4">
              <Check className="h-4 w-4" />
            </div>
            <h3 className="font-display font-bold text-white text-base">Finished Reading</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
              You have completed the scroll page index. Join us again as more parts are scraped!
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={onBack}
                className="rounded-full border border-dark-border bg-dark-card/60 px-5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all"
              >
                Back to Feed
              </button>
              {details?.chapters && activeThumbPage < details.chapters.length - 1 && (
                <button
                  onClick={handleNextChapter}
                  className="rounded-full bg-accent-rose px-5 py-2 text-xs font-bold text-white shadow-lg shadow-accent-rose/20 transition-all hover:bg-accent-rose-dark"
                >
                  Go to Next Chapter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
