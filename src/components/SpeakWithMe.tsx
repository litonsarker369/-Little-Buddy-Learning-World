import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Square,
  Volume2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Heart,
  RotateCcw,
  Star,
} from 'lucide-react';
import {
  BANGLA_VOWELS,
  BANGLA_CONSONANTS,
  ENGLISH_PHONICS,
  CurriculumItem,
  IMAGE_ASSETS,
  toBanglaDigits,
} from '../data/curriculum';
import {
  playPop,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
  stopSpeaking,
} from '../utils/audioEngine';
import { evaluateSpeechMatch } from '../utils/speechMatcher';
import { MascotStage } from './MascotStage';

type SpeakCategory = 'bn-vowels' | 'bn-consonants' | 'en-words';
type ListenPhase =
  | 'idle'
  | 'prompting'
  | 'listening'
  | 'checking'
  | 'success'
  | 'retry'
  | 'mic-error';

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: BrowserSpeechRecognitionResult;
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((ev: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeakWithMeProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  masteredIds: string[];
  /** Optional external item when embedded inside LetterPlayground */
  embeddedItem?: CurriculumItem;
  onExploreItem?: (item: CurriculumItem) => void;
  onSuccessSpeak: (item: CurriculumItem) => void;
  onPrevEmbedded?: () => void;
  onNextEmbedded?: () => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Audio read error'));
    reader.readAsDataURL(blob);
  });
}

function getSpeechPromptForItem(item: CurriculumItem): string {
  if (item.lang === 'bn') {
    return `${item.symbol}! ${item.word}!`;
  }
  return `${item.symbol}! ${item.word}!`;
}

