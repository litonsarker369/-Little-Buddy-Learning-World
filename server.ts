import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '2mb' }));

// In-memory + persistent disk audio cache so repeated taps never burn API quota
interface CachedAudioEntry {
  base64: string;
  mimeType: 'audio/wav' | 'audio/mpeg';
}

const ttsCache = new Map<string, CachedAudioEntry>();
const MAX_CACHE_ENTRIES = 600;
const DISK_CACHE_DIR = path.resolve(__dirname, '.tts-cache');

try {
  fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
} catch {
  // Ignore if read-only filesystem
}

function getCacheFilePath(cacheKey: string, ext: 'wav' | 'mp3'): string {
  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex');
  return path.join(DISK_CACHE_DIR, `${hash}.${ext}`);
}

function readCachedAudio(cacheKey: string): CachedAudioEntry | null {
  const mem = ttsCache.get(cacheKey);
  if (mem) return mem;
  try {
    const mp3Path = getCacheFilePath(cacheKey, 'mp3');
    if (fs.existsSync(mp3Path)) {
      const base64 = fs.readFileSync(mp3Path).toString('base64');
      if (base64) {
        const entry: CachedAudioEntry = { base64, mimeType: 'audio/mpeg' };
        ttsCache.set(cacheKey, entry);
        return entry;
      }
    }
    const wavPath = getCacheFilePath(cacheKey, 'wav');
    if (fs.existsSync(wavPath)) {
      const base64 = fs.readFileSync(wavPath).toString('base64');
      if (base64) {
        const entry: CachedAudioEntry = { base64, mimeType: 'audio/wav' };
        ttsCache.set(cacheKey, entry);
        return entry;
      }
    }
  } catch {
    // Ignore disk cache read error
  }
  return null;
}

function writeCachedAudio(
  cacheKey: string,
  base64Audio: string,
  mimeType: 'audio/wav' | 'audio/mpeg'
): void {
  if (ttsCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ttsCache.keys().next().value;
    if (oldestKey) ttsCache.delete(oldestKey);
  }
  ttsCache.set(cacheKey, { base64: base64Audio, mimeType });
  try {
    const ext = mimeType === 'audio/mpeg' ? 'mp3' : 'wav';
    const filePath = getCacheFilePath(cacheKey, ext);
    fs.writeFileSync(filePath, Buffer.from(base64Audio, 'base64'));
  } catch {
    // Ignore disk cache write error
  }
}

// Cooldown tracking to avoid hammering Gemini TTS after 429 quota exhaustion
let ttsQuotaCooldownUntil = 0;
let lastCooldownWarnAt = 0;

function parseRetryDelayMs(errMsg: string): number {
  const secMatch = errMsg.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i);
  if (secMatch) {
    return Math.min(Math.max(Number(secMatch[1]) * 1000, 30_000), 3_600_000);
  }
  const inMatch = errMsg.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (inMatch) {
    return Math.min(Math.max(Math.ceil(Number(inMatch[1]) * 1000), 30_000), 3_600_000);
  }
  return 120_000;
}

function normalizeTextForSpeech(text: string): string {
  // Replace Bengali hyphenated '-তে' (e.g. 'অ-তে') with space ('অ তে') for natural clear pronunciation
  return text.replace(/([\u0980-\u09FF])-তে/g, '$1 তে').trim();
}

interface TtsSegment {
  text: string;
  lang: 'bn' | 'en';
}

