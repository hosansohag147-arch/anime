import React from "react";
import { Play, Info, Star, Calendar } from "lucide-react";
import { Gallery } from "../types";

interface HeroProps {
  gallery: Gallery | null;
  onReadNow: (gallery: Gallery) => void;
}

export default function Hero({ gallery, onReadNow }: HeroProps) {
  if (!gallery) return null;

  return (
    <div className="relative w-full bg-black py-4">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative h-[28rem] w-full overflow-hidden rounded-2xl border border-dark-border shadow-2xl">
          {/* Background image overlay */}
          <div className="absolute inset-0">
            <img
              src={gallery.cover}
              alt={gallery.title}
              className="h-full w-full object-cover object-center scale-105 filter blur-[2px] brightness-[0.35]"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/95 via-dark-bg/60 to-transparent"></div>
          </div>

          {/* Banner Contents */}
          <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 md:p-12 md:max-w-2xl">
            {/* Category tag */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded bg-accent-rose px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md">
                {gallery.category}
              </span>
              <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-amber-400 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-amber-400" />
                {gallery.rating || "4.8"}
              </span>
              {gallery.posted && (
                <span className="flex items-center gap-1 rounded bg-zinc-900/50 px-2 py-0.5 text-xs text-zinc-400 backdrop-blur-sm">
                  <Calendar className="h-3 w-3" />
                  {gallery.posted.split(" ")[0]}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl text-pretty line-clamp-3">
              {gallery.title}
            </h1>

            {/* Brief description simulation (premium styled) */}
            <p className="mt-3 text-sm text-zinc-300 md:text-base line-clamp-2 md:max-w-xl">
              Experience the highest-rated chapters curated directly from the world's leading community servers, flawlessly compiled with top-to-bottom infinite scrolling.
            </p>

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onReadNow(gallery)}
                id="hero-read-button"
                className="flex items-center gap-2 rounded-full bg-accent-rose px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-rose/30 transition-all hover:bg-accent-rose-dark hover:scale-[1.02] active:scale-95"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Read Chapter Now</span>
              </button>
              
              <div className="hidden items-center gap-1.5 rounded-full border border-dark-border bg-dark-card/50 px-4 py-2.5 text-xs text-zinc-400 backdrop-blur-md md:flex">
                <Info className="h-3.5 w-3.5 text-accent-rose" />
                <span>Uploaded by <span className="text-zinc-200">{gallery.uploader || "Global Server"}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
