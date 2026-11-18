import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Gamepad2,
  BookOpen,
  HelpCircle,
  PenTool,
  Star,
  Shuffle,
  Mic,
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
  playBubblePop,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';
import { AnimatedCartoonTheater } from './AnimatedCartoonTheater';
import { MagicTracingPad } from './MagicTracingPad';
import { SpeakWithMe } from './SpeakWithMe';

type PlayMode = 'explore' | 'quiz' | 'bubbles' | 'trace' | 'speak' | 'case-match';
type BanglaGroup = 'vowels' | 'consonants';
type EnglishCase = 'capital' | 'small';

interface LetterPlaygroundProps {
  modeType: 'bangla' | 'english';
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  masteredIds: string[];
  onExploreItem: (item: CurriculumItem) => void;
  onCorrectAnswer: (item: CurriculumItem) => void;
}

const BUBBLE_COLORS = [
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-emerald-100 border-emerald-300 text-emerald-900',
  'bg-sky-100 border-sky-300 text-sky-900',
  'bg-rose-100 border-rose-300 text-rose-900',
  'bg-teal-100 border-teal-300 text-teal-900',
  'bg-orange-100 border-orange-300 text-orange-900',
];

function pickRandomItems<T>(pool: T[], count: number, includeItem?: T): T[] {
  const filtered = includeItem ? pool.filter((x) => x !== includeItem) : [...pool];
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, includeItem ? count - 1 : count);
  if (includeItem) picked.push(includeItem);
  return picked.sort(() => Math.random() - 0.5);
}

function ObjectThumb({
  imageUrl,
  emoji,
  alt,
  className,
  emojiClassName = 'text-2xl leading-none',
}: {
  imageUrl?: string;
  emoji: string;
  alt: string;
  className: string;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }
  return (
    <span className={emojiClassName} aria-hidden="true">
      {emoji}
    </span>
  );
}

