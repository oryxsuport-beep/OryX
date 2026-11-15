// Jamendo provides licensed independent music streams with a registered client ID.
// Set VITE_JAMENDO_CLIENT_ID for in-app playback. iTunes remains a metadata fallback.
export const YOUTUBE_API_BASE_URL = (import.meta.env.VITE_YOUTUBE_API_BASE_URL || '').replace(/\/$/, '');
const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || '';

export type YouTubeVideo = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  sourceUrl?: string;
  audioUrl?: string;
};

type JamendoTrack = { id: string; name: string; artist_name: string; duration: number; image?: string; album_image?: string; audio?: string; shareurl?: string };
type ItunesSong = { trackId?: number; trackName?: string; artistName?: string; trackTimeMillis?: number; artworkUrl100?: string; trackViewUrl?: string };
function durationLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
async function searchJamendo(query: string): Promise<YouTubeVideo[]> {
  const endpoint = new URL('https://api.jamendo.com/v3.0/tracks/');
  endpoint.searchParams.set('client_id', JAMENDO_CLIENT_ID);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('search', query);
  endpoint.searchParams.set('limit', '35');
  endpoint.searchParams.set('audioformat', 'mp32');
  endpoint.searchParams.set('type', 'single albumtrack');
  const response = await fetch(endpoint.toString());
  if (!response.ok) throw new Error('Catálogo Jamendo indisponível.');
  const data = await response.json() as { headers?: { status?: string; error_message?: string }; results?: JamendoTrack[] };
  if (data.headers?.status !== 'success') throw new Error(data.headers?.error_message || 'Erro no catálogo Jamendo.');
  return (data.results || []).filter(song => Boolean(song.audio))
    .map(song => ({
      id: `jamendo-${song.id}`,
      title: song.name,
      artist: song.artist_name,
      duration: durationLabel(song.duration),
      thumbnail: song.image || song.album_image || '',
      audioUrl: song.audio,
      sourceUrl: song.shareurl || 'https://www.jamendo.com'
    }));
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
      duration: durationLabel((song.trackTimeMillis || 0) / 1000),
      thumbnail: song.artworkUrl100 || '',
      sourceUrl: song.trackViewUrl
    }));
}
export async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  const term = query.trim();
  if (!term) return [];
  if (JAMENDO_CLIENT_ID) {
    try {
      const tracks = await searchJamendo(term);
      if (tracks.length) return tracks;
    } catch { /* fall back to metadata discovery */ }
  }
  if (YOUTUBE_API_BASE_URL) {
    try {
      const response = await fetch(`${YOUTUBE_API_BASE_URL}/api/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json() as { videos?: YouTubeVideo[] };
        if (data.videos?.length) return data.videos;
      }
    } catch { /* fall back to iTunes */ }
  }
  return searchItunes(term);
}
