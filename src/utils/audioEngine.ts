// Playful Web Audio FX + Consistent Gentle Female Teacher Voice Engine
// Layer 1: Gemini Female TTS (Kore) / Server Neural Female Bangla & English TTS (cached)
// Layer 2: AudioContext + HTMLAudioElement dual playback with slow teacher cadence
// Layer 3: Hardened offline Browser Speech fallback

type SpeakingListener = (isSpeaking: boolean) => void;
type StatusListener = (usingFallback: boolean) => void;

export interface SpeakOptions {
  intro?: boolean | string;
  mode?: 'story' | 'standard';
}

export const FRIENDLY_INTRO_BN = 'এসো শিখি!';

interface AudioClip {
  base64: string;
  mimeType: string;
  bytes: ArrayBuffer;
}

interface CachedBundle {
  clips: AudioClip[];
  playbackRate: number;
}

const clientAudioBundleCache = new Map<string, CachedBundle>();
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let speakRequestId = 0;
let networkCooldownUntil = 0;
let fallbackDispatchTimerId: number | null = null;
let fallbackSegmentPauseTimerId: number | null = null;
let speakingSafetyTimerId: number | null = null;
let activeFallbackResolve: (() => void) | null = null;

const speakingListeners = new Set<SpeakingListener>();
const statusListeners = new Set<StatusListener>();

function notifySpeaking(active: boolean) {
  speakingListeners.forEach((cb) => cb(active));
}

function notifyFallback(isFallback: boolean) {
  statusListeners.forEach((cb) => cb(isFallback));
}

export function subscribeSpeaking(cb: SpeakingListener): () => void {
  speakingListeners.add(cb);
  return () => {
    speakingListeners.delete(cb);
  };
}

export function subscribeVoiceStatus(cb: StatusListener): () => void {
  statusListeners.add(cb);
  return () => {
    statusListeners.delete(cb);
  };
}

export function withFriendlyIntro(
  text: string,
  introPhrase: string = FRIENDLY_INTRO_BN
): string {
  const trimmed = text.trim();
  if (!trimmed) return introPhrase;
  if (/^(এসো\s*শিখি|চলো\s*শিখি|এসো\s*গুনি)/i.test(trimmed)) {
    return trimmed;
  }
  return `${introPhrase} ${trimmed}`;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });

  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.14,
  delay = 0,
  slideToFreq?: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideToFreq) {
    osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
  }
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playPop() {
  playTone(420, 0.09, 'sine', 0.14, 0, 680);
}

export function playBubblePop() {
  playTone(540, 0.07, 'sine', 0.16, 0, 960);
  playTone(760, 0.08, 'triangle', 0.1, 0.04, 1120);
}

export function playCountTick(step = 1) {
  const base = 360 + Math.min(step, 15) * 28;
  playTone(base, 0.1, 'triangle', 0.14, 0, base * 1.15);
}

export function playSuccessChime() {
  playTone(523.25, 0.14, 'triangle', 0.16, 0);
  playTone(659.25, 0.14, 'triangle', 0.16, 0.09);
  playTone(783.99, 0.22, 'triangle', 0.18, 0.18);
  playTone(1046.5, 0.32, 'sine', 0.14, 0.28);
}

export function playSoftTryAgain() {
  playTone(340, 0.15, 'sine', 0.11, 0, 290);
  playTone(290, 0.18, 'sine', 0.09, 0.13, 250);
}

export function playCelebrationFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((n, idx) => {
    playTone(n, 0.24, 'triangle', 0.15, idx * 0.09);
  });
}

function clearSpeechTimers() {
  if (fallbackDispatchTimerId !== null) {
    window.clearTimeout(fallbackDispatchTimerId);
    fallbackDispatchTimerId = null;
  }
  if (fallbackSegmentPauseTimerId !== null) {
    window.clearTimeout(fallbackSegmentPauseTimerId);
    fallbackSegmentPauseTimerId = null;
  }
  if (speakingSafetyTimerId !== null) {
    window.clearTimeout(speakingSafetyTimerId);
    speakingSafetyTimerId = null;
  }
  if (activeFallbackResolve) {
    const fn = activeFallbackResolve;
    activeFallbackResolve = null;
    fn();
  }
}

