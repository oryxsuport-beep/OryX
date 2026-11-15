// Public music discovery via Apple's iTunes Search API; no API key required.
// Search returns metadata and links to authorized storefront pages, not full audio.
export const YOUTUBE_API_BASE_URL = (import.meta.env.VITE_YOUTUBE_API_BASE_URL || '').replace(/\/$/, '');

export type YouTubeVideo = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  sourceUrl?: string;
};

type ItunesSong = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  trackTimeMillis?: number;
  artworkUrl100?: string;
  trackViewUrl?: string;
};

function durationLabel(ms?: number): string {
  if (!ms || !Number.isFinite(ms)) return '';
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

async function searchItunes(query: string): Promise<YouTubeVideo[]> {
  const endpoint = new URL('https://itunes.apple.com/search');
  endpoint.searchParams.set('term', query);
  endpoint.searchParams.set('entity', 'song');
  endpoint.searchParams.set('media', 'music');
  endpoint.searchParams.set('limit', '35');
  const response = await fetch(endpoint.toString());
  if (!response.ok) throw new Error('O catálogo de músicas não respondeu.');
  const data = await response.json() as { results?: ItunesSong[] };
  return (data.results || []).filter(song => song.trackId && song.trackViewUrl)
    .map(song => ({
      id: `itunes-${song.trackId}`,
      title: song.trackName || 'Música',
      artist: song.artistName || 'Artista desconhecido',
      duration: durationLabel(song.trackTimeMillis),
      thumbnail: song.artworkUrl100 || '',
      sourceUrl: song.trackViewUrl
    }));
}

export async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  const term = query.trim();
  if (!term) return [];
  if (!YOUTUBE_API_BASE_URL) return searchItunes(term);
  try {
    const response = await fetch(`${YOUTUBE_API_BASE_URL}/api/search?q=${encodeURIComponent(term)}`);
    if (!response.ok) throw new Error('API indisponível');
    const data = await response.json() as { videos?: YouTubeVideo[] };
    return data.videos || [];
  } catch {
    return searchItunes(term);
  }
}