function chunkSegmentText(text: string, maxLen = 175): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let splitIdx = remaining.lastIndexOf(',', maxLen);
    if (splitIdx < 40) splitIdx = remaining.lastIndexOf(' ', maxLen);
    if (splitIdx < 20) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx + 1).trim());
    remaining = remaining.slice(splitIdx + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function splitTtsSegments(
  text: string,
  defaultLang: 'bn' | 'en',
  lockLanguage = false
): TtsSegment[] {
  const sentences = text
    .split(/(?<=[!।?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [{ text, lang: defaultLang }];
  }

  const merged: TtsSegment[] = [];
  for (const part of sentences) {
    const hasBn = /[\u0980-\u09FF]/.test(part);
    const hasEn = /[A-Za-z]/.test(part);
    const segLang: 'bn' | 'en' = lockLanguage
      ? defaultLang
      : hasBn
      ? 'bn'
      : hasEn
      ? 'en'
      : defaultLang;
    const prev = merged[merged.length - 1];
    if (prev && prev.lang === segLang && prev.text.length + part.length + 1 <= 175) {
      prev.text = `${prev.text} ${part}`;
    } else {
      merged.push({ text: part, lang: segLang });
    }
  }

  const result: TtsSegment[] = [];
  for (const seg of merged) {
    for (const chunk of chunkSegmentText(seg.text)) {
      result.push({ text: chunk, lang: seg.lang });
    }
  }
  return result;
}

async function synthesizeGoogleFemaleSegment(
  text: string,
  lang: 'bn' | 'en'
): Promise<CachedAudioEntry | null> {
  const segCacheKey = `gtts:v1:${lang}:${text}`;
  const cached = readCachedAudio(segCacheKey);
  if (cached) return cached;

  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}` +
    `&q=${encodeURIComponent(text)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        if (arrayBuf.byteLength) {
          const base64 = Buffer.from(arrayBuf).toString('base64');
          const entry: CachedAudioEntry = { base64, mimeType: 'audio/mpeg' };
          writeCachedAudio(segCacheKey, base64, 'audio/mpeg');
          return entry;
        }
      }
    } catch {
      // Retry cleanly before giving up
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  return null;
}

async function synthesizeGoogleFemaleClips(
  text: string,
  defaultLang: 'bn' | 'en',
  lockLanguage = false
): Promise<Array<{ audioBase64: string; mimeType: 'audio/mpeg'; lang: 'bn' | 'en' }> | null> {
  const segments = splitTtsSegments(text, defaultLang, lockLanguage);
  const clips: Array<{ audioBase64: string; mimeType: 'audio/mpeg'; lang: 'bn' | 'en' }> = [];

  for (const seg of segments) {
    const entry = await synthesizeGoogleFemaleSegment(seg.text, seg.lang);
    if (!entry) return null;
    clips.push({
      audioBase64: entry.base64,
      mimeType: 'audio/mpeg',
      lang: seg.lang,
    });
  }

  return clips.length > 0 ? clips : null;
}

function getGeminiClient(apiVersion: 'v1beta' | 'v1alpha' = 'v1beta'): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  res.json({
    ok: true,
    ttsConfigured: true,
    geminiTtsConfigured: hasKey,
    quotaCooldownActive: Date.now() < ttsQuotaCooldownUntil,
  });
});