export function stopSpeaking() {
  speakRequestId += 1;
  clearSpeechTimers();
  if (activeSourceNode) {
    try {
      activeSourceNode.onended = null;
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // Ignore already stopped
    }
    activeSourceNode = null;
  }
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.onended = null;
      activeHtmlAudio.onerror = null;
      activeHtmlAudio.pause();
      activeHtmlAudio.src = '';
    } catch {
      // Ignore cleanup error
    }
    activeHtmlAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  notifySpeaking(false);
}

const MALE_VOICE_EXCLUDE_REGEX =
  /\b(male|man|boy|david|mark|daniel|george|james|richard|rishi|pradeep|hemant|bashkar|puck|charon|fenrir|alex|fred|tom|oliver|arthur|ryan|guy|christopher|eric|roger|steffan|andrew|brian|aaron|albert|bruce|junior|ralph|reed|rocko|sandy)\b/i;

const FEMALE_PRIORITY_BN = [
  'google বাংলা',
  'microsoft nabanita',
  'microsoft tanisha',
  'nabanita',
  'tanisha',
  'kalpana',
  'lekha',
  'google',
  'female',
  'woman',
  'natural',
];

const FEMALE_PRIORITY_EN = [
  'google uk english female',
  'microsoft aria',
  'microsoft jenny',
  'samantha',
  'victoria',
  'karen',
  'microsoft zira',
  'ava',
  'emma',
  'moira',
  'tessa',
  'google us english',
  'female',
  'woman',
  'natural',
];

function pickSweetFemaleVoice(
  voices: SpeechSynthesisVoice[],
  lang: 'bn' | 'en'
): SpeechSynthesisVoice | undefined {
  const prefix = lang === 'bn' ? 'bn' : 'en';
  const langVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(prefix)
  );
  if (langVoices.length === 0) return undefined;

  const nonMaleVoices = langVoices.filter(
    (v) => !MALE_VOICE_EXCLUDE_REGEX.test(v.name)
  );
  const pool = nonMaleVoices.length > 0 ? nonMaleVoices : langVoices;
  const priorities = lang === 'bn' ? FEMALE_PRIORITY_BN : FEMALE_PRIORITY_EN;

  let bestVoice = pool[0];
  let bestScore = -1;

  for (const voice of pool) {
    const lower = voice.name.toLowerCase();
    let score = 0;
    for (let i = 0; i < priorities.length; i++) {
      if (lower.includes(priorities[i])) {
        score += (priorities.length - i) * 10;
      }
    }
    if (lang === 'bn' && voice.lang.toLowerCase() === 'bn-bd') score += 5;
    if (lang === 'en' && /en-(us|gb)/i.test(voice.lang)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

interface SpeechSegment {
  text: string;
  lang: 'bn' | 'en';
}

function splitIntoLanguageSegments(
  text: string,
  defaultLang: 'bn' | 'en'
): SpeechSegment[] {
  const rawParts = text
    .split(/(?<=[!।?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParts.length === 0) {
    return [{ text, lang: defaultLang }];
  }

  const segments: SpeechSegment[] = [];
  for (const part of rawParts) {
    const hasBengali = /[\u0980-\u09FF]/.test(part);
    const hasLatin = /[A-Za-z]/.test(part);
    const segLang: 'bn' | 'en' = hasBengali
      ? 'bn'
      : hasLatin
      ? 'en'
      : defaultLang;

    const prev = segments[segments.length - 1];
    if (prev && prev.lang === segLang) {
      prev.text = `${prev.text} ${part}`;
    } else {
      segments.push({ text: part, lang: segLang });
    }
  }

  return segments;
}

function speakWithBrowserFallback(
  text: string,
  lang: 'bn' | 'en',
  reqId: number,
  lockLanguage = false,
  keepSpeakingOpen = false
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    notifySpeaking(false);
    return Promise.resolve();
  }

  clearSpeechTimers();
  const estimatedDurationMs = Math.max(3000, Math.min(180_000, text.length * 140));

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (activeFallbackResolve === finish) activeFallbackResolve = null;
      if (speakingSafetyTimerId !== null) {
        window.clearTimeout(speakingSafetyTimerId);
        speakingSafetyTimerId = null;
      }
      if (!keepSpeakingOpen && reqId === speakRequestId) notifySpeaking(false);
      resolve();
    };
    activeFallbackResolve = finish;

    try {
      window.speechSynthesis.cancel();
      notifySpeaking(true);

      speakingSafetyTimerId = window.setTimeout(finish, estimatedDurationMs);

      const segments = lockLanguage
        ? [{ text, lang }]
        : splitIntoLanguageSegments(text, lang);

      fallbackDispatchTimerId = window.setTimeout(() => {
        if (reqId !== speakRequestId) {
          finish();
          return;
        }

        const speakSegmentAt = (idx: number) => {
          if (reqId !== speakRequestId) {
            finish();
            return;
          }
          const seg = segments[idx];
          if (!seg) {
            finish();
            return;
          }

          const utter = new SpeechSynthesisUtterance(seg.text);
          utter.lang = seg.lang === 'bn' ? 'bn-BD' : 'en-US';
          utter.rate = 0.72;
          utter.pitch = 1.12;
          utter.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const matched = pickSweetFemaleVoice(voices, seg.lang);
          if (matched) {
            utter.voice = matched;
          }

          utter.onstart = () => {
            if (reqId === speakRequestId) notifySpeaking(true);
          };

          utter.onend = () => {
            if (reqId !== speakRequestId) {
              finish();
              return;
            }
            if (idx + 1 < segments.length) {
              fallbackSegmentPauseTimerId = window.setTimeout(() => {
                speakSegmentAt(idx + 1);
              }, 130);
            } else {
              finish();
            }
          };

          utter.onerror = () => {
            if (reqId !== speakRequestId) {
              finish();
              return;
            }
            if (idx + 1 < segments.length) {
              speakSegmentAt(idx + 1);
            } else {
              finish();
            }
          };

          window.speechSynthesis.speak(utter);
        };

        speakSegmentAt(0);
      }, 30);
    } catch {
      clearSpeechTimers();
      finish();
    }
  });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return bytes.buffer;
}

