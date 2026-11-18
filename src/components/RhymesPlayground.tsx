import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Music,
  Play,
  Square,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  RhymeItem,
  IMAGE_ASSETS,
  toBanglaDigits,
} from '../data/curriculum';
import {
  playPop,
  playSuccessChime,
  speakText,
  stopSpeaking,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';

type RhymeFilter = 'all' | 'bn' | 'en';

interface RhymesPlaygroundProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  masteredIds: string[];
  onExploreRhyme: (rhyme: RhymeItem) => void;
  onCompleteRhyme: (rhyme: RhymeItem) => void;
}

export function RhymesPlayground({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  masteredIds,
  onExploreRhyme,
  onCompleteRhyme,
}: RhymesPlaygroundProps) {
  const [rhymesList, setRhymesList] = useState<RhymeItem[]>([]);
  const [filter, setFilter] = useState<RhymeFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [isRecitingAll, setIsRecitingAll] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [imgError, setImgError] = useState(false);

  const reciteSessionRef = useRef(0);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  useEffect(() => {
    let active = true;
    void import('../data/rhymesData').then((mod) => {
      if (active) setRhymesList(mod.EXPANDED_CHILDREN_RHYMES);
    });
    return () => {
      active = false;
    };
  }, []);

  const banglaCount = useMemo(
    () => rhymesList.filter((r) => r.lang === 'bn').length,
    [rhymesList]
  );
  const englishCount = useMemo(
    () => rhymesList.filter((r) => r.lang === 'en').length,
    [rhymesList]
  );

  const filteredRhymes = useMemo(() => {
    if (filter === 'all') return rhymesList;
    return rhymesList.filter((r) => r.lang === filter);
  }, [filter, rhymesList]);

  const activeRhyme = filteredRhymes[selectedIndex] ?? filteredRhymes[0];

  useEffect(() => {
    setImgError(false);
  }, [activeRhyme?.id]);

  const stopRecitation = useCallback(() => {
    reciteSessionRef.current += 1;
    setIsRecitingAll(false);
    setActiveLineIdx(null);
    stopSpeaking();
  }, []);

  useEffect(() => {
    return () => {
      reciteSessionRef.current += 1;
    };
  }, []);

  const handleSelectRhyme = useCallback(
    (idx: number) => {
      playPop();
      stopRecitation();
      const target = filteredRhymes[idx];
      if (!target) return;
      setSelectedIndex(idx);
      onExploreRhyme(target);
      void speakText(target.title, target.lang, voiceEnabledRef.current, { mode: 'story' });
    },
    [filteredRhymes, onExploreRhyme, stopRecitation]
  );

  const handleReciteSingleLine = useCallback(
    async (lineIdx: number) => {
      if (!activeRhyme) return;
      const line = activeRhyme.lines[lineIdx];
      if (!line) return;

      playPop();
      reciteSessionRef.current += 1;
      const sessionId = reciteSessionRef.current;
      setIsRecitingAll(false);
      setActiveLineIdx(lineIdx);
      onExploreRhyme(activeRhyme);

      await speakText(line.text, activeRhyme.lang, voiceEnabledRef.current, { mode: 'story' });
      if (reciteSessionRef.current === sessionId) {
        setActiveLineIdx(null);
      }
    },
    [activeRhyme, onExploreRhyme]
  );

  const handleReciteFullRhyme = useCallback(async () => {
    if (!activeRhyme) return;
    if (isRecitingAll) {
      playPop();
      stopRecitation();
      return;
    }

    playPop();
    reciteSessionRef.current += 1;
    const sessionId = reciteSessionRef.current;
    setIsRecitingAll(true);
    onExploreRhyme(activeRhyme);

    // Recite title briefly first, then every line in sequence with highlight
    setActiveLineIdx(null);
    await speakText(activeRhyme.title, activeRhyme.lang, voiceEnabledRef.current, { mode: 'story' });
    if (reciteSessionRef.current !== sessionId) return;

    await new Promise((r) => window.setTimeout(r, 220));
    if (reciteSessionRef.current !== sessionId) return;

    for (let i = 0; i < activeRhyme.lines.length; i++) {
      if (reciteSessionRef.current !== sessionId) return;
      setActiveLineIdx(i);
      await speakText(
        activeRhyme.lines[i].text,
        activeRhyme.lang,
        voiceEnabledRef.current,
        { mode: 'story' }
      );
      if (reciteSessionRef.current !== sessionId) return;
      if (i < activeRhyme.lines.length - 1) {
        await new Promise((r) => window.setTimeout(r, 180));
      }
    }

    if (reciteSessionRef.current === sessionId) {
      setIsRecitingAll(false);
      setActiveLineIdx(null);
      playSuccessChime();
      setCelebrating(true);
      onCompleteRhyme(activeRhyme);
      window.setTimeout(() => setCelebrating(false), 1100);
    }
  }, [activeRhyme, isRecitingAll, onCompleteRhyme, onExploreRhyme, stopRecitation]);

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
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSelectRhyme((selectedIndex + 1) % filteredRhymes.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSelectRhyme(
          (selectedIndex - 1 + filteredRhymes.length) % filteredRhymes.length
        );
      } else if (e.code === 'Space') {
        e.preventDefault();
        void handleReciteFullRhyme();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (activeRhyme && activeRhyme.lines[idx]) {
          e.preventDefault();
          void handleReciteSingleLine(idx);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    deviceMode,
    selectedIndex,
    filteredRhymes.length,
    activeRhyme,
    handleSelectRhyme,
    handleReciteFullRhyme,
    handleReciteSingleLine,
  ]);

  if (!activeRhyme) {
    return (
      <div className="min-h-[260px] flex items-center justify-center">
        <div className="bg-white border-2 border-rose-200 rounded-3xl px-6 py-4 text-rose-700 font-bold text-base animate-pulse">
          🎵 ছড়ার ঝাঁপি সাজানো হচ্ছে...
        </div>
      </div>
    );
  }

  const isActiveSpeaking = isRecitingAll || isSpeaking || activeLineIdx !== null;

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={
          activeRhyme.lang === 'bn'
            ? IMAGE_ASSETS.tigerMascot
            : IMAGE_ASSETS.parrotPhonics
        }
        fallbackEmoji={activeRhyme.lang === 'bn' ? '🐯' : '🦜'}
        name="সুর ও ছড়ার আসর"
        speechBubble={
          activeLineIdx !== null
            ? activeRhyme.lines[activeLineIdx]?.text ?? activeRhyme.title
            : `চলো একসাথে আবৃত্তি করি: ${activeRhyme.title}`
        }
        isSpeaking={isActiveSpeaking}
        celebrating={celebrating}
        onTap={() => void handleReciteFullRhyme()}
      />

      {/* Filter Tabs: All / Bangla / English */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-rose-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              stopRecitation();
              setFilter('all');
              setSelectedIndex(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            সব ছড়া ({toBanglaDigits(rhymesList.length)})
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              stopRecitation();
              setFilter('bn');
              setSelectedIndex(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'bn'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            বাংলা ছড়া ({toBanglaDigits(banglaCount)})
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              stopRecitation();
              setFilter('en');
              setSelectedIndex(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'en'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            English Rhymes ({toBanglaDigits(englishCount)})
          </button>
        </div>

        <div className="text-xs sm:text-sm font-bold text-slate-500">
          যেকোনো লাইনে ট্যাপ করলে সেই লাইনটি উচ্চারণ করে শোনাবে!
        </div>
      </div>

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 ল্যাপটপ কিবোর্ড: ← → ছড়া বদলাও · Space পুরো ছড়া শোনাবে/থামাবে · 1–4 নির্দিষ্ট লাইন আবৃত্তি করবে
        </div>
      )}

      {/* Animated Storybook Recitation Theater */}
      <div
        className={`rounded-3xl border-2 ${activeRhyme.accentBorder} ${activeRhyme.accentBg} p-5 sm:p-7 shadow-sm space-y-6`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Stage Visual */}
          <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {isActiveSpeaking && (
                <>
                  <motion.span
                    animate={{ y: [0, -28], x: [-6, 8], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-4 -left-4 text-2xl pointer-events-none"
                  >
                    🎵
                  </motion.span>
                  <motion.span
                    animate={{ y: [0, -32], x: [6, -6], opacity: [1, 0] }}
                    transition={{ duration: 1.7, repeat: Infinity, delay: 0.4 }}
                    className="absolute -top-4 -right-4 text-2xl pointer-events-none"
                  >
                    🎶
                  </motion.span>
                </>
              )}

              <motion.button
                type="button"
                onClick={() => void handleReciteFullRhyme()}
                animate={
                  isActiveSpeaking
                    ? { scale: [1.06, 1.14, 1.08], rotate: [0, -2, 2, 0] }
                    : { y: [0, -6, 0], scale: 1 }
                }
                transition={
                  isActiveSpeaking
                    ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
                whileTap={{ scale: 0.94 }}
                aria-label={`${activeRhyme.title} আবৃত্তি শুনুন`}
                className={`w-44 h-44 sm:w-52 sm:h-52 rounded-3xl border-4 bg-white overflow-hidden shadow-lg flex items-center justify-center cursor-pointer ${
                  isActiveSpeaking ? 'border-amber-400 shadow-2xl' : 'border-white'
                }`}
              >
                {!imgError ? (
                  <img
                    src={activeRhyme.imageUrl}
                    alt={activeRhyme.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-7xl">{activeRhyme.emoji}</span>
                )}
              </motion.button>
            </div>

            <div>
              <span className="inline-block px-3 py-0.5 rounded-lg bg-white/90 border border-slate-200 text-xs font-bold text-slate-700 mb-1.5">
                {activeRhyme.lang === 'bn' ? 'বাংলা ছড়া' : 'English Rhyme'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {activeRhyme.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                {activeRhyme.subtitle}
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => void handleReciteFullRhyme()}
              className={`min-h-[52px] px-7 rounded-2xl font-bold text-base inline-flex items-center gap-2 shadow-sm cursor-pointer transition-colors ${
                isRecitingAll
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isRecitingAll ? (
                <>
                  <Square className="w-5 h-5 fill-white" />
                  <span>আবৃত্তি থামাও</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>পুরো ছড়া আবৃত্তি করো</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Right Line-by-Line Interactive Recitation Cards */}
          <div className="lg:col-span-7 space-y-3">
            {activeRhyme.lines.map((line, idx) => {
              const isCurrent = activeLineIdx === idx;
              return (
                <motion.button
                  key={`${activeRhyme.id}-line-${idx}`}
                  type="button"
                  animate={isCurrent ? { scale: 1.02, x: 4 } : { scale: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void handleReciteSingleLine(idx)}
                  className={`w-full text-left rounded-2xl border-2 p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-100 border-amber-500 shadow-md'
                      : 'bg-white/95 border-white hover:border-amber-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 tabular-nums mt-0.5 ${
                        isCurrent
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {toBanglaDigits(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                        {line.text}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>উচ্চারণ: {line.pronunciationBn}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-amber-500 text-white'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prev / Next Navigation Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            handleSelectRhyme(
              (selectedIndex - 1 + filteredRhymes.length) % filteredRhymes.length
            )
          }
          className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>আগের ছড়া</span>
        </button>

        <div className="text-sm font-bold text-slate-600 tabular-nums">
          {toBanglaDigits(selectedIndex + 1)} / {toBanglaDigits(filteredRhymes.length)}
        </div>

        <button
          type="button"
          onClick={() =>
            handleSelectRhyme((selectedIndex + 1) % filteredRhymes.length)
          }
          className="min-h-[48px] px-5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>পরের ছড়া</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Rhyme Selector Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-700">
            ছড়া ও কবিতার তালিকা ({toBanglaDigits(filteredRhymes.length)}টি):
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            উচ্চারণসহ শুনতে যেকোনো ছড়ায় ট্যাপ করো
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredRhymes.map((rhyme, idx) => {
              const isSelected = idx === selectedIndex;
              const isMastered = masteredIds.includes(rhyme.id);
              return (
                <motion.button
                  key={rhyme.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectRhyme(idx)}
                  className={`relative rounded-2xl border-2 p-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 border-rose-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:border-rose-300 text-slate-900'
                  }`}
                >
                  <span className="w-11 h-11 rounded-xl bg-white/95 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                    <img
                      src={rhyme.imageUrl}
                      alt={rhyme.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold opacity-85 flex items-center gap-1">
                      <Music className="w-3 h-3 shrink-0" />
                      <span>
                        {toBanglaDigits(idx + 1)}. {rhyme.lang === 'bn' ? 'বাংলা' : 'English'}
                      </span>
                    </div>
                    <div className="font-bold text-sm leading-tight truncate">
                      {rhyme.title}
                    </div>
                  </div>
                  {isMastered && !isSelected && (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-500 absolute top-2 right-2"
                      aria-label="শোনা হয়েছে"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
