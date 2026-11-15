export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  src: string;
  kind: "local" | "url";
  file?: File;
};

export type LyricsResult = {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
};