async function playSingleClipViaAudioContext(
  clip: AudioClip,
  playbackRate: number,
  reqId: number
): Promise<boolean> {
  if (reqId !== speakRequestId) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await Promise.race([
        ctx.resume().catch(() => {}),
        new Promise<void>((resolve) => window.setTimeout(resolve, 250)),
      ]);
      if ((ctx.state as AudioContextState) !== 'running') {
        return false;
      }
    }
    if (reqId !== speakRequestId) return false;

    const decoded = await ctx.decodeAudioData(clip.bytes.slice(0));
    if (reqId !== speakRequestId) return false;

    return await new Promise<boolean>((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.playbackRate.value = playbackRate;
      source.connect(ctx.destination);
      activeSourceNode = source;

      source.onended = () => {
        if (activeSourceNode === source) {
          activeSourceNode = null;
        }
        resolve(reqId === speakRequestId);
      };
      source.start(0);
    });
  } catch {
    return false;
  }
}

async function playSingleClipViaHtmlAudio(
  clip: AudioClip,
  playbackRate: number,
  reqId: number
): Promise<boolean> {
  if (typeof Audio === 'undefined' || reqId !== speakRequestId) return false;
  return await new Promise<boolean>((resolve) => {
    try {
      const audio = new Audio(`data:${clip.mimeType};base64,${clip.base64}`);
      audio.playbackRate = playbackRate;
      (audio as unknown as { preservesPitch?: boolean }).preservesPitch = true;
      activeHtmlAudio = audio;

      const finish = (ok: boolean) => {
        if (activeHtmlAudio === audio) {
          activeHtmlAudio = null;
        }
        resolve(ok && reqId === speakRequestId);
      };

      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.onpause = () => {
        if (reqId !== speakRequestId) finish(false);
      };
      audio
        .play()
        .catch(() => finish(false));
    } catch {
      resolve(false);
    }
  });
}

