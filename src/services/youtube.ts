// API opcional de descoberta de metadados; não serve áudio de vídeos.
export const YOUTUBE_API_BASE_URL = (import.meta.env.VITE_YOUTUBE_API_BASE_URL || '').replace(/\/$/, '');

export type YouTubeVideo = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
};

export async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_BASE_URL) {
    throw new Error('A descoberta online ainda não foi configurada.');
  }
  const response = await fetch(`${YOUTUBE_API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falha na busca do YouTube.');
  return data.videos || [];
}