export function SpeakWithMe({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  masteredIds,
  embeddedItem,
  onExploreItem,
  onSuccessSpeak,
  onPrevEmbedded,
  onNextEmbedded,
}: SpeakWithMeProps) {
  const isStandalone = !embeddedItem;
  const [category, setCategory] = useState<SpeakCategory>('bn-vowels');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [phase, setPhase] = useState<ListenPhase>('idle');
  const [heardText, setHeardText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [micBars, setMicBars] = useState<number[]>([0.2, 0.25, 0.3, 0.25, 0.2, 0.25, 0.2]);
  const [imgError, setImgError] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [speakStars, setSpeakStars] = useState(0);

  const sessionRef = useRef(0);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  // Live microphone & speech recognition refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recorderMimeRef = useRef<string>('audio/webm');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionCandidatesRef = useRef<string[]>([]);
  const analyserCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const listenMaxTimerRef = useRef<number | null>(null);
  const peakVolumeRef = useRef(0);
  const speechStartedAtRef = useRef<number | null>(null);
  const lastSoundAtRef = useRef<number>(0);

  const items = useMemo(() => {
    if (category === 'bn-vowels') return BANGLA_VOWELS;
    if (category === 'bn-consonants') return BANGLA_CONSONANTS;
    return ENGLISH_PHONICS;
  }, [category]);

  const activeItem = embeddedItem ?? items[selectedIndex] ?? items[0];

  useEffect(() => {
    setImgError(false);
  }, [activeItem?.id]);

  const cleanupMicResources = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (listenMaxTimerRef.current !== null) {
      window.clearTimeout(listenMaxTimerRef.current);
      listenMaxTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // Ignore cleanup errors
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (analyserCtxRef.current) {
      analyserCtxRef.current.close().catch(() => {});
      analyserCtxRef.current = null;
    }
    setMicBars([0.2, 0.25, 0.3, 0.25, 0.2, 0.25, 0.2]);
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      cleanupMicResources();
      stopSpeaking();
    };
  }, [cleanupMicResources]);

  // Reset stage when target item changes
  useEffect(() => {
    sessionRef.current += 1;
    cleanupMicResources();
    setPhase('idle');
    setHeardText('');
    setFeedbackMsg('');
  }, [activeItem?.id, cleanupMicResources]);

  const handleSuccessResult = useCallback(
    (item: CurriculumItem, recognizedPhrase: string) => {
      playSuccessChime();
      setPhase('success');
      setCelebrating(true);
      setSpeakStars((s) => s + 1);
      setHeardText(recognizedPhrase);
      setFeedbackMsg(
        item.lang === 'bn'
          ? `বাহ! একদম ঠিক বলেছ — "${item.word}"!`
          : `Awesome! You said "${item.word}" so clearly!`
      );
      onSuccessSpeak(item);
      const cheer =
        item.lang === 'bn'
          ? `বাহ! খুব সুন্দর বলেছ! একদম ঠিক!`
          : `Yay! Wonderful job! You said ${item.word}!`;
      void speakText(cheer, item.lang, voiceEnabledRef.current);
      window.setTimeout(() => setCelebrating(false), 1100);
    },
    [onSuccessSpeak]
  );

  const handleRetryResult = useCallback(
    (item: CurriculumItem, heard: string, tooQuiet: boolean, serverNotice?: string) => {
      playSoftTryAgain();
      setPhase('retry');
      setHeardText(heard);
      if (serverNotice) {
        setFeedbackMsg(serverNotice);
      } else if (tooQuiet) {
        setFeedbackMsg(
          item.lang === 'bn'
            ? `একটু আস্তে শোনা গেছে! মাইকের কাছে মিষ্টি করে বলো "${item.symbol}" বা "${item.word}"।`
            : `Almost didn't hear you! Speak a bit closer and say "${item.word}".`
        );
      } else {
        setFeedbackMsg(
          item.lang === 'bn'
            ? `খুব সুন্দর চেষ্টা! চলো আরেকবার একসাথে বলি "${item.symbol}" (${item.word})।`
            : `Good try, buddy! Let us say "${item.symbol} for ${item.word}" together again!`
        );
      }

      const gentleReply =
        item.lang === 'bn'
          ? tooQuiet
            ? `আরেকটু জোরে বলো, সোনা! ${item.symbol}! ${item.word}!`
            : `খুব সুন্দর চেষ্টা! চলো আবার বলি: ${item.symbol}! ${item.word}!`
          : `Good try! Let us say it again: ${item.symbol}! ${item.word}!`;
      void speakText(gentleReply, item.lang, voiceEnabledRef.current);
    },
    []
  );

  const finalizeListeningAndEvaluate = useCallback(
    async (item: CurriculumItem, mySession: number) => {
      if (sessionRef.current !== mySession) return;
      setPhase('checking');

      // Stop Web Speech API first so final results flush
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      // Stop MediaRecorder cleanly and gather recorded audio blob
      const recordedBlob = await new Promise<Blob | null>((resolve) => {
        const rec = mediaRecorderRef.current;
        if (!rec || rec.state === 'inactive') {
          if (recordedChunksRef.current.length > 0) {
            resolve(new Blob(recordedChunksRef.current, { type: recorderMimeRef.current }));
          } else {
            resolve(null);
          }
          return;
        }
        rec.onstop = () => {
          const blob =
            recordedChunksRef.current.length > 0
              ? new Blob(recordedChunksRef.current, { type: recorderMimeRef.current })
              : null;
          resolve(blob);
        };
        try {
          rec.stop();
        } catch {
          resolve(null);
        }
      });

      const peakVol = peakVolumeRef.current;
      cleanupMicResources();
      if (sessionRef.current !== mySession) return;

      // 1) Check browser SpeechRecognition candidates first (zero server latency)
      const localCandidates = [...recognitionCandidatesRef.current];
      const localEval = evaluateSpeechMatch(
        localCandidates,
        item.symbol,
        item.word,
        item.lang
      );

      if (localEval.matched) {
        handleSuccessResult(item, localEval.matchedText || localCandidates[0] || item.word);
        return;
      }

      // 2) If too quiet & no transcript captured, encourage child gently without wasting API call
      if (peakVol < 0.025 && localCandidates.length === 0) {
        handleRetryResult(item, '', true);
        return;
      }

      // 3) Send recorded audio to /api/speech-transcribe (Gemini 3.5 Transcribe) for accurate child-voice recognition
      if (recordedBlob && recordedBlob.size > 500) {
        try {
          const base64 = await blobToBase64(recordedBlob);
          if (sessionRef.current !== mySession) return;

          const res = await fetch('/api/speech-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: recorderMimeRef.current,
              lang: item.lang,
              targetSymbol: item.symbol,
              targetWord: item.word,
            }),
          });

          if (sessionRef.current !== mySession) return;

          if (res.ok) {
            const data = (await res.json()) as { transcript?: string };
            const transcript = (data.transcript ?? '').trim();
            const serverEval = evaluateSpeechMatch(
              [transcript, ...localCandidates],
              item.symbol,
              item.word,
              item.lang
            );
            if (serverEval.matched) {
              handleSuccessResult(item, transcript || serverEval.matchedText || item.word);
              return;
            }
            handleRetryResult(item, transcript || localCandidates[0] || '', false);
            return;
          }

          // Server API returned error (e.g. 429 quota or unconfigured)
          const errPayload = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
          };
          if (localCandidates.length > 0) {
            handleRetryResult(item, localCandidates[0], false);
            return;
          }
          const notice =
            errPayload.code === 'QUOTA_EXCEEDED'
              ? item.lang === 'bn'
                ? 'ভয়েস চেকিং সার্ভারে সাময়িক চাপ আছে! Chrome ব্রাউজার ব্যবহার করলে তাৎক্ষণিক শুনতে পারবে।'
                : 'Speech check quota reached right now. Please try again in a moment!'
              : undefined;
          handleRetryResult(item, '', false, notice);
          return;
        } catch {
          if (sessionRef.current !== mySession) return;
        }
      }

      handleRetryResult(item, localCandidates[0] || '', peakVol < 0.03);
    },
    [cleanupMicResources, handleRetryResult, handleSuccessResult]
  );

  const startMicCapture = useCallback(
    async (item: CurriculumItem, mySession: number) => {
      if (sessionRef.current !== mySession) return;

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setPhase('mic-error');
        setFeedbackMsg(
          'এই ব্রাউজারে মাইক্রোফোন সাপোর্ট পাওয়া যায়নি। অনুগ্রহ করে Chrome বা আধুনিক ব্রাউজার ব্যবহার করুন।'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (sessionRef.current !== mySession) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        recognitionCandidatesRef.current = [];
        recordedChunksRef.current = [];
        peakVolumeRef.current = 0;
        speechStartedAtRef.current = null;
        lastSoundAtRef.current = Date.now();
        setHeardText('');
        setFeedbackMsg('');
        setPhase('listening');

        // Start MediaRecorder for reliable server audio transcription
        if (typeof MediaRecorder !== 'undefined') {
          const preferredTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
          ];
          const chosenMime =
            preferredTypes.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
          recorderMimeRef.current = chosenMime ? chosenMime.split(';')[0] : 'audio/webm';
          const recorder = chosenMime
            ? new MediaRecorder(stream, { mimeType: chosenMime })
            : new MediaRecorder(stream);
          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              recordedChunksRef.current.push(ev.data);
            }
          };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
        }

        // Start browser SpeechRecognition in parallel when available
        const win = window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        };
        const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const rec = new SpeechRec();
            rec.lang = item.lang === 'bn' ? 'bn-BD' : 'en-US';
            rec.interimResults = true;
            rec.maxAlternatives = 5;
            rec.continuous = false;
            rec.onresult = (ev) => {
              const collected: string[] = [];
              for (let i = 0; i < ev.results.length; i++) {
                const res = ev.results[i];
                for (let j = 0; j < res.length; j++) {
                  const t = res[j]?.transcript?.trim();
                  if (t) collected.push(t);
                }
              }
              if (collected.length > 0) {
                recognitionCandidatesRef.current = collected;
                setHeardText(collected[0]);
              }
            };
            rec.onerror = () => {
              // Ignore STT errors; server audio transcription handles fallback
            };
            rec.start();
            recognitionRef.current = rec;
          } catch {
            // Ignore browser SpeechRecognition init failure
          }
        }

        // Live AudioContext waveform + silence auto-stop detection
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          analyserCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);

          const dataArr = new Uint8Array(analyser.frequencyBinCount);
          const listenStartedAt = Date.now();

          const tick = () => {
            if (sessionRef.current !== mySession) return;
            analyser.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) {
              sum += dataArr[i];
            }
            const avgNorm = sum / (dataArr.length * 255);
            if (avgNorm > peakVolumeRef.current) {
              peakVolumeRef.current = avgNorm;
            }

            if (avgNorm > 0.055) {
              if (!speechStartedAtRef.current) {
                speechStartedAtRef.current = Date.now();
              }
              lastSoundAtRef.current = Date.now();
            }

            // Build 7 lively visual waveform bars
            const nextBars = Array.from({ length: 7 }, (_, idx) => {
              const bin = dataArr[idx * 3 + 1] ?? 0;
              return Math.min(1, Math.max(0.18, (bin / 255) * 1.45));
            });
            setMicBars(nextBars);

            // Auto-stop smoothly ~1.05s after child finishes speaking
            const now = Date.now();
            if (
              speechStartedAtRef.current &&
              now - speechStartedAtRef.current > 450 &&
              now - lastSoundAtRef.current > 1050 &&
              now - listenStartedAt > 1200
            ) {
              void finalizeListeningAndEvaluate(item, mySession);
              return;
            }

            animFrameRef.current = requestAnimationFrame(tick);
          };
          animFrameRef.current = requestAnimationFrame(tick);
        }

        // Safety max capture duration: 4.2 seconds
        listenMaxTimerRef.current = window.setTimeout(() => {
          void finalizeListeningAndEvaluate(item, mySession);
        }, 4200);
      } catch {
        if (sessionRef.current !== mySession) return;
        cleanupMicResources();
        setPhase('mic-error');
        setFeedbackMsg(
          'মাইক্রোফোন চালু করতে পারিনি। ব্রাউজার থেকে মাইক্রোফোন অনুমতি (Allow) দিলে কথা বলা যাবে!'
        );
      }
    },
    [cleanupMicResources, finalizeListeningAndEvaluate]
  );

  // Full "Listen then Mimic" guided flow
  const handleListenAndSpeak = useCallback(async () => {
    if (!activeItem) return;
    if (phase === 'listening') {
      playPop();
      void finalizeListeningAndEvaluate(activeItem, sessionRef.current);
      return;
    }

    playPop();
    cleanupMicResources();
    stopSpeaking();
    sessionRef.current += 1;
    const mySession = sessionRef.current;

    setHeardText('');
    setFeedbackMsg('');
    setPhase('prompting');
    onExploreItem?.(activeItem);

    await speakText(
      getSpeechPromptForItem(activeItem),
      activeItem.lang,
      voiceEnabledRef.current
    );
    if (sessionRef.current !== mySession) return;

    // Brief 200ms room echo pause before opening mic
    await new Promise((r) => window.setTimeout(r, 200));
    if (sessionRef.current !== mySession) return;

    await startMicCapture(activeItem, mySession);
  }, [
    activeItem,
    cleanupMicResources,
    finalizeListeningAndEvaluate,
    onExploreItem,
    phase,
    startMicCapture,
  ]);

  // Direct Mic-only retry (without re-listening to model first)
  const handleMicOnly = useCallback(async () => {
    if (!activeItem) return;
    if (phase === 'listening') {
      playPop();
      void finalizeListeningAndEvaluate(activeItem, sessionRef.current);
      return;
    }

    playPop();
    cleanupMicResources();
    stopSpeaking();
    sessionRef.current += 1;
    const mySession = sessionRef.current;
    onExploreItem?.(activeItem);
    await startMicCapture(activeItem, mySession);
  }, [
    activeItem,
    cleanupMicResources,
    finalizeListeningAndEvaluate,
    onExploreItem,
    phase,
    startMicCapture,
  ]);

  const handleHearPromptOnly = useCallback(() => {
    if (!activeItem) return;
    playPop();
    cleanupMicResources();
    sessionRef.current += 1;
    setPhase('idle');
    onExploreItem?.(activeItem);
    void speakText(
      getSpeechPromptForItem(activeItem),
      activeItem.lang,
      voiceEnabledRef.current
    );
  }, [activeItem, cleanupMicResources, onExploreItem]);

  const handleSelectItem = useCallback(
    (idx: number) => {
      playPop();
      cleanupMicResources();
      stopSpeaking();
      const target = items[idx];
      setSelectedIndex(idx);
      if (target) {
        onExploreItem?.(target);
        void speakText(
          getSpeechPromptForItem(target),
          target.lang,
          voiceEnabledRef.current
        );
      }
    },
    [cleanupMicResources, items, onExploreItem]
  );

  // Laptop Keyboard Shortcuts
  useEffect(() => {
    if (deviceMode !== 'laptop') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        void handleListenAndSpeak();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isStandalone) {
          handleSelectItem((selectedIndex + 1) % items.length);
        } else {
          onNextEmbedded?.();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isStandalone) {
          handleSelectItem((selectedIndex - 1 + items.length) % items.length);
        } else {
          onPrevEmbedded?.();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    deviceMode,
    handleListenAndSpeak,
    handleSelectItem,
    isStandalone,
    items.length,
    onNextEmbedded,
    onPrevEmbedded,
    selectedIndex,
  ]);

  if (!activeItem) return null;

  const isListening = phase === 'listening';
  const isPrompting = phase === 'prompting' || isSpeaking;
  const shouldZoomImage = isPrompting || phase === 'success';

  const mascotSpeech =
    phase === 'listening'
      ? `আমি শুনছি! এবার তুমি বলো: "${activeItem.symbol}" বা "${activeItem.word}"!`
      : phase === 'checking'
      ? 'বাহ, একটু দেখি তুমি কেমন বললে...'
      : phase === 'success'
      ? feedbackMsg || 'বাহ! দারুণ বলেছ!'
      : phase === 'retry'
      ? feedbackMsg || 'আবার চেষ্টা করো, তুমি পারবে!'
      : `আগে আমি বলি "${activeItem.symbol} — ${activeItem.word}", তারপর তুমি মাইকে বলো!`;

  return (
    <div className="space-y-5">
      {isStandalone && (
        <MascotStage
          imageSrc={
            activeItem.lang === 'bn'
              ? IMAGE_ASSETS.tigerMascot
              : IMAGE_ASSETS.parrotPhonics
          }
          fallbackEmoji={activeItem.lang === 'bn' ? '🐯' : '🦜'}
          name="আমার সাথে বলো (Speak With Me)"
          speechBubble={mascotSpeech}
          isSpeaking={isPrompting}
          celebrating={celebrating}
          onTap={handleHearPromptOnly}
        />
      )}

      {/* Standalone Category Tabs */}
      {isStandalone && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border-2 border-teal-200 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                playPop();
                cleanupMicResources();
                stopSpeaking();
                setCategory('bn-vowels');
                setSelectedIndex(0);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === 'bn-vowels'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              স্বরবর্ণ (অ–ঔ)
            </button>
            <button
              type="button"
              onClick={() => {
                playPop();
                cleanupMicResources();
                stopSpeaking();
                setCategory('bn-consonants');
                setSelectedIndex(0);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === 'bn-consonants'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              ব্যঞ্জনবর্ণ (ক–ঁ)
            </button>
            <button
              type="button"
              onClick={() => {
                playPop();
                cleanupMicResources();
                stopSpeaking();
                setCategory('en-words');
                setSelectedIndex(0);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === 'en-words'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              English (A–Z)
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-bold text-amber-800 tabular-nums">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>সেশন স্টার: {toBanglaDigits(speakStars)}</span>
          </div>
        </div>
      )}

      {isStandalone && deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 ল্যাপটপ কিবোর্ড: Space শোনো ও মাইকে বলো · ← → আগের বা পরের বর্ণ/শব্দ
        </div>
      )}

      {/* Main Interactive "Speak With Me" Stage */}
      <section
        aria-label="উচ্চারণ ও কথা বলার মঞ্চ"
        className={`rounded-3xl border-2 p-5 sm:p-8 shadow-sm transition-colors ${
          phase === 'success'
            ? 'bg-emerald-50 border-emerald-300'
            : isListening
            ? 'bg-sky-50 border-sky-300'
            : `${activeItem.accentBg} ${activeItem.accentBorder}`
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Letter + Zooming Real Image */}
          <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-4">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleHearPromptOnly}
                animate={
                  isPrompting
                    ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.9, repeat: isPrompting ? Infinity : 0 }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-amber-300 shadow-md flex items-center justify-center font-display text-5xl sm:text-6xl font-bold text-slate-900 cursor-pointer"
                aria-label={`${activeItem.symbol} শোনো`}
              >
                {activeItem.symbol}
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={handleHearPromptOnly}
                animate={
                  shouldZoomImage
                    ? { scale: 1.16, y: -4 }
                    : { scale: 1, y: [0, -4, 0] }
                }
                transition={
                  shouldZoomImage
                    ? { type: 'spring', stiffness: 260, damping: 18 }
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
                aria-label={activeItem.word}
                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 bg-white overflow-hidden shadow-lg flex items-center justify-center cursor-pointer ${
                  shouldZoomImage ? 'border-amber-400 shadow-2xl' : 'border-white'
                }`}
              >
                {activeItem.imageUrl && !imgError ? (
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.word}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">{activeItem.emoji}</span>
                )}
              </motion.button>
            </div>

            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {activeItem.word}
                {activeItem.wordMeaningBn && (
                  <span className="text-lg font-semibold text-slate-600 ml-2">
                    ({activeItem.wordMeaningBn})
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                {activeItem.phoneticCue}
              </p>
            </div>
          </div>

          {/* Right: Microphone Controls, Live Sound Waves & Gentle Feedback */}
          <div className="lg:col-span-7 flex flex-col items-center text-center space-y-5">
            {/* Step Instruction Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                ১. আগে ম্যামকে শোনো → ২. মাইকে বলো "{activeItem.symbol}" বা "{activeItem.word}"
              </span>
            </div>

            {/* Live Audio Waveform Visualizer */}
            <div className="h-14 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-2xl bg-white/80 border border-slate-200/80 w-full max-w-[260px] sm:w-auto sm:min-w-[220px]">
              {micBars.map((level, idx) => (
                <motion.span
                  key={idx}
                  animate={{
                    height: isListening
                      ? `${Math.round(level * 40)}px`
                      : isPrompting
                      ? [10, 28, 12]
                      : 10,
                  }}
                  transition={
                    isPrompting && !isListening
                      ? { duration: 0.55, repeat: Infinity, delay: idx * 0.08 }
                      : { duration: 0.08 }
                  }
                  className={`w-2.5 rounded-full ${
                    isListening
                      ? 'bg-sky-500'
                      : phase === 'success'
                      ? 'bg-emerald-500'
                      : isPrompting
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                disabled={phase === 'checking'}
                onClick={() => void handleListenAndSpeak()}
                className={`min-h-[60px] px-7 rounded-2xl font-bold text-base sm:text-lg inline-flex items-center gap-2.5 shadow-md cursor-pointer transition-colors disabled:opacity-60 ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <Square className="w-5 h-5 fill-white" />
                    <span>বলা শেষ (থামাও)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>শোনো ও বলো</span>
                  </>
                )}
              </motion.button>

              {!isListening && (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    disabled={phase === 'checking'}
                    onClick={() => void handleMicOnly()}
                    className="min-h-[54px] px-5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    <Mic className="w-5 h-5" />
                    <span>{phase === 'retry' ? 'আবার বলো' : 'সরাসরি মাইক'}</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={handleHearPromptOnly}
                    className="min-h-[54px] px-4 rounded-2xl bg-white hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-300 text-slate-800 font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5 text-amber-600" />
                    <span>আবার শোনো</span>
                  </motion.button>
                </>
              )}
            </div>

            {/* Gentle Feedback Card */}
            <AnimatePresence mode="wait">
              {phase === 'checking' && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-5 py-3 rounded-2xl bg-white border-2 border-sky-200 text-sky-800 font-bold text-sm"
                >
                  শুনছি... একটু অপেক্ষা করো ✨
                </motion.div>
              )}

              {phase === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-md rounded-2xl bg-white border-2 border-emerald-400 p-4 shadow-sm space-y-2"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                    <span>দারুণ বলেছ! +১ স্টার ★</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-emerald-900">
                    {feedbackMsg}
                  </p>
                  {heardText && (
                    <p className="text-xs font-semibold text-slate-500">
                      শোনা গেছে: “{heardText}”
                    </p>
                  )}
                </motion.div>
              )}

              {phase === 'retry' && (
                <motion.div
                  key="retry"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-md rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 shadow-xs space-y-2"
                >
                  <p className="text-sm sm:text-base font-bold text-amber-900">
                    {feedbackMsg}
                  </p>
                  {heardText && (
                    <p className="text-xs font-semibold text-slate-600">
                      মাইকে শোনা গেছে: “{heardText}”
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleListenAndSpeak()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>আরেকবার চেষ্টা করি</span>
                  </button>
                </motion.div>
              )}

              {phase === 'mic-error' && (
                <motion.div
                  key="mic-error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-md rounded-2xl bg-rose-50 border-2 border-rose-200 p-4 text-sm font-bold text-rose-800"
                >
                  {feedbackMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Prev / Next Navigation Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (isStandalone) {
              handleSelectItem((selectedIndex - 1 + items.length) % items.length);
            } else {
              onPrevEmbedded?.();
            }
          }}
          className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-teal-300 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>আগেরটি</span>
        </button>

        {isStandalone && (
          <div className="text-sm font-bold text-slate-600 tabular-nums">
            {toBanglaDigits(selectedIndex + 1)} / {toBanglaDigits(items.length)}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (isStandalone) {
              handleSelectItem((selectedIndex + 1) % items.length);
            } else {
              onNextEmbedded?.();
            }
          }}
          className="min-h-[48px] px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>পরেরটি</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Standalone Quick-Pick Letter & Word Grid */}
      {isStandalone && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2.5 sm:gap-3">
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isMastered = masteredIds.includes(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.9 }}
                whileHover={{ y: -2 }}
                onClick={() => handleSelectItem(idx)}
                className={`relative min-h-[64px] rounded-2xl border-2 p-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 border-teal-700 text-white shadow-sm'
                    : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'
                }`}
              >
                <span className="font-display text-2xl sm:text-3xl font-bold leading-none">
                  {item.symbol}
                </span>
                <span
                  className={`text-[11px] font-bold mt-1 truncate max-w-full ${
                    isSelected ? 'text-teal-50' : 'text-slate-600'
                  }`}
                >
                  {item.word}
                </span>
                {isMastered && !isSelected && (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-500 absolute top-1 right-1"
                    aria-label="বলা হয়েছে"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