async function playBundle(
  bundle: CachedBundle,
  reqId: number,
  keepSpeakingOpen = false
): Promise<boolean> {
  if (reqId !== speakRequestId || bundle.clips.length === 0) return true;

  notifySpeaking(true);
  for (let i = 0; i < bundle.clips.length; i++) {
    if (reqId !== speakRequestId) return true;
    const clip = bundle.clips[i];
    // When slowing down Google TTS (playbackRate !== 1), prefer HTMLAudioElement with
    // preservesPitch=true so the sweet female tone is preserved without pitch drop.
    let played = false;
    if (bundle.playbackRate !== 1) {
      played = await playSingleClipViaHtmlAudio(clip, bundle.playbackRate, reqId);
      if (!played && reqId === speakRequestId) {
        played = await playSingleClipViaAudioContext(clip, bundle.playbackRate, reqId);
      }
    } else {
      played = await playSingleClipViaAudioContext(clip, bundle.playbackRate, reqId);
      if (!played && reqId === speakRequestId) {
        played = await playSingleClipViaHtmlAudio(clip, bundle.playbackRate, reqId);
      }
    }
    if (!played) {
      return reqId !== speakRequestId;
    }
  }

  if (!keepSpeakingOpen && reqId === speakRequestId) {
    notifySpeaking(false);
  }
  return true;
}

function splitLongSpeechChunks(text: string, maxChars = 215): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return [clean];

  const sentences = clean
    .split(/(?<=[।!?\.])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushOversized = (piece: string) => {
    if (piece.length <= maxChars) {
      chunks.push(piece);
      return;
    }
    const subParts = piece.split(/(?<=[,;:\u2014-])\s+/).filter(Boolean);
    let subCurrent = '';
    for (const sp of subParts) {
      if (subCurrent && subCurrent.length + 1 + sp.length > maxChars) {
        chunks.push(subCurrent);
        subCurrent = sp;
      } else {
        subCurrent = subCurrent ? `${subCurrent} ${sp}` : sp;
      }
    }
    if (subCurrent) {
      if (subCurrent.length <= maxChars) {
        chunks.push(subCurrent);
      } else {
        const words = subCurrent.split(/\s+/);
        let buf = '';
        for (const w of words) {
          if (buf && buf.length + 1 + w.length > maxChars) {
            chunks.push(buf);
            buf = w;
          } else {
            buf = buf ? `${buf} ${w}` : w;
          }
        }
        if (buf) chunks.push(buf);
      }
    }
  };

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      pushOversized(sentence);
    } else if (current && current.length + 1 + sentence.length > maxChars) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [clean];
}

const inflightAudioFetches = new Map<string, Promise<CachedBundle | null>>();

function buildAudioCacheKey(
  spokenPayload: string,
  lang: 'bn' | 'en',
  mode: 'story' | 'standard'
): string {
  return `v4:${lang}:${mode}:Kore:${spokenPayload}`;
}