app.post('/api/tts', async (req, res) => {
  try {
    const rawInput = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const lang = req.body?.lang === 'bn' ? 'bn' : 'en';
    const mode = req.body?.mode === 'story' ? 'story' : 'standard';
    const voiceName = 'Kore';

    if (!rawInput || rawInput.length > 260) {
      return res.status(400).json({ error: 'Valid short text is required for TTS.' });
    }

    const rawText = normalizeTextForSpeech(rawInput);

    // For long storytelling/rhyme narration, ALWAYS lock to the single consistent
    // Neural Female Voice (never mixing Gemini vs fallback or changing voices mid-story)
    if (mode === 'story') {
      const storyClips = await synthesizeGoogleFemaleClips(rawText, lang, true);
      if (storyClips) {
        if (storyClips.length === 1) {
          return res.json({
            audioBase64: storyClips[0].audioBase64,
            mimeType: storyClips[0].mimeType,
            playbackRate: 1,
            cached: true,
            source: 'google-tts',
          });
        }
        return res.json({
          audioClips: storyClips,
          playbackRate: 1,
          cached: true,
          source: 'google-tts',
        });
      }
      return res.json({
        fallback: true,
        code: 'STORY_TTS_FALLBACK',
        retryAfterSec: 20,
      });
    }

    const cacheKey = `v3:${lang}:${voiceName}:${rawText}`;
    const cached = readCachedAudio(cacheKey);
    if (cached) {
      return res.json({
        audioBase64: cached.base64,
        mimeType: cached.mimeType,
        playbackRate: cached.mimeType === 'audio/mpeg' ? 0.86 : 1,
        cached: true,
        source: cached.mimeType === 'audio/mpeg' ? 'google-tts' : 'gemini',
      });
    }

    const ai = getGeminiClient('v1beta');
    const now = Date.now();
    const canTryGemini = Boolean(ai) && now >= ttsQuotaCooldownUntil;

    let base64Audio: string | undefined;
    let lastErrorMsg = '';
    let hitQuota = false;
    let maxRetryDelayMs = 60_000;
    let usedModel = '';
    let usedMetadata = false;

    if (canTryGemini && ai) {
      const styleInstruction =
        lang === 'bn'
          ? 'Warm, sweet, gentle female kindergarten teacher speaking slowly, calmly, and very clearly in Bengali with soft encouraging pauses for a 4-year-old child'
          : 'Warm, sweet, gentle female kindergarten teacher speaking slowly, calmly, and very clearly in English with soft encouraging pauses for a 4-year-old child';

      const attempts: Array<{ model: string; useSpeechMetadata: boolean }> = [
        { model: 'gemini-3.8-flash-lite-tts', useSpeechMetadata: true },
        { model: 'gemini-2.5-flash-preview-tts', useSpeechMetadata: false },
      ];

      for (const attempt of attempts) {
        try {
          const partPayload = attempt.useSpeechMetadata
            ? { text: rawText, speechMetadata: { style: styleInstruction } }
            : { text: rawText };

          const response = await ai.models.generateContent({
            model: attempt.model,
            contents: [
              {
                role: 'user',
                parts: [partPayload],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (part?.data) {
            const rawBuf = Buffer.from(part.data, 'base64');
            const isRiff =
              rawBuf.length >= 4 &&
              rawBuf[0] === 0x52 &&
              rawBuf[1] === 0x49 &&
              rawBuf[2] === 0x46 &&
              rawBuf[3] === 0x46;
            if (isRiff) {
              base64Audio = part.data;
            } else {
              const wavHeader = Buffer.alloc(44);
              wavHeader.write('RIFF', 0);
              wavHeader.writeUInt32LE(36 + rawBuf.length, 4);
              wavHeader.write('WAVE', 8);
              wavHeader.write('fmt ', 12);
              wavHeader.writeUInt32LE(16, 16);
              wavHeader.writeUInt16LE(1, 20);
              wavHeader.writeUInt16LE(1, 22);
              wavHeader.writeUInt32LE(24000, 24);
              wavHeader.writeUInt32LE(24000 * 2, 28);
              wavHeader.writeUInt16LE(2, 32);
              wavHeader.writeUInt16LE(16, 34);
              wavHeader.write('data', 36);
              wavHeader.writeUInt32LE(rawBuf.length, 40);
              base64Audio = Buffer.concat([wavHeader, rawBuf]).toString('base64');
            }
            usedModel = attempt.model;
            usedMetadata = attempt.useSpeechMetadata;
            break;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          lastErrorMsg = msg;
          if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
            hitQuota = true;
            maxRetryDelayMs = Math.max(maxRetryDelayMs, parseRetryDelayMs(msg));
          }
        }
      }
    }

    if (base64Audio) {
      writeCachedAudio(cacheKey, base64Audio, 'audio/wav');
      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        playbackRate: 1,
        cached: false,
        model: usedModel,
        usedMetadata,
        source: 'gemini',
      });
    }

    if (hitQuota) {
      ttsQuotaCooldownUntil = Date.now() + maxRetryDelayMs;
      if (Date.now() - lastCooldownWarnAt > 60_000) {
        lastCooldownWarnAt = Date.now();
        console.warn(
          `Gemini TTS quota limit reached; switching to neural female voice fallback for ${Math.ceil(
            maxRetryDelayMs / 1000
          )}s.`
        );
      }
    } else if (canTryGemini && lastErrorMsg) {
      console.warn('Gemini TTS unavailable, switching to neural female voice fallback:', lastErrorMsg);
    }

    // Reliable free female Bengali & English neural voice (works even if OS has no Bangla voice)
    const googleClips = await synthesizeGoogleFemaleClips(rawText, lang);
    if (googleClips) {
      if (googleClips.length === 1) {
        return res.json({
          audioBase64: googleClips[0].audioBase64,
          mimeType: googleClips[0].mimeType,
          playbackRate: 0.86,
          cached: false,
          source: 'google-tts',
        });
      }
      return res.json({
        audioClips: googleClips,
        playbackRate: 0.86,
        cached: false,
        source: 'google-tts',
      });
    }

    return res.json({
      fallback: true,
      code: hitQuota ? 'TTS_QUOTA_COOLDOWN' : 'TTS_FALLBACK',
      retryAfterSec: 30,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS fallback';
    console.warn('TTS route fallback:', message);
    return res.json({ fallback: true, code: 'TTS_FALLBACK', retryAfterSec: 30 });
  }
});

app.post('/api/speech-transcribe', async (req, res) => {
  try {
    const audioBase64 = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
    const mimeType =
      typeof req.body?.mimeType === 'string' && req.body.mimeType.startsWith('audio/')
        ? req.body.mimeType
        : 'audio/webm';
    const lang = req.body?.lang === 'bn' ? 'bn' : 'en';
    const targetSymbol = typeof req.body?.targetSymbol === 'string' ? req.body.targetSymbol.trim() : '';
    const targetWord = typeof req.body?.targetWord === 'string' ? req.body.targetWord.trim() : '';

    if (!audioBase64 || audioBase64.length > 1_500_000) {
      return res.status(400).json({ error: 'Valid short audio recording is required.' });
    }

    const ai = getGeminiClient('v1beta');
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini speech transcription is not configured on the server.',
        code: 'TRANSCRIBE_UNCONFIGURED',
      });
    }

    const languageLabel = lang === 'bn' ? 'Bengali' : 'English';
    const hintClause = targetWord
      ? ` The child is trying to pronounce "${targetSymbol}" or "${targetWord}".`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: `Transcribe ONLY the exact word, letter, or short sound spoken in this ${languageLabel} audio clip by a young child. Do not explain or translate.${hintClause}`,
          },
        ],
      },
    });

    const transcript = (response.text ?? '').trim();
    return res.json({ transcript });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
    return res.status(isQuota ? 429 : 502).json({
      error: isQuota ? 'Speech transcription quota reached.' : 'Speech transcription failed.',
      code: isQuota ? 'QUOTA_EXCEEDED' : 'TRANSCRIBE_ERROR',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        ws: isHmrDisabled ? false : { server: httpServer },
      },
      plugins: isHmrDisabled
        ? [
            {
              name: 'disable-vite-client-ws-when-hmr-off',
              enforce: 'post',
              transform(code: string, id: string) {
                const cleanId = id.split('?')[0].replace(/\\/g, '/');
                if (cleanId.endsWith('/vite/dist/client/client.mjs')) {
                  const startMarker = 'const transport = normalizeModuleRunnerTransport((() => {';
                  const endMarker = 'let willUnload = false;';
                  const startIdx = code.indexOf(startMarker);
                  const endIdx = startIdx !== -1 ? code.indexOf(endMarker, startIdx) : -1;
                  if (startIdx !== -1 && endIdx !== -1) {
                    return (
                      code.slice(0, startIdx) +
                      'const transport = normalizeModuleRunnerTransport({ connect() {}, disconnect() {}, send() {} });\n' +
                      code.slice(endIdx)
                    );
                  }
                }
              },
            },
          ]
        : [],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chotto Bondhu Pathshala server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
