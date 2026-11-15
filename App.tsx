import { createBackup, parseBackup } from "./services/backup";
import { clampSeekTime } from "./services/seek";
import { searchLibrary } from "./services/librarySearch";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines, Disc3, FileAudio, Heart, ListMusic,
  LoaderCircle, Music2, Pause, Play, Plus, Search, Shuffle, SkipBack,
  SkipForward, Volume2, X, Compass, Users, BarChart3, Sparkles, Globe2, Palette, HeartHandshake
} from "lucide-react";
import { loadAudio } from "./services/audio";
import { getSystemVolume, setSystemVolume, supportsSystemVolume } from "./services/systemVolume";
import { findLyrics, parseSyncedLyrics, type LyricLine } from "./services/lrclib";
import type { LyricsResult, Track } from "./types";
import { searchYouTube, type YouTubeVideo } from "./services/youtube";
import { recommendNext, type SmartNextMode } from "./services/smartNext";
import { uniqueCatalog } from "./services/catalog";
import { dailyDrop, buildReplay, chooseVibe, makeShareText, type Vibe } from "./services/universe";

const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const makeTrack = (file: File): Track => ({
  id: `${file.name}-${file.lastModified}-${file.size}`,
  title: file.name.replace(/\.[^.]+$/, ""),
  artist: "Arquivo local",
  src: URL.createObjectURL(file),
  kind: "local",
  file
});

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const tracksRef = useRef<Track[]>([]);
  const playRequestRef = useRef(0);
  const tracksRefLatest = useRef<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("oryx:volume"); } catch { /* private browsing */ }
    const saved = stored === null ? NaN : Number(stored);
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.85;
  });
  const [nativeVolume, setNativeVolume] = useState(supportsSystemVolume);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFavoritesOnly, setLibraryFavoritesOnly] = useState(false);
  const [url, setUrl] = useState("");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeVideo[]>([]);
  const [youtubeBusy, setYoutubeBusy] = useState(false);
  const [homeBusy, setHomeBusy] = useState(true);
  const [homeError, setHomeError] = useState("");
  const [homeVideos, setHomeVideos] = useState<YouTubeVideo[]>([]);
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [lyricsBusy, setLyricsBusy] = useState(false);
  const [lyricsError, setLyricsError] = useState("");
  const [lyricsTrack, setLyricsTrack] = useState("");
  const [lyricsArtist, setLyricsArtist] = useState("");
  const [activeLyric, setActiveLyric] = useState(0);
  const [liked, setLiked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("oryx:liked") || "[]") as string[]; }
    catch { return []; }
  });
  const [discoveryGenre, setDiscoveryGenre] = useState("Brasil");
  const [shuffle, setShuffle] = useState(false);
  const [smartNext, setSmartNext] = useState(true);
  const [smartNextMode, setSmartNextMode] = useState<SmartNextMode>("balanced");
  const [repeat, setRepeat] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(() => {
    try { const v = Number(localStorage.getItem("oryx:playbackSpeed")); return [0.75, 1, 1.25, 1.5, 2].includes(v) ? v : 1; }
    catch { return 1; }
  });
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("oryx:recent") || "[]") as string[]; }
    catch { return []; }
  });
  const [tab, setTab] = useState<"lyrics" | "queue">("lyrics");
  const [section, setSection] = useState<"listen" | "discover" | "universe" | "profile">("listen");
  const [vibe, setVibe] = useState<Vibe>("energia");
  const [accent, setAccent] = useState(() => { try { return localStorage.getItem("oryx:accent") || "#ff3038"; } catch { return "#ff3038"; } });
  const [motion, setMotion] = useState(() => { try { return localStorage.getItem("oryx:motion") !== "off"; } catch { return true; } });
  const [displayName, setDisplayName] = useState(() => { try { return localStorage.getItem("oryx:displayName") || "OryX Listener"; } catch { return "OryX Listener"; } });
  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem("oryx:plays") || "{}"); } catch { return {}; } });
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const replay = useMemo(() => buildReplay(tracks, playCounts, liked), [tracks, playCounts, liked]);
  const drops = useMemo(() => dailyDrop(tracks, liked, recent), [tracks, liked, recent]);
  const vibeTracks = useMemo(() => chooseVibe(tracks, vibe), [tracks, vibe]);

  const lyricLines: LyricLine[] = useMemo(
    () => parseSyncedLyrics(lyrics?.syncedLyrics ?? null),
    [lyrics]
  );

  useEffect(() => { try { localStorage.setItem("oryx:liked", JSON.stringify(liked)); } catch { /* storage unavailable */ } }, [liked]);
  useEffect(() => { try { localStorage.setItem("oryx:volume", String(volume)); } catch { /* storage unavailable */ } }, [volume]);
  useEffect(() => {
    if (!nativeVolume) return;
    let active = true;
    const sync = async () => {
      try {
        const level = await getSystemVolume();
        if (active) setVolume(level);
      } catch { if (active) setNativeVolume(false); }
    };
    void sync();
    const interval = window.setInterval(() => { if (!document.hidden) void sync(); }, 1500);
    return () => { active = false; window.clearInterval(interval); };
  }, [nativeVolume]);
  useEffect(() => { try { localStorage.setItem("oryx:playbackSpeed", String(playbackSpeed)); } catch { /* storage unavailable */ } }, [playbackSpeed]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => {
    if (sleepUntil === null) { setSleepRemaining(0); return; }
    const check = () => {
      const remaining = Math.max(0, Math.ceil((sleepUntil - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining === 0) {
        audioRef.current?.pause();
        setPlaying(false);
        setSleepUntil(null);
      }
    };
    check();
    const timer = window.setInterval(check, 1000);
    return () => window.clearInterval(timer);
  }, [sleepUntil]);
  useEffect(() => { try { localStorage.setItem("oryx:recent", JSON.stringify(recent)); } catch { /* storage unavailable */ } }, [recent]);
  useEffect(() => { try { localStorage.setItem("oryx:plays", JSON.stringify(playCounts)); } catch { /* storage unavailable */ } }, [playCounts]);
  useEffect(() => { try { localStorage.setItem("oryx:accent", accent); localStorage.setItem("oryx:motion", motion ? "on" : "off"); localStorage.setItem("oryx:displayName", displayName); } catch { /* storage unavailable */ } }, [accent, motion, displayName]);

  useEffect(() => {
    let active = true;
    setHomeBusy(true);
    setHomeError("");
    setHomeVideos([]);
    async function loadHome() {
      try {
        const videos = await searchYouTube(({ Brasil: "músicas populares brasileiras", Pop: "pop hits music", Rap: "rap hip hop hits", Eletrônica: "electronic dance music", Rock: "rock music hits" } as Record<string,string>)[discoveryGenre] || discoveryGenre);
        if (active) setHomeVideos(videos);
      } catch (cause) {
        if (active) setHomeError(cause instanceof Error ? cause.message : "Não foi possível carregar as músicas.");
      } finally {
        if (active) setHomeBusy(false);
      }
    }
    void loadHome();
    return () => { active = false; };
  }, [discoveryGenre]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = nativeVolume ? 1 : volume;
    audio.loop = repeat;
  }, [volume, repeat, nativeVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setCurrentTime(audio.currentTime || 0);
    const meta = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", meta);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", meta);
      cleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!lyricLines.length) return;
    let index = 0;
    for (let i = 0; i < lyricLines.length; i++) {
      if (lyricLines[i].time <= currentTime) index = i;
      else break;
    }
    setActiveLyric(index);
  }, [currentTime, lyricLines]);

  useEffect(() => {
    tracksRef.current = tracks;
    tracksRefLatest.current = tracks;
  }, [tracks]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      tracksRef.current.forEach(track => {
        if (track.kind === "local") URL.revokeObjectURL(track.src);
      });
    };
  }, []);

  async function playTrack(track: Track) {
    const requestId = ++playRequestRef.current;
    const audio = audioRef.current;
    if (!audio) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setError("");
    setLoading(true);
    setPlaying(false);
    setCurrent(track);
    setRecent(previous => [track.id, ...previous.filter(id => id !== track.id)].slice(0, 30));
    setLyrics(null);
    setLyricsError("");
    setLyricsTrack(track.title);
    setLyricsArtist(track.artist === "Arquivo local" || track.artist === "Streaming online" ? "" : track.artist);
    setCurrentTime(0);
    setDuration(0);

    try {
      const cleanup = await loadAudio(audio, track.src, {
        onCanPlay: () => setLoading(false),
        onWaiting: () => setLoading(true),
        onEnded: () => { setPlaying(false); setLoading(false); },
        onError: err => { setError(err.message); setLoading(false); setPlaying(false); }
      });
      if (requestId !== playRequestRef.current) { cleanup(); return; }
      cleanupRef.current = cleanup;
      await audio.play();
      if (requestId !== playRequestRef.current) { audio.pause(); return; }
      setPlaying(true);
      setLoading(false);
      setPlayCounts(previous => ({...previous, [track.id]: (previous[track.id] || 0) + 1}));
      void loadTrackLyrics(track, audio);
    } catch (cause) {
      if (requestId !== playRequestRef.current) return;
      setLoading(false);
      setError(cause instanceof Error ? cause.message : "Erro ao reproduzir.");
    }
  }

  async function loadTrackLyrics(track: Track, audio: HTMLAudioElement) {
    await searchLyrics(track.title, track.artist === "Arquivo local" || track.artist === "Streaming online" ? "" : track.artist,
      Number.isFinite(audio.duration) ? audio.duration : undefined);
  }

  async function searchLyrics(trackName = lyricsTrack, artistName = lyricsArtist, trackDuration?: number) {
    if (!trackName.trim()) {
      setLyricsError("Informe o nome da música para buscar as letras.");
      return;
    }
    setLyricsBusy(true);
    setLyricsError("");
    try {
      const result = await findLyrics(trackName.trim(), artistName.trim(), trackDuration);
      setLyrics(result);
      if (!result) setLyricsError("Nenhuma letra encontrada. Confira o título e o artista.");
    } catch (cause) {
      setLyricsError(cause instanceof Error ? cause.message : "Erro ao buscar letras.");
    } finally {
      setLyricsBusy(false);
    }
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!current) {
      if (tracks[0]) await playTrack(tracks[0]);
      return;
    }
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); }
      catch { setPlaying(false); setError("Toque em reproduzir novamente para iniciar o áudio."); }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files)
      .filter(file => file.type.startsWith("audio/"))
      .map(makeTrack);
    const existing = new Set(tracksRefLatest.current.map(track => track.id));
    const unique = accepted.filter(track => {
      if (existing.has(track.id)) { URL.revokeObjectURL(track.src); return false; }
      existing.add(track.id);
      return true;
    });
    tracksRefLatest.current = [...tracksRefLatest.current, ...unique];
    setTracks(previous => {
      const alreadyAdded = new Set(previous.map(track => track.id));
      return [...previous, ...unique.filter(track => !alreadyAdded.has(track.id))];
    });
    if (!current && unique[0]) void playTrack(unique[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function searchYouTubeTracks() {
    if (!youtubeQuery.trim()) {
      setError("Digite o nome da música para pesquisar no YouTube.");
      return;
    }
    setYoutubeBusy(true);
    setError("");
    try {
      const results = await searchYouTube(youtubeQuery.trim());
      setYoutubeResults(uniqueCatalog(results));
      if (!results.length) setError("Nenhum vídeo encontrado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro na busca do YouTube.");
    } finally {
      setYoutubeBusy(false);
    }
  }

  function openYouTubeTrack(video: YouTubeVideo) {
    // Discovery only: playback stays with the authorized platform.
    window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`, "_blank", "noopener,noreferrer");
  }

  function addUrl() {
    const value = url.trim();
    if (!/^https?:\/\//i.test(value)) {
      setError("Informe uma URL de áudio iniciada por http:// ou https://.");
      return;
    }
    let title = value.split("/").pop()?.split("?")[0] || "Stream online";
    try { title = decodeURIComponent(title); } catch { /* malformed URL escape */ }
    const track: Track = {
      id: `url-${Date.now()}`,
      title,
      artist: "Streaming online",
      src: value,
      kind: "url"
    };
    setTracks(previous => [...previous, track]);
    setUrl("");
    void playTrack(track);
  }

  function stepTrack(direction: number, automatic = false) {
    if (!tracks.length) return;
    const index = current ? tracks.findIndex(track => track.id === current.id) : -1;
    if (automatic && smartNext && !shuffle) {
      const suggestion = recommendNext(tracks, current?.id, liked, recent, smartNextMode);
      if (suggestion) { void playTrack(suggestion); return; }
    }
    const next = shuffle && tracks.length > 1
      ? (index + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length
      : (index + direction + tracks.length) % tracks.length;
    void playTrack(tracks[next]);
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !audio.seekable.length) return;
    const ranges = Array.from({ length: audio.seekable.length }, (_, index) =>
      [audio.seekable.start(index), audio.seekable.end(index)] as const);
    const target = clampSeekTime(value, audio.duration, ranges);
    if (target === null) return;
    try { audio.currentTime = target; setCurrentTime(target); }
    catch { setError("Esta fonte não permite avançar ou voltar na música."); }
  }

  function changeVolume(value: number) {
    const level = Math.max(0, Math.min(1, value));
    setVolume(level);
    if (nativeVolume) void setSystemVolume(level).catch(() => {
      setNativeVolume(false);
      setError("Controle do volume do celular indisponível; usando volume do aplicativo.");
    });
  }

  function toggleLike() {
    if (!current) return;
    setLiked(previous => previous.includes(current.id)
      ? previous.filter(id => id !== current.id)
      : [...previous, current.id]);
  }

  const isLiked = current ? liked.includes(current.id) : false;
  async function shareFavorites() {
    const text = makeShareText(tracks, liked, displayName);
    try { await navigator.clipboard.writeText(text); setStatusMessage("Playlist copiada! Compartilhe com seus amigos."); }
    catch { setStatusMessage("Não foi possível copiar. Permita acesso à área de transferência."); }
  }
  function swipeTrack(save: boolean) {
    const candidate = drops[swipeIndex % Math.max(drops.length, 1)];
    if (!candidate) return;
    if (save) setLiked(previous => previous.includes(candidate.id) ? previous : [...previous, candidate.id]);
    setSwipeIndex(previous => previous + 1);
  }

  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title, artist: current.artist, album: "OryX"
    });
    const setMediaAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
    };
    setMediaAction("play", () => { void togglePlay(); });
    setMediaAction("pause", () => { audioRef.current?.pause(); setPlaying(false); });
    setMediaAction("previoustrack", () => stepTrack(-1));
    setMediaAction("nexttrack", () => stepTrack(1));
    setMediaAction("seekto", details => {
      if (details.seekTime != null) seek(details.seekTime);
    });
    return () => {
      for (const action of ["play", "pause", "previoustrack", "nexttrack", "seekto"] as MediaSessionAction[]) {
        setMediaAction(action, null);
      }
    };
  }, [current, tracks, shuffle, repeat]);

  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  return (
    <main className={`app-shell ${motion ? "motion-on" : "motion-off"}`} style={{"--red": accent} as React.CSSProperties}>
      <audio ref={audioRef} preload="metadata" onEnded={() => { setPlaying(false); if (!repeat && tracks.length > 1) stepTrack(1, true); }} />
      <header className="topbar">
        <span className="wordmark" aria-label="OryX">Ory<span>X</span></span>
        <span className="topbar-label">MUSIC · ANDROID + WEB · 3.0</span>
        <button className="icon-button" aria-label="Abrir biblioteca"
          onClick={() => fileInputRef.current?.click()}><Plus size={21} /></button>
        <input ref={fileInputRef} type="file" accept="audio/*" multiple hidden
          onChange={event => addFiles(event.target.files)} />
      </header>

      <nav className="universe-nav" aria-label="Navegação OryX">
        <button className={section === "listen" ? "selected" : ""} onClick={() => setSection("listen")}><Music2 size={17}/> Ouvir</button>
        <button className={section === "discover" ? "selected" : ""} onClick={() => setSection("discover")}><Compass size={17}/> Explorar</button>
        <button className={section === "universe" ? "selected" : ""} onClick={() => setSection("universe")}><Sparkles size={17}/> Universe</button>
        <button className={section === "profile" ? "selected" : ""} onClick={() => setSection("profile")}><Palette size={17}/> Perfil</button>
      </nav>
      <section className="welcome">
        <div>
          <p className="eyebrow">SEU SOM. SEU MOMENTO.</p>
          <h1>Ouça do seu <span>jeito.</span></h1>
          <p className="subtext">Seus arquivos, suas playlists e descobertas em um só lugar.</p>
        </div>
        <div className="orb"><AudioLines size={35} /></div>
      </section>

      {section === "listen" && <section className="source-card">
        <div className="section-heading"><span><Music2 size={17} /> ADICIONAR MÚSICA</span></div>
        <button className="local-button" onClick={() => fileInputRef.current?.click()}>
          <FileAudio size={19} />
          <span><strong>Escolher arquivos locais</strong><small>MP3, M4A, WAV e formatos compatíveis</small></span>
          <Plus size={19} className="push" />
        </button>
        <div className="url-row">
          <input value={url} onChange={event => setUrl(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") addUrl(); }}
            placeholder="Cole a URL direta do áudio..." aria-label="URL do áudio" />
          <button onClick={addUrl} aria-label="Reproduzir URL"><Play size={18} /></button>
        </div>
        <div className="youtube-search">
          <div className="section-heading"><span><Search size={16} /> DESCOBRIR NO YOUTUBE</span></div>
          <div className="url-row">
            <input value={youtubeQuery} onChange={event => setYoutubeQuery(event.target.value)}
              onKeyDown={event => { if (event.key === "Enter") void searchYouTubeTracks(); }}
              placeholder="Nome da música ou artista..." aria-label="Buscar música no YouTube" />
            <button onClick={() => void searchYouTubeTracks()} disabled={youtubeBusy} aria-label="Buscar no YouTube">
              {youtubeBusy ? <LoaderCircle className="spin" size={18} /> : <Search size={18} />}
            </button>
          </div>
          <p className="source-note">Descubra vídeos e abra no YouTube. O OryX não extrai o áudio desses vídeos.</p>
          {youtubeResults.length > 0 && <div className="youtube-results">
            {youtubeResults.map(video => <button className="youtube-result" key={video.id}
              onClick={() => openYouTubeTrack(video)}>
              {video.thumbnail ? <img src={video.thumbnail} alt="" /> : <span className="youtube-thumb"><Music2 size={18} /></span>}
              <span><strong>{video.title}</strong><small>{video.artist}{video.duration ? ` · ${video.duration}` : ""}</small></span>
              <Play size={16} />
            </button>)}
          </div>}
        </div>
      </section>

      }
      {section === "discover" && <section className="home-card">
        <div className="section-heading"><span><ListMusic size={17} /> DESCUBRA MÚSICAS</span></div>
        <p className="source-note">Resultados para descoberta; reprodução externa no YouTube.</p>
        <div className="discovery-genres" aria-label="Gêneros musicais">
          {["Brasil", "Pop", "Rap", "Eletrônica", "Rock"].map(genre =>
            <button key={genre} className={genre === discoveryGenre ? "selected" : ""}
              onClick={() => setDiscoveryGenre(genre)}>{genre}</button>)}
        </div>
        <div className="library-actions">
          <button className={showFavorites ? "selected" : ""} onClick={() => setShowFavorites(!showFavorites)}>
            <Heart size={15} /> {showFavorites ? "Todas" : "Favoritas"}
          </button>
          <span>{homeVideos.length} músicas encontradas</span>
        </div>
        {homeBusy ? <p className="home-status"><LoaderCircle className="spin" size={16} /> Carregando músicas...</p>
          : homeError ? <p className="home-status">{homeError} Você ainda pode ouvir arquivos locais ou URLs de áudio autorizadas.</p>
          : homeVideos.length === 0 ? <p className="home-status">Nenhuma música encontrada no momento.</p>
          : <div className="home-tracks">{uniqueCatalog(homeVideos).filter(video => !showFavorites || liked.includes(`youtube-${video.id}`)).map(video =>
              <button key={video.id} className="home-track" onClick={() => openYouTubeTrack(video)} title="Abrir no YouTube">
                {video.thumbnail ? <img src={video.thumbnail} alt="" loading="lazy" /> : <span className="home-placeholder"><Music2 size={20} /></span>}
                <span className="home-track-info"><strong>{video.title}</strong><small>{video.artist}</small></span>
                <span className="home-duration">{video.duration}</span>
                {recent.includes(`youtube-${video.id}`) && <span className="recent-tag">Ouvida</span>}
                <Play size={17} />
              </button>
            )}</div>}
      </section>

      }
      {section === "universe" && <section className="universe-content">
        <section className="universe-panel"><div className="section-heading"><span><Sparkles size={17}/> ORYX FLOW + DAILY DROP</span></div>
          <p className="source-note">Descobertas baseadas na sua biblioteca. Adicione músicas para ativar sugestões reais.</p>
          {drops.length ? drops.map(track => <button className="universe-track" key={track.id} onClick={() => void playTrack(track)}><Music2 size={16}/><span>{track.title}<small>{track.artist}</small></span><Play size={16}/></button>) : <p className="source-note">Sua biblioteca ainda está vazia.</p>}
        </section>
        <section className="universe-panel"><div className="section-heading"><span><AudioLines size={17}/> VIBE ROOMS</span></div>
          <div className="chip-row">{(["energia", "calma", "madrugada", "brasil", "mundo"] as Vibe[]).map(item => <button key={item} className={vibe === item ? "selected" : ""} onClick={() => setVibe(item)}>{item}</button>)}</div>
          {vibeTracks.slice(0, 5).map(track => <button className="universe-track" key={track.id} onClick={() => void playTrack(track)}><Music2 size={16}/><span>{track.title}<small>{track.artist}</small></span><Play size={16}/></button>)}
          {!vibeTracks.length && <p className="source-note">Importe músicas para preencher esta sala.</p>}
        </section>
        <section className="universe-panel"><div className="section-heading"><span><Heart size={17}/> ORYX SWIPE</span></div>
          {drops.length ? <><p className="swipe-title">{drops[swipeIndex % drops.length]?.title}</p><p className="source-note">{drops[swipeIndex % drops.length]?.artist}</p><div className="swipe-actions"><button onClick={() => swipeTrack(false)}>⏭ Passar</button><button onClick={() => swipeTrack(true)}>❤️ Salvar</button><button onClick={() => void playTrack(drops[swipeIndex % drops.length])}>▶ Ouvir</button></div></> : <p className="source-note">Adicione músicas para começar.</p>}
        </section>
        <section className="universe-panel"><div className="section-heading"><span><Users size={17}/> FRIENDS MIX + SOCIAL</span></div>
          <p className="source-note">Compartilhe sua seleção favorita. A mistura entre contas e os perfis públicos dependem de um backend que ainda será integrado.</p>
          <button className="universe-primary" onClick={() => void shareFavorites()}>Copiar minha seleção para compartilhar</button>
          {statusMessage && <p className="source-note" role="status">{statusMessage}</p>}
        </section>
        <section className="universe-panel"><div className="section-heading"><span><Globe2 size={17}/> ORYX WORLD</span></div><p className="source-note">Explore gêneros por região. Resultados externos ficam na aba Explorar.</p>
          <div className="chip-row">{["Brasil", "Pop", "Rap", "Eletrônica", "Rock"].map(item => <button key={item} onClick={() => { setDiscoveryGenre(item); setSection("discover"); }}>{item}</button>)}</div>
        </section>
      </section>}
      {section === "profile" && <section className="universe-content">
        <section className="universe-panel"><div className="section-heading"><span><BarChart3 size={17}/> REPLAY + MEMORIES</span></div>
          <div className="replay-grid"><div><strong>{replay.totalPlays}</strong><small>reproduções iniciadas</small></div><div><strong>{liked.length}</strong><small>favoritas</small></div><div><strong>{tracks.length}</strong><small>faixas na biblioteca</small></div></div>
          <p className="source-note">Mais ouvida: {replay.topTrack?.title || "Ainda não há dados"}. Estatísticas ficam neste dispositivo.</p>
        </section>
        <section className="universe-panel"><div className="section-heading"><span><Palette size={17}/> ORYX IDENTITY</span></div>
          <label className="identity-label">Nome de exibição<input maxLength={40} value={displayName} onChange={event => setDisplayName(event.target.value)}/></label>
          <p className="source-note">Cor do OryX</p><div className="chip-row">{["#ff3038", "#ae56ff", "#28c58b", "#f2a33a", "#2f8cff"].map(color => <button key={color} aria-label={`Escolher cor ${color}`} aria-pressed={accent === color} onClick={() => setAccent(color)} style={{background: color, width: 35, height: 35, border: accent === color ? "2px solid white" : "2px solid transparent"}} />)}</div>
          <label className="identity-toggle"><input type="checkbox" checked={motion} onChange={event => setMotion(event.target.checked)}/> Motion Player: efeitos suaves</label>
          <p className="source-note">Perfil local. Sincronização entre dispositivos e autenticação serão adicionadas quando houver backend configurado.</p>
        </section>
        <section className="universe-panel"><div className="section-heading"><span>BACKUP + PRIVACIDADE</span></div>
          <p className="source-note">Exporte suas preferências, favoritas e estatísticas para um arquivo JSON. Arquivos de áudio não são incluídos.</p>
          <div className="chip-row">
            <button type="button" onClick={() => {
              const data = createBackup({profile:{displayName,accent,motion},favorites:liked,recent,playCounts});
              const link = document.createElement("a");
              const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
              link.href = objectUrl; link.download = "oryx-backup.json"; link.click();
              window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
              setStatusMessage("Backup exportado. Guarde o arquivo em local seguro.");
            }}>Exportar backup</button>
            <button type="button" onClick={() => backupInputRef.current?.click()}>Restaurar backup</button>
            <input ref={backupInputRef} type="file" accept=".json,application/json" hidden onChange={async event => {
              const file = event.target.files?.[0]; event.target.value = "";
              if (!file) return;
              try {
                if (file.size > 2_000_000) throw new Error("Arquivo muito grande.");
                const restored = parseBackup(await file.text());
                setDisplayName(restored.profile.displayName); setAccent(restored.profile.accent);
                setMotion(restored.profile.motion); setLiked(restored.favorites);
                setRecent(restored.recent); setPlayCounts(restored.playCounts);
                setStatusMessage("Backup restaurado neste dispositivo.");
              } catch (err) { setStatusMessage(err instanceof Error ? err.message : "Erro ao restaurar backup."); }
            }}/>
          </div>
          <p className="source-note" role="status">{statusMessage}</p>
        </section>
        <section className="universe-panel"><div className="section-heading"><span><HeartHandshake size={17}/> ORYX SUPPORT</span></div><p className="source-note">OryX gratuito e sem anúncios. Doações voluntárias serão habilitadas após definir um provedor de pagamento e verificar as regras da loja.</p></section>
      </section>}
      {section === "listen" && <section className="player-card">
        <div className="cover">
          <div className="cover-glow" />
          <Disc3 size={86} strokeWidth={1.1} />
          <span>ORYX</span>
        </div>
        <div className="track-info">
          <div className="track-copy">
            <p className="eyebrow">TOCANDO AGORA</p>
            <h2>{current?.title ?? "Escolha uma música"}</h2>
            <p>{current?.artist ?? "Sua biblioteca está esperando"}</p>
          </div>
          <button className={`like-button ${isLiked ? "liked" : ""}`} onClick={toggleLike}
            aria-label="Favoritar música" disabled={!current}><Heart size={21} fill={isLiked ? "currentColor" : "none"} /></button>
        </div>
        <div className="timeline">
          <input type="range" min={0} max={Number.isFinite(duration) && duration > 0 ? duration : 1} step={0.1}
            disabled={!Number.isFinite(duration) || duration <= 0}
            value={Math.min(currentTime, Number.isFinite(duration) && duration > 0 ? duration : 1)}
            onChange={event => seek(Number(event.target.value))} aria-label="Arrastar para qualquer trecho da música" />
          <div className="time-labels"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
        </div>
        <div className="seek-shortcuts">
          <button type="button" disabled={!current || !Number.isFinite(duration) || duration <= 0} onClick={() => seek(currentTime - 10)} aria-label="Voltar 10 segundos">↶ 10s</button>
          <button type="button" disabled={!current || !Number.isFinite(duration) || duration <= 0} onClick={() => seek(currentTime + 10)} aria-label="Avançar 10 segundos">10s ↷</button>
        </div>
        <div className="controls">
          <button className={`control-muted ${shuffle ? "active-mode" : ""}`} onClick={() => setShuffle(!shuffle)} aria-label="Aleatório" aria-pressed={shuffle}><Shuffle size={19}/></button>
          <button className="control-muted" onClick={() => stepTrack(-1)} aria-label="Anterior"><SkipBack /></button>
          <button className="play-button" onClick={() => void togglePlay()} aria-label={playing ? "Pausar" : "Reproduzir"}>
            {loading ? <LoaderCircle className="spin" /> : playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <button className="control-muted" onClick={() => stepTrack(1)} aria-label="Próxima"><SkipForward /></button>
          <button className={`control-muted ${repeat ? "active-mode" : ""}`} onClick={() => setRepeat(!repeat)} aria-label="Repetir faixa" aria-pressed={repeat}><span style={{fontWeight:800}}>↻</span></button>
        </div>
        <div className="volume-row"><Volume2 size={16} /><input type="range" min={0} max={1} step={0.01}
          value={volume} onChange={event => changeVolume(Number(event.target.value))} aria-label={nativeVolume ? "Volume do celular" : "Volume do aplicativo"} /></div>
        <p className="source-note">{nativeVolume ? "Volume sincronizado com a mídia do Android." : "No navegador, o volume controla somente o OryX. No Android, o controle do celular requer a integração nativa."}</p>
        <div className="playback-extras" aria-label="Opções de reprodução">
          <label>Velocidade <select value={playbackSpeed} onChange={event => setPlaybackSpeed(Number(event.target.value))} aria-label="Velocidade de reprodução">
            {[0.75, 1, 1.25, 1.5, 2].map(speed => <option key={speed} value={speed}>{speed}×</option>)}
          </select></label>
          <label>Desligar após <select value={sleepUntil === null ? "off" : "active"} onChange={event => {
            const minutes = Number(event.target.value);
            setSleepUntil(Number.isFinite(minutes) && minutes > 0 ? Date.now() + minutes * 60000 : null);
          }} aria-label="Temporizador para dormir">
            <option value="off">Desativado</option>
            {sleepUntil !== null && <option value="active">Ativo ({Math.ceil(sleepRemaining / 60)} min)</option>}
            <option value="15">15 minutos</option><option value="30">30 minutos</option>
            <option value="45">45 minutos</option><option value="60">60 minutos</option>
          </select></label>
          {sleepUntil !== null && <button type="button" onClick={() => setSleepUntil(null)}>Cancelar timer</button>}
        </div>
        {error && <p className="error-message"><X size={14} /> {error}</p>}
      </section>

      }
      {section === "listen" && <section className="lower-card">
        <div className="tabs">
          <button className={tab === "lyrics" ? "active" : ""} onClick={() => setTab("lyrics")}><AudioLines size={16} /> LETRAS</button>
          <label style={{display:"inline-flex", alignItems:"center", gap:6, fontSize:12}} title="Sugestão automática ao terminar a faixa">
            <input type="checkbox" checked={smartNext} onChange={event => setSmartNext(event.target.checked)} /> Smart Next
          </label>
          <select aria-label="Modo de recomendação" value={smartNextMode} disabled={!smartNext} onChange={event => setSmartNextMode(event.target.value as SmartNextMode)}>
            <option value="familiar">Meu gosto</option><option value="balanced">Equilibrado</option><option value="explore">Explorar</option>
          </select>
          <button className={tab === "queue" ? "active" : ""} onClick={() => setTab("queue")}><ListMusic size={16} /> FILA ({tracks.length})</button>
        </div>
        {tab === "lyrics" ? (
          <div className="lyrics-panel">
            <div className="lyrics-search">
              <input value={lyricsTrack} onChange={event => setLyricsTrack(event.target.value)}
                placeholder="Nome da música" aria-label="Nome da música" />
              <input value={lyricsArtist} onChange={event => setLyricsArtist(event.target.value)}
                placeholder="Artista (opcional)" aria-label="Artista" />
              <button onClick={() => void searchLyrics()} disabled={lyricsBusy} aria-label="Buscar letras">
                {lyricsBusy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}
              </button>
            </div>
            {lyricsBusy ? <div className="empty-state"><LoaderCircle className="spin" /> Buscando letras no LRCLIB...</div>
              : lyricLines.length ? <div className="lyric-lines">
                {lyricLines.map((line, index) => <p key={`${line.time}-${index}`}
                  className={index === activeLyric ? "current-line" : ""}
                  onClick={() => seek(line.time)}>{line.text || "♪"}</p>)}
              </div>
              : lyrics?.plainLyrics ? <p className="plain-lyrics">{lyrics.plainLyrics}</p>
              : <div className="empty-state"><AudioLines size={28} />
                <strong>{lyricsError || "As letras aparecerão aqui"}</strong>
                <span>Reproduza uma faixa para procurar letras sincronizadas.</span>
              </div>}
          </div>
        ) : (
          <div className="queue-list">
            <div className="url-row">
              <input type="search" value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} placeholder="Buscar título, artista ou álbum" aria-label="Buscar na biblioteca" />
              <button type="button" className={libraryFavoritesOnly ? "selected" : ""} aria-pressed={libraryFavoritesOnly} onClick={() => setLibraryFavoritesOnly(value => !value)} aria-label="Filtrar somente favoritas"><Heart size={17}/></button>
            </div>
            {tracks.length === 0 ? <div className="empty-state"><Music2 size={28} /><strong>Nenhuma música adicionada</strong><span>Adicione arquivos ou uma URL acima.</span></div>
              : searchLibrary(tracks, libraryQuery, liked, libraryFavoritesOnly).length === 0 ? <div className="empty-state"><Search size={24}/><strong>Nenhuma música encontrada</strong><span>Tente outro nome ou desative o filtro de favoritas.</span></div>
              : searchLibrary(tracks, libraryQuery, liked, libraryFavoritesOnly).map(track => <button className={`queue-item ${current?.id === track.id ? "selected" : ""}`}
                key={track.id} onClick={() => void playTrack(track)}>
                <span className="queue-icon"><Music2 size={17} /></span>
                <span className="queue-copy"><strong>{track.title}</strong><small>{track.artist}</small></span>
                {current?.id === track.id && playing ? <AudioLines size={18} className="red-icon" /> : <Play size={16} />}
              </button>)}
          </div>
        )}
      </section>
      }
      <footer><span>ORY<span className="red">X</span></span><small>FEITO PARA SENTIR A MÚSICA.</small></footer>
    </main>
  );
}