export function LetterPlayground({
  modeType,
  deviceMode,
  voiceEnabled,
  isSpeaking,
  masteredIds,
  onExploreItem,
  onCorrectAnswer,
}: LetterPlaygroundProps) {
  const [playMode, setPlayMode] = useState<PlayMode>('explore');
  const [banglaGroup, setBanglaGroup] = useState<BanglaGroup>('vowels');
  const [englishCase, setEnglishCase] = useState<EnglishCase>('capital');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [sessionStars, setSessionStars] = useState(0);

  // Quiz state
  const [quizTarget, setQuizTarget] = useState<CurriculumItem | null>(null);
  const [quizOptions, setQuizOptions] = useState<CurriculumItem[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [quizSolved, setQuizSolved] = useState(false);

  // Bubble Pop state
  const [bubbleTarget, setBubbleTarget] = useState<CurriculumItem | null>(null);
  const [bubbles, setBubbles] = useState<CurriculumItem[]>([]);
  const [poppedIds, setPoppedIds] = useState<string[]>([]);
  const [wrongBubbleId, setWrongBubbleId] = useState<string | null>(null);

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const pendingTimerRef = useRef<number | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPendingTimer();
  }, [clearPendingTimer]);

  const items = useMemo(() => {
    if (modeType === 'bangla') {
      return banglaGroup === 'vowels' ? BANGLA_VOWELS : BANGLA_CONSONANTS;
    }
    return ENGLISH_PHONICS.map((item) => ({
      ...item,
      id: `${item.id}-${englishCase}`,
      symbol:
        englishCase === 'capital'
          ? item.symbol
          : item.secondarySymbol ?? item.symbol.toLowerCase(),
      spokenText:
        englishCase === 'capital'
          ? item.spokenText
          : `Small ${item.symbol.toLowerCase()}! ${item.spokenText}`,
      secondarySymbol: undefined,
    }));
  }, [modeType, banglaGroup, englishCase]);

  const activeItem = items[selectedIndex] ?? items[0];

  const triggerMascotCelebrate = useCallback(() => {
    setCelebrating(true);
    setSessionStars((s) => (s + 1) % 5 || 5);
    window.setTimeout(() => setCelebrating(false), 900);
  }, []);

  const handleSelectItem = useCallback(
    (index: number, shouldSpeak = true) => {
      const target = items[index];
      if (!target) return;
      playPop();
      setSelectedIndex(index);
      onExploreItem(target);
      if (shouldSpeak) {
        speakText(target.spokenText, target.lang, voiceEnabledRef.current);
      }
    },
    [items, onExploreItem]
  );

  const setupNextQuiz = useCallback(
    (pool: CurriculumItem[], speakNow = true, isCaseMatch = false) => {
      const target = pool[Math.floor(Math.random() * pool.length)];
      const opts = pickRandomItems(pool, 3, target);
      setQuizTarget(target);
      setQuizOptions(opts);
      setWrongId(null);
      setQuizSolved(false);
      if (speakNow) {
        const promptText = isCaseMatch
          ? `Find the small letter for capital ${target.symbol.toUpperCase()}!`
          : target.lang === 'bn'
          ? `খুঁজে বের করো: ${target.spokenText}`
          : `Can you find ${target.symbol}? ${target.spokenText}`;
        speakText(promptText, target.lang, voiceEnabledRef.current);
      }
    },
    []
  );

  const setupNextBubbles = useCallback(
    (pool: CurriculumItem[], speakNow = true) => {
      const chosen = pickRandomItems(pool, 6);
      const target = chosen[Math.floor(Math.random() * chosen.length)];
      setBubbles(chosen);
      setBubbleTarget(target);
      setPoppedIds([]);
      setWrongBubbleId(null);
      if (speakNow) {
        const promptText =
          target.lang === 'bn'
            ? `'${target.symbol}' বাবলটি ফাটাও! ${target.symbol}-তে ${target.word}!`
            : `Pop the letter ${target.symbol}! ${target.spokenText}`;
        speakText(promptText, target.lang, voiceEnabledRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setSelectedIndex(0);
    if (modeType === 'bangla' && playMode === 'case-match') {
      setPlayMode('explore');
    }
  }, [modeType, banglaGroup, englishCase, playMode]);

  useEffect(() => {
    clearPendingTimer();
    if (playMode === 'quiz' || playMode === 'case-match') {
      setupNextQuiz(items, true, playMode === 'case-match');
    } else if (playMode === 'bubbles') {
      setupNextBubbles(items, true);
    }
  }, [
    modeType,
    banglaGroup,
    englishCase,
    playMode,
    items,
    setupNextQuiz,
    setupNextBubbles,
    clearPendingTimer,
  ]);

  const handleQuizAnswer = useCallback(
    (option: CurriculumItem) => {
      if (!quizTarget || quizSolved) return;
      if (option.id === quizTarget.id) {
        playSuccessChime();
        setQuizSolved(true);
        triggerMascotCelebrate();
        onCorrectAnswer(quizTarget);
        const cheer =
          option.lang === 'bn'
            ? `দারুণ! একদম ঠিক! ${option.symbol}-তে ${option.word}!`
            : `Awesome! Yes, ${option.symbol} is for ${option.word}!`;
        speakText(cheer, option.lang, voiceEnabledRef.current);
        clearPendingTimer();
        pendingTimerRef.current = window.setTimeout(() => {
          pendingTimerRef.current = null;
          setupNextQuiz(items, true, playMode === 'case-match');
        }, 1650);
      } else {
        playSoftTryAgain();
        setWrongId(option.id);
        const retry =
          option.lang === 'bn'
            ? 'আবার চেষ্টা করি চলো!'
            : 'Almost! Let us try again!';
        speakText(retry, option.lang, voiceEnabledRef.current);
        window.setTimeout(() => setWrongId(null), 650);
      }
    },
    [
      quizTarget,
      quizSolved,
      playMode,
      triggerMascotCelebrate,
      onCorrectAnswer,
      setupNextQuiz,
      items,
      clearPendingTimer,
    ]
  );

  const handleBubbleTap = useCallback(
    (bubble: CurriculumItem) => {
      if (!bubbleTarget || poppedIds.includes(bubble.id)) return;
      if (bubble.id === bubbleTarget.id) {
        playBubblePop();
        playSuccessChime();
        setPoppedIds((prev) => [...prev, bubble.id]);
        triggerMascotCelebrate();
        onCorrectAnswer(bubbleTarget);
        const cheer =
          bubble.lang === 'bn'
            ? `বাহ! '${bubble.symbol}' ফাটিয়ে দিয়েছ!`
            : `Yay! You popped ${bubble.symbol}!`;
        speakText(cheer, bubble.lang, voiceEnabledRef.current);
        clearPendingTimer();
        pendingTimerRef.current = window.setTimeout(() => {
          pendingTimerRef.current = null;
          setupNextBubbles(items, true);
        }, 1550);
      } else {
        playSoftTryAgain();
        setWrongBubbleId(bubble.id);
        const hint =
          bubble.lang === 'bn'
            ? `ওটা '${bubble.symbol}', আমরা খুঁজছি '${bubbleTarget.symbol}'!`
            : `That is ${bubble.symbol}! Let us find ${bubbleTarget.symbol}!`;
        speakText(hint, bubble.lang, voiceEnabledRef.current);
        window.setTimeout(() => setWrongBubbleId(null), 650);
      }
    },
    [
      bubbleTarget,
      poppedIds,
      triggerMascotCelebrate,
      onCorrectAnswer,
      setupNextBubbles,
      items,
      clearPendingTimer,
    ]
  );

  // Laptop Keyboard Playability
  useEffect(() => {
    if (deviceMode !== 'laptop' || playMode === 'speak') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (playMode === 'explore' || playMode === 'trace') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleSelectItem((selectedIndex + 1) % items.length, true);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleSelectItem((selectedIndex - 1 + items.length) % items.length, true);
          return;
        }
        if (e.code === 'Space' && activeItem) {
          e.preventDefault();
          speakText(activeItem.spokenText, activeItem.lang, voiceEnabledRef.current);
          return;
        }
        if (modeType === 'english' && /^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          const idx = e.key.toUpperCase().charCodeAt(0) - 65;
          if (idx >= 0 && idx < items.length) {
            handleSelectItem(idx, true);
          }
        }
      } else if (playMode === 'quiz' || playMode === 'case-match') {
        if (['1', '2', '3'].includes(e.key)) {
          const opt = quizOptions[Number(e.key) - 1];
          if (opt) {
            e.preventDefault();
            handleQuizAnswer(opt);
          }
        } else if (e.code === 'Space' && quizTarget) {
          e.preventDefault();
          speakText(quizTarget.spokenText, quizTarget.lang, voiceEnabledRef.current);
        }
      } else if (playMode === 'bubbles') {
        if (modeType === 'english' && /^[a-zA-Z]$/.test(e.key)) {
          const match = bubbles.find(
            (b) => b.symbol.toUpperCase() === e.key.toUpperCase()
          );
          if (match) {
            e.preventDefault();
            handleBubbleTap(match);
          }
        } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
          const b = bubbles[Number(e.key) - 1];
          if (b) {
            e.preventDefault();
            handleBubbleTap(b);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    deviceMode,
    playMode,
    modeType,
    selectedIndex,
    items,
    activeItem,
    voiceEnabled,
    quizOptions,
    quizTarget,
    bubbles,
    handleSelectItem,
    handleQuizAnswer,
    handleBubbleTap,
  ]);

  const mascotImage =
    modeType === 'bangla' ? IMAGE_ASSETS.tigerMascot : IMAGE_ASSETS.parrotPhonics;
  const mascotName =
    modeType === 'bangla' ? 'টুকু বাঘ' : 'টিয়া পাখি (Phonics)';
  const mascotSpeech =
    playMode === 'explore'
      ? activeItem.spokenText
      : playMode === 'trace'
      ? `আঙুল বা মাউস দিয়ে '${activeItem.symbol}' এর ওপর দাগ টানো!`
      : playMode === 'speak'
      ? `আগে '${activeItem.symbol} — ${activeItem.word}' শোনো, তারপর মাইকে আমার সাথে বলো!`
      : playMode === 'case-match' && quizTarget
      ? `বড় হাতের '${quizTarget.symbol.toUpperCase()}' এর ছোট ভাই কোনটি?`
      : playMode === 'quiz' && quizTarget
      ? modeType === 'bangla'
        ? `বলো তো, কোনটি '${quizTarget.symbol}' (${quizTarget.word})?`
        : `Find letter "${quizTarget.symbol}" (${quizTarget.phoneticCue})`
      : bubbleTarget
      ? modeType === 'bangla'
        ? `'${bubbleTarget.symbol}' লেখা বাবলটি খুঁজে ফাটাও!`
        : `Pop the bubble with "${bubbleTarget.symbol}"!`
      : 'চলো খেলি!';

  const handleMascotRepeat = () => {
    if (playMode === 'explore' || playMode === 'trace') {
      speakText(activeItem.spokenText, activeItem.lang, voiceEnabledRef.current);
    } else if ((playMode === 'quiz' || playMode === 'case-match') && quizTarget) {
      speakText(quizTarget.spokenText, quizTarget.lang, voiceEnabledRef.current);
    } else if (playMode === 'bubbles' && bubbleTarget) {
      speakText(bubbleTarget.spokenText, bubbleTarget.lang, voiceEnabledRef.current);
    }
  };

  return (
    <div className="space-y-5">
      {/* Mascot Companion */}
      <MascotStage
        imageSrc={mascotImage}
        fallbackEmoji={modeType === 'bangla' ? '🐯' : '🦜'}
        name={mascotName}
        speechBubble={mascotSpeech}
        isSpeaking={isSpeaking}
        celebrating={celebrating}
        onTap={handleMascotRepeat}
      />

      {/* Separate English Capital vs Small Section OR Bangla Vowels vs Consonants */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {modeType === 'english' ? (
          <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-emerald-200 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                playPop();
                setEnglishCase('capital');
                if (playMode === 'case-match') setPlayMode('explore');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                englishCase === 'capital' && playMode !== 'case-match'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Capital Letters (A–Z)
            </button>
            <button
              type="button"
              onClick={() => {
                playPop();
                setEnglishCase('small');
                if (playMode === 'case-match') setPlayMode('explore');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                englishCase === 'small' && playMode !== 'case-match'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Small Letters (a–z)
            </button>
            <button
              type="button"
              onClick={() => {
                playPop();
                setPlayMode('case-match');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                playMode === 'case-match'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>A ↔ a মেলাও</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-amber-200 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                playPop();
                setBanglaGroup('vowels');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                banglaGroup === 'vowels'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              স্বরবর্ণ (অ–ঔ)
            </button>
            <button
              type="button"
              onClick={() => {
                playPop();
                setBanglaGroup('consonants');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                banglaGroup === 'consonants'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              ব্যঞ্জনবর্ণ (ক–ঁ)
            </button>
          </div>
        )}

        {/* Activity Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border-2 border-slate-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              setPlayMode('explore');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              playMode === 'explore'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>কার্টুন ও শব্দ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setPlayMode('quiz');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              playMode === 'quiz'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>ধ্বনি মেলাও</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setPlayMode('bubbles');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              playMode === 'bubbles'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>বাবল ফাটাও</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setPlayMode('trace');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              playMode === 'trace'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>হাত ঘুরিয়ে লিখি</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setPlayMode('speak');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              playMode === 'speak'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>আমার সাথে বলো</span>
          </button>
        </div>
      </div>

      {/* Laptop Keyboard Shortcut Hint Strip */}
      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
          <span>
            💻 ল্যাপটপ কিবোর্ড:{' '}
            {playMode === 'explore' || playMode === 'trace'
              ? modeType === 'english'
                ? 'A–Z চাপলে বর্ণ বদলাবে · ← → আগের/পরের · Space আবার শোনাবে'
                : '← → বোতামে আগের/পরের বর্ণ · Space আবার শোনাবে'
              : playMode === 'speak'
              ? 'Space শোনো ও মাইকে বলো · ← → আগের বা পরের বর্ণ'
              : playMode === 'quiz' || playMode === 'case-match'
              ? 'কিবোর্ডে 1, 2 বা 3 চাপলেই উত্তর হয়ে যাবে · Space প্রশ্ন শোনাবে'
              : 'কিবোর্ডে অক্ষর বা 1–6 চাপলে বাবল ফাটবে!'}
          </span>
          <span className="text-amber-300 font-bold tabular-nums">
            সেশন: {toBanglaDigits(sessionStars)} / ৫ ★
          </span>
        </div>
      )}

      {/* MODE 1: VIDEO-ANIMATED EXPLORE + LETTER GRID */}
      {playMode === 'explore' && activeItem && (
        <div className="space-y-5">
          <AnimatedCartoonTheater
            symbol={activeItem.symbol}
            word={activeItem.word}
            wordMeaningBn={activeItem.wordMeaningBn}
            emoji={activeItem.emoji}
            imageUrl={activeItem.imageUrl}
            phoneticCue={activeItem.phoneticCue}
            isSpeaking={isSpeaking}
            onReplayAudio={() =>
              speakText(activeItem.spokenText, activeItem.lang, voiceEnabledRef.current)
            }
          />

          {/* Quick Prev / Next Navigation Row */}
          <div className="flex items-center justify-between gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                handleSelectItem(
                  (selectedIndex - 1 + items.length) % items.length,
                  true
                )
              }
              className="min-h-[50px] px-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>আগের বর্ণ</span>
            </motion.button>

            <div className="text-sm font-bold text-slate-600 tabular-nums">
              {toBanglaDigits(selectedIndex + 1)} / {toBanglaDigits(items.length)}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                handleSelectItem((selectedIndex + 1) % items.length, true)
              }
              className="min-h-[50px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>পরের বর্ণ</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2.5 sm:gap-3">
            {items.map((item, idx) => {
              const isActive = idx === selectedIndex;
              const isMastered = masteredIds.includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectItem(idx, true)}
                  className={`relative min-h-[64px] rounded-2xl border-2 p-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
                  }`}
                >
                  <span className="font-display text-2xl sm:text-3xl font-bold leading-none">
                    {item.symbol}
                  </span>
                  <ObjectThumb
                    imageUrl={item.imageUrl}
                    emoji={item.emoji}
                    alt={item.word}
                    className="w-8 h-8 rounded-lg object-cover mt-1 border border-slate-200/70 bg-white"
                    emojiClassName="text-lg mt-0.5 leading-none"
                  />
                  {isMastered && !isActive && (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-500 absolute top-1 right-1"
                      aria-label="শেখা হয়েছে"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: PHONICS QUIZ OR BIG/SMALL CASE MATCH */}
      {(playMode === 'quiz' || playMode === 'case-match') && quizTarget && (
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-5 sm:p-8 shadow-xs space-y-6 text-center">
          {/* 5-Star Mini-Session Goal Bar */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.div
                key={n}
                animate={sessionStars >= n ? { scale: [1, 1.25, 1] } : undefined}
              >
                <Star
                  className={`w-6 h-6 ${
                    sessionStars >= n
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-200'
                  }`}
                />
              </motion.div>
            ))}
          </div>

          {playMode === 'case-match' ? (
            <div className="space-y-3">
              <p className="text-base sm:text-lg font-bold text-slate-700">
                বড় ভাই Capital Letter-এর সাথে ছোট ভাই Small Letter মেলাও!
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="mx-auto w-28 h-28 rounded-3xl bg-amber-50 border-4 border-amber-300 flex items-center justify-center font-display text-6xl font-bold text-slate-900 shadow-xs">
                  {quizTarget.symbol.toUpperCase()}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() =>
                    speakText(
                      `Find the small letter for capital ${quizTarget.symbol.toUpperCase()}!`,
                      'en',
                      voiceEnabledRef.current
                    )
                  }
                  className="min-h-[44px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>ধ্বনি আবার শোনো</span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-base sm:text-lg font-bold text-slate-700">
                {modeType === 'bangla'
                  ? 'উচ্চারণ শুনে সঠিক বর্ণটিতে ট্যাপ করো!'
                  : 'Listen to the phonics sound & pick the right letter!'}
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  speakText(quizTarget.spokenText, quizTarget.lang, voiceEnabledRef.current)
                }
                className="mx-auto min-h-[56px] px-7 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg inline-flex items-center gap-2.5 shadow-sm cursor-pointer"
              >
                <Volume2 className="w-6 h-6" />
                <span>ধ্বনি আবার শোনো</span>
              </motion.button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {quizOptions.map((opt, idx) => {
              const isWrong = wrongId === opt.id;
              const isCorrect = quizSolved && opt.id === quizTarget.id;
              const displayChar =
                playMode === 'case-match'
                  ? opt.symbol.toLowerCase()
                  : opt.symbol;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  animate={
                    isWrong
                      ? { x: [0, -10, 10, -8, 8, 0] }
                      : isCorrect
                      ? { scale: [1, 1.08, 1], y: [0, -10, 0] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.45 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`relative min-h-[140px] rounded-3xl border-2 p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-md'
                      : isWrong
                      ? 'bg-amber-50 border-amber-300 text-slate-500 opacity-75'
                      : `${opt.accentBg} ${opt.accentBorder} hover:border-emerald-400 text-slate-900`
                  }`}
                >
                  {deviceMode === 'laptop' && (
                    <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                  <span className="font-display text-4xl sm:text-5xl font-bold leading-none">
                    {displayChar}
                  </span>
                  <motion.div
                    animate={isCorrect ? { scale: 1.25 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                  >
                    <ObjectThumb
                      imageUrl={opt.imageUrl}
                      emoji={opt.emoji}
                      alt={opt.word}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-xs bg-white"
                      emojiClassName="text-4xl leading-none"
                    />
                  </motion.div>
                  <span className="text-sm font-bold text-slate-700">{opt.word}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: FLOATING BUBBLE POP GAME */}
      {playMode === 'bubbles' && bubbleTarget && (
        <div className="bg-gradient-to-b from-sky-50 to-emerald-50 rounded-3xl border-2 border-sky-200 p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-14 h-14 rounded-2xl bg-white border-2 border-sky-200 flex items-center justify-center font-display text-3xl font-bold text-sky-700 shadow-xs">
                {bubbleTarget.symbol}
              </span>
              <div>
                <div className="text-sm font-semibold text-sky-700 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>বাবল পপ খেলা</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-800">
                  {modeType === 'bangla'
                    ? `'${bubbleTarget.symbol}' লেখা বাবলে ট্যাপ করে ফাটাও!`
                    : `Pop the "${bubbleTarget.symbol}" bubble! (${bubbleTarget.word})`}
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                speakText(bubbleTarget.spokenText, bubbleTarget.lang, voiceEnabledRef.current)
              }
              className="min-h-[48px] px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>শোনো</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 py-3">
            {bubbles.map((b, idx) => {
              const isPopped = poppedIds.includes(b.id);
              const isWrong = wrongBubbleId === b.id;
              return (
                <div key={b.id} className="flex items-center justify-center min-h-[124px]">
                  <AnimatePresence>
                    {!isPopped ? (
                      <motion.button
                        type="button"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={
                          isWrong
                            ? { x: [0, -8, 8, -5, 0], y: 0, scale: 1, opacity: 1 }
                            : {
                                y: [0, -10 - (idx % 3) * 4, 0],
                                scale: 1,
                                opacity: 1,
                              }
                        }
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={
                          isWrong
                            ? { duration: 0.35 }
                            : {
                                y: {
                                  duration: 2.4 + (idx % 3) * 0.4,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                },
                                scale: { duration: 0.25 },
                              }
                        }
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleBubbleTap(b)}
                        className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 shadow-sm flex flex-col items-center justify-center cursor-pointer ${
                          BUBBLE_COLORS[idx % BUBBLE_COLORS.length]
                        }`}
                      >
                        {deviceMode === 'laptop' && (
                          <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                            {idx + 1}
                          </span>
                        )}
                        <span className="font-display text-3xl sm:text-4xl font-bold leading-none">
                          {b.symbol}
                        </span>
                        <ObjectThumb
                          imageUrl={b.imageUrl}
                          emoji={b.emoji}
                          alt={b.word}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover mt-1 border-2 border-white shadow-xs bg-white"
                          emojiClassName="text-2xl mt-1 leading-none"
                        />
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 1 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-emerald-600"
                      >
                        ★ দারুণ!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 4: MAGIC RAINBOW LETTER TRACING */}
      {playMode === 'trace' && activeItem && (
        <div className="space-y-4">
          <MagicTracingPad
            character={activeItem.symbol}
            label={`${activeItem.symbol} (${activeItem.word})`}
            lang={activeItem.lang}
            voiceEnabled={voiceEnabled}
            onCompleteTrace={() => {
              triggerMascotCelebrate();
              onCorrectAnswer(activeItem);
            }}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                handleSelectItem(
                  (selectedIndex - 1 + items.length) % items.length,
                  true
                )
              }
              className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>আগের বর্ণ</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectItem((selectedIndex + 1) % items.length, true)
              }
              className="min-h-[48px] px-5 rounded-2xl bg-amber-500 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>পরের বর্ণ</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* MODE 5: SPEAK WITH ME (MICROPHONE PRACTICE) */}
      {playMode === 'speak' && activeItem && (
        <SpeakWithMe
          deviceMode={deviceMode}
          voiceEnabled={voiceEnabled}
          isSpeaking={isSpeaking}
          masteredIds={masteredIds}
          embeddedItem={activeItem}
          onExploreItem={onExploreItem}
          onSuccessSpeak={(item) => {
            triggerMascotCelebrate();
            onCorrectAnswer(item);
          }}
          onPrevEmbedded={() =>
            handleSelectItem((selectedIndex - 1 + items.length) % items.length, false)
          }
          onNextEmbedded={() =>
            handleSelectItem((selectedIndex + 1) % items.length, false)
          }
        />
      )}
    </div>
  );
}