async function fetchAudioBundle(
  spokenPayload: string,
  lang: 'bn' | 'en',
  mode: 'story' | 'standard'
): Promise<CachedBundle | null> {
  const cacheKey = buildAudioCacheKey(spokenPayload, lang, mode);
  const existing = clientAudioBundleCache.get(cacheKey);
  if (existing) return existing;

  const inflight = inflightAudioFetches.get(cacheKey);
  if (inflight) return inflight;

  const task = (async (): Promise<CachedBundle | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 18_000);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenPayload,
            lang,
            voice: 'Kore',
            mode,
          }),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);

        if (!res.ok) {
          if (attempt === 0) {
            await new Promise((r) => window.setTimeout(r, 250));
            continue;
          }
          networkCooldownUntil = Date.now() + 15_000;
          return null;
        }

        const data = (await res.json()) as {
          audioBase64?: string;
          mimeType?: string;
          audioClips?: Array<{ audioBase64: string; mimeType: string; lang: 'bn' | 'en' }>;
          playbackRate?: number;
          fallback?: boolean;
          retryAfterSec?: number;
        };

        const rawClips: Array<{ audioBase64: string; mimeType: string }> =
          Array.isArray(data.audioClips) && data.audioClips.length > 0
            ? data.audioClips
            : data.audioBase64
            ? [{ audioBase64: data.audioBase64, mimeType: data.mimeType ?? 'audio/wav' }]
            : [];

        if (data.fallback || rawClips.length === 0) {
          networkCooldownUntil =
            Date.now() + Math.min((data.retryAfterSec ?? 20) * 1000, 30_000);
          return null;
        }

        const bundle: CachedBundle = {
          clips: rawClips.map((c) => ({
            base64: c.audioBase64,
            mimeType: c.mimeType,
            bytes: base64ToArrayBuffer(c.audioBase64),
          })),
          playbackRate: typeof data.playbackRate === 'number' ? data.playbackRate : 1,
        };

        clientAudioBundleCache.set(cacheKey, bundle);
        return bundle;
      } catch {
        if (attempt === 0) {
          await new Promise((r) => window.setTimeout(r, 250));
          continue;
        }
        networkCooldownUntil = Date.now() + 15_000;
        return null;
      }
    }
    return null;
  })().finally(() => {
    inflightAudioFetches.delete(cacheKey);
  });

  inflightAudioFetches.set(cacheKey, task);
  return task;
}

export function prefetchSpeech(
  text: string,
  lang: 'bn' | 'en' = 'bn',
  mode: 'story' | 'standard' = 'story'
): void {
  const clean = text.trim();
  if (!clean || Date.now() < networkCooldownUntil) return;
  const chunks = splitLongSpeechChunks(clean, 215);
  // Pre-warm first chunk of upcoming scene in the background for gapless storytelling
  if (chunks[0]) {
    void fetchAudioBundle(chunks[0], lang, mode);
  }
}

export async function speakText(
  text: string,
  lang: 'bn' | 'en' = 'bn',
  enabled = true,
  options?: SpeakOptions
): Promise<void> {
  if (!enabled || !text.trim()) return;

  const mode = options?.mode ?? 'standard';
  const spokenPayload = options?.intro
    ? withFriendlyIntro(
        text,
        typeof options.intro === 'string' ? options.intro : FRIENDLY_INTRO_BN
      )
    : text.trim();

  // Synchronously resume AudioContext during user gesture so async playback works cleanly
  getAudioContext();

  stopSpeaking();
  const currentReqId = speakRequestId;

  const chunks = splitLongSpeechChunks(spokenPayload, 215);
  let sessionLockedToFallback = Date.now() < networkCooldownUntil;

  for (let i = 0; i < chunks.length; i++) {
    if (currentReqId !== speakRequestId) return;
    const isLastChunk = i === chunks.length - 1;
    const chunkText = chunks[i];

    // Pre-fetch the next chunk concurrently while the current chunk plays
    if (!sessionLockedToFallback && i + 1 < chunks.length) {
      void fetchAudioBundle(chunks[i + 1], lang, mode);
    }

    if (sessionLockedToFallback) {
      notifyFallback(true);
      await speakWithBrowserFallback(
        chunkText,
        lang,
        currentReqId,
        mode === 'story',
        !isLastChunk
      );
      continue;
    }

    const bundle = await fetchAudioBundle(chunkText, lang, mode);
    if (currentReqId !== speakRequestId) return;

    if (!bundle) {
      // Lock fallback for the rest of this narration so the voice stays consistent
      sessionLockedToFallback = true;
      notifyFallback(true);
      await speakWithBrowserFallback(
        chunkText,
        lang,
        currentReqId,
        mode === 'story',
        !isLastChunk
      );
      continue;
    }

    notifyFallback(false);
    const playedOk = await playBundle(bundle, currentReqId, !isLastChunk);
    if (!playedOk && currentReqId === speakRequestId) {
      sessionLockedToFallback = true;
      notifyFallback(true);
      await speakWithBrowserFallback(
        chunkText,
        lang,
        currentReqId,
        mode === 'story',
        !isLastChunk
      );
    }
  }

  if (currentReqId === speakRequestId) {
    notifySpeaking(false);
  }
}
