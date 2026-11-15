export type AudioSource =
  | string
  | Blob
  | ArrayBuffer
  | ReadableStream<Uint8Array>;

export type AudioCallbacks = {
  onCanPlay?: () => void;
  onError?: (error: Error) => void;
  onWaiting?: () => void;
  onEnded?: () => void;
};

/**
 * Loads a URL, Blob, ArrayBuffer, or ReadableStream into an HTMLAudioElement.
 * For a ReadableStream, Media Source Extensions are used; the MIME type must
 * be supported by the current browser/WebView.
 */
export async function loadAudio(
  audio: HTMLAudioElement,
  source: AudioSource,
  callbacks: AudioCallbacks = {},
  mimeType = 'audio/mpeg'
): Promise<() => void> {
  let objectUrl: string | undefined;
  let disposed = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  const onCanPlay = () => { if (!disposed) callbacks.onCanPlay?.(); };
  const onWaiting = () => { if (!disposed) callbacks.onWaiting?.(); };
  const onEnded = () => { if (!disposed) callbacks.onEnded?.(); };
  const onError = () => {
    if (!disposed) callbacks.onError?.(
      new Error(audio.error?.message || 'Não foi possível reproduzir este áudio.')
    );
  };

  audio.addEventListener('canplay', onCanPlay);
  audio.addEventListener('waiting', onWaiting);
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', onError);

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    audio.pause();
    audio.removeEventListener('canplay', onCanPlay);
    audio.removeEventListener('waiting', onWaiting);
    audio.removeEventListener('ended', onEnded);
    audio.removeEventListener('error', onError);
    if (reader) void reader.cancel().catch(() => undefined);
    audio.removeAttribute('src');
    audio.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };

  try {
    if (typeof source === 'string') {
      audio.src = source;
    } else if (source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      audio.src = objectUrl;
    } else if (source instanceof ArrayBuffer) {
      objectUrl = URL.createObjectURL(new Blob([source], { type: mimeType }));
      audio.src = objectUrl;
    } else {
      if (!('MediaSource' in window) || !MediaSource.isTypeSupported(mimeType)) {
        throw new Error(`MediaSource não suporta o formato: ${mimeType}`);
      }

      const mediaSource = new MediaSource();
      objectUrl = URL.createObjectURL(mediaSource);
      audio.src = objectUrl;
      audio.load();

      await new Promise<void>((resolve, reject) => {
        const onOpen = () => resolve();
        const onSourceError = () => reject(new Error('Falha ao abrir MediaSource.'));
        mediaSource.addEventListener('sourceopen', onOpen, { once: true });
        mediaSource.addEventListener('sourceended', onSourceError, { once: true });
      });

      const buffer = mediaSource.addSourceBuffer(mimeType);
      reader = source.getReader();

      const appendChunk = (chunk: Uint8Array) => new Promise<void>((resolve, reject) => {
        const finish = () => {
          buffer.removeEventListener('error', fail);
          resolve();
        };
        const fail = () => {
          buffer.removeEventListener('updateend', finish);
          reject(new Error('Falha ao adicionar dados ao buffer de áudio.'));
        };
        buffer.addEventListener('updateend', finish, { once: true });
        buffer.addEventListener('error', fail, { once: true });
        // Copy to a standalone ArrayBuffer to satisfy SourceBuffer typings.
        const copy = new Uint8Array(chunk.byteLength);
        copy.set(chunk);
        buffer.appendBuffer(copy.buffer);
      });

      while (!disposed) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value?.byteLength) await appendChunk(value);
      }
      if (!disposed && mediaSource.readyState === 'open') mediaSource.endOfStream();
    }

    audio.load();
    return cleanup;
  } catch (cause) {
    cleanup();
    const error = cause instanceof Error ? cause : new Error(String(cause));
    callbacks.onError?.(error);
    throw error;
  }
}
