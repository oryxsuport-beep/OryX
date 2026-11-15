import express from 'express';
import cors from 'cors';
import { Readable } from 'node:stream';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';

// youtubei.js needs an interpreter to decipher YouTube's player formats.
Platform.shim.eval = async (data) => new Function(data.output)();

const app = express();
app.use(cors({ origin: '*' }));
app.disable('x-powered-by');

const PORT = process.env.PORT || 3000;
let clientPromise;

async function getYouTube() {
  if (!clientPromise) {
    clientPromise = Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    }).catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'OryX YouTube API' }));

app.get('/api/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 120);
    if (!query) return res.status(400).json({ error: 'Digite o nome da música.' });

    const yt = await getYouTube();
    const result = await yt.search(query, { type: 'video' });
    const videos = (result.videos || []).slice(0, 10).filter((video) => video.id).map((video) => ({
      id: video.id,
      title: video.title?.text || 'Sem título',
      artist: video.author?.name || 'Artista desconhecido',
      duration: video.duration?.text || '',
      thumbnail: video.thumbnails?.[0]?.url || '',
    }));
    res.json({ videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(502).json({ error: 'Não foi possível pesquisar no YouTube agora. Tente novamente.' });
  }
});

async function proxyAudio(req, res) {
  try {
    const videoId = String(req.params.id || '');
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({ error: 'ID de vídeo inválido.' });
    }

    const yt = await getYouTube();
    const info = await yt.getBasicInfo(videoId);
    if (info.playability_status?.status && info.playability_status.status !== 'OK') {
      return res.status(403).json({ error: 'Este vídeo não está disponível para reprodução.' });
    }

    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (!format) return res.status(404).json({ error: 'Formato de áudio não encontrado.' });
    const audioUrl = await format.decipher(yt.session.player);
    if (!audioUrl) return res.status(502).json({ error: 'Não foi possível obter o áudio.' });

    const headers = {};
    if (req.headers.range) headers.Range = req.headers.range;
    const upstream = await fetch(audioUrl, { headers });
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(502).json({ error: 'O YouTube não entregou o áudio. Tente outra faixa.' });
    }

    res.status(upstream.status);
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error('YouTube audio error:', error);
    if (!res.headersSent) res.status(502).json({ error: 'Falha ao preparar o áudio do YouTube.' });
    else res.end();
  }
}

app.get('/api/audio/:id', proxyAudio);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OryX YouTube API listening on ${PORT}`);
});
