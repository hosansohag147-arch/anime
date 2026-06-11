/**
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Gallery {
  id: string;
  token: string;
  title: string;
  cover: string;
  category: string;
  posted?: string;
  uploader?: string;
  rating?: string;
  tags?: string[];
  url?: string;
}

export interface GalleryDetails {
  title: string;
  category: string;
  posted: string;
  uploader: string;
  tags?: string[];
  pages: { index: number; url: string }[];
}

export interface AnimeItem {
  id: string;
  token: string;
  title: string;
  cover: string;
  category: string;
  posted?: string;
  uploader?: string;
  rating?: string;
  tags?: string[];
}

export interface AnimeEpisode {
  id: string;
  episode: string;
  title: string;
  url: string;
}
