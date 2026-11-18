import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  CheckCircle2,
  Sparkles,
  Hash,
  Award,
  HelpCircle,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Target,
  Globe,
  Crown,
} from 'lucide-react';
import {
  NUMBERS_1_TO_100,
  NumberItem,
  IMAGE_ASSETS,
  toBanglaDigits,
  toRomanNumeral,
} from '../data/curriculum';
import {
  playPop,
  playCountTick,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';
import { MagicTracingPad } from './MagicTracingPad';
import { NumberHuntGame } from './NumberHuntGame';

type NumberMode =
  | 'bangla'
  | 'english'
  | 'roman'
  | 'count-quiz'
  | 'roman-quiz'
  | 'number-hunt'
  | 'trace';

type TraceScript = 'bangla' | 'english' | 'roman';

interface NumbersRomanPlaygroundProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  masteredIds: string[];
  onExploreNumber: (num: NumberItem) => void;
  onCorrectAnswer: (num: NumberItem) => void;
}

const DECADE_RANGES = Array.from({ length: 10 }, (_, idx) => {
  const start = idx * 10 + 1;
  const end = idx * 10 + 10;
  return {
    idx,
    start,
    end,
    labelBn: `${toBanglaDigits(start)}–${toBanglaDigits(end)}`,
    labelEn: `${start}–${end}`,
    labelRoman: `${toRomanNumeral(start)}–${toRomanNumeral(end)} (${start}–${end})`,
  };
});

const ROMAN_KEY_SYMBOLS = [
  { sym: 'I', val: 1, bn: 'এক', spoken: 'আই মানে এক, ওয়ান' },
  { sym: 'V', val: 5, bn: 'পাঁচ', spoken: 'ভি মানে পাঁচ, ফাইভ' },
  { sym: 'X', val: 10, bn: 'দশ', spoken: 'এক্স মানে দশ, টেন' },
  { sym: 'L', val: 50, bn: 'পঞ্চাশ', spoken: 'এল মানে পঞ্চাশ, ফিফটি' },
  { sym: 'C', val: 100, bn: 'একশো', spoken: 'সি মানে একশো, ওয়ান হান্ড্রেড' },
];

const COUNT_ITEMS = ['🍎', '🐥', '🌟', '🍓', '🦋'];

export function NumbersRomanPlayground({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  masteredIds,
  onExploreNumber,
  onCorrectAnswer,
}: NumbersRomanPlaygroundProps) {
  const [mode, setMode] = useState<NumberMode>('bangla');
  const [traceScript, setTraceScript] = useState<TraceScript>('bangla');
  const [decadeIdx, setDecadeIdx] = useState(0);
  const [selectedVal, setSelectedVal] = useState(1);
  const [tappedCounters, setTappedCounters] = useState<number[]>([]);
  const [celebrating, setCelebrating] = useState(false);

  // Count Quiz state
  const [countTarget, setCountTarget] = useState<NumberItem>(NUMBERS_1_TO_100[2]);
  const [countOptions, setCountOptions] = useState<NumberItem[]>([]);
  const [countEmoji, setCountEmoji] = useState('🍎');
  const [countWrong, setCountWrong] = useState<number | null>(null);
  const [countSolved, setCountSolved] = useState(false);
  const [quizTapped, setQuizTapped] = useState<number[]>([]);

  // Roman Quiz state (covers 1–100 milestones!)
  const [romanTarget, setRomanTarget] = useState<NumberItem>(NUMBERS_1_TO_100[4]);
  const [romanOptions, setRomanOptions] = useState<NumberItem[]>([]);
  const [romanWrong, setRomanWrong] = useState<number | null>(null);
  const [romanSolved, setRomanSolved] = useState(false);

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

  const decadeNumbers = useMemo(() => {
    const start = decadeIdx * 10;
    return NUMBERS_1_TO_100.slice(start, start + 10);
  }, [decadeIdx]);

  const activeNumber = NUMBERS_1_TO_100[selectedVal - 1] ?? NUMBERS_1_TO_100[0];

  const triggerMascotCelebrate = useCallback(() => {
    setCelebrating(true);
    window.setTimeout(() => setCelebrating(false), 900);
  }, []);

  const speakNumberForMode = useCallback(
    (num: NumberItem, activeMode: NumberMode | TraceScript) => {
      if (activeMode === 'english') {
        void speakText(num.englishWord, 'en', voiceEnabledRef.current);
      } else if (activeMode === 'roman') {
        void speakText(
          `রোমান সংখ্যা ${num.roman}, বাংলায় ${num.banglaWord}, ইংরেজিতে ${num.englishWord}`,
          'bn',
          voiceEnabledRef.current
        );
      } else {
        void speakText(num.banglaWord, 'bn', voiceEnabledRef.current);
      }
    },
    []
  );

  const setupCountQuiz = useCallback((speakPrompt = true) => {
    const targetVal = Math.floor(Math.random() * 10) + 1;
    const target = NUMBERS_1_TO_100[targetVal - 1];
    const pool = NUMBERS_1_TO_100.slice(0, 10).filter((n) => n.value !== targetVal);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [target, ...distractors].sort((a, b) => a.value - b.value);
    setCountTarget(target);
    setCountOptions(opts);
    setCountEmoji(COUNT_ITEMS[Math.floor(Math.random() * COUNT_ITEMS.length)]);
    setCountWrong(null);
    setCountSolved(false);
    setQuizTapped([]);
    if (speakPrompt) {
      void speakText('গুনে বলো তো এখানে কয়টি আছে?', 'bn', voiceEnabledRef.current);
    }
  }, []);

  const setupRomanQuiz = useCallback((speakPrompt = true) => {
    const friendlyValues = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 19, 20, 25, 30, 40, 50,
      60, 70, 80, 90, 100,
    ];
    const pickedVal =
      friendlyValues[Math.floor(Math.random() * friendlyValues.length)];
    const target = NUMBERS_1_TO_100[pickedVal - 1];
    const others = friendlyValues
      .filter((v) => v !== pickedVal)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((v) => NUMBERS_1_TO_100[v - 1]);
    const opts = [target, ...others].sort(() => Math.random() - 0.5);
    setRomanTarget(target);
    setRomanOptions(opts);
    setRomanWrong(null);
    setRomanSolved(false);
    if (speakPrompt) {
      void speakText(
        `${target.banglaWord} এর রোমান সংখ্যা কোনটি?`,
        'bn',
        voiceEnabledRef.current
      );
    }
  }, []);

  useEffect(() => {
    clearPendingTimer();
    if (mode === 'count-quiz') {
      setupCountQuiz(true);
    } else if (mode === 'roman-quiz') {
      setupRomanQuiz(true);
    }
  }, [mode, setupCountQuiz, setupRomanQuiz, clearPendingTimer]);

  const handleSelectNumber = useCallback(
    (num: NumberItem) => {
      playPop();
      setSelectedVal(num.value);
      setDecadeIdx(Math.floor((num.value - 1) / 10));
      setTappedCounters([]);
      onExploreNumber(num);
      const speechScript = mode === 'trace' ? traceScript : mode;
      speakNumberForMode(num, speechScript);
    },
    [mode, traceScript, onExploreNumber, speakNumberForMode]
  );

  const handleTapCounterObject = (idx: number) => {
    playCountTick(idx + 1);
    setTappedCounters((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    const countItem = NUMBERS_1_TO_100[idx];
    if (countItem) {
      if (mode === 'english') {
        void speakText(countItem.englishWord, 'en', voiceEnabledRef.current);
      } else {
        void speakText(countItem.banglaWord, 'bn', voiceEnabledRef.current);
      }
    }
  };

  const handleCountAnswer = useCallback(
    (choice: NumberItem) => {
      if (countSolved) return;
      if (choice.value === countTarget.value) {
        playSuccessChime();
        setCountSolved(true);
        triggerMascotCelebrate();
        onCorrectAnswer(countTarget);
        void speakText(
          `দারুণ! এখানে ${countTarget.banglaWord}টি আছে!`,
          'bn',
          voiceEnabledRef.current
        );
        clearPendingTimer();
        pendingTimerRef.current = window.setTimeout(() => {
          pendingTimerRef.current = null;
          setupCountQuiz(true);
        }, 1700);
      } else {
        playSoftTryAgain();
        setCountWrong(choice.value);
        void speakText('আরেকবার গুনে দেখো তো!', 'bn', voiceEnabledRef.current);
        window.setTimeout(() => setCountWrong(null), 650);
      }
    },
    [
      countSolved,
      countTarget,
      triggerMascotCelebrate,
      onCorrectAnswer,
      setupCountQuiz,
      clearPendingTimer,
    ]
  );

  const handleRomanAnswer = useCallback(
    (choice: NumberItem) => {
      if (romanSolved) return;
      if (choice.value === romanTarget.value) {
        playSuccessChime();
        setRomanSolved(true);
        triggerMascotCelebrate();
        onCorrectAnswer(romanTarget);
        void speakText(
          `বাহ! ${romanTarget.banglaWord} হলো রোমান ${romanTarget.roman}!`,
          'bn',
          voiceEnabledRef.current
        );
        clearPendingTimer();
        pendingTimerRef.current = window.setTimeout(() => {
          pendingTimerRef.current = null;
          setupRomanQuiz(true);
        }, 1700);
      } else {
        playSoftTryAgain();
        setRomanWrong(choice.value);
        void speakText('আবার চেষ্টা করি চলো!', 'bn', voiceEnabledRef.current);
        window.setTimeout(() => setRomanWrong(null), 650);
      }
    },
    [
      romanSolved,
      romanTarget,
      triggerMascotCelebrate,
      onCorrectAnswer,
      setupRomanQuiz,
      clearPendingTimer,
    ]
  );

  const isExploreMode =
    mode === 'bangla' || mode === 'english' || mode === 'roman';

  // Laptop Keyboard Controls
  useEffect(() => {
    if (deviceMode !== 'laptop' || mode === 'number-hunt') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (isExploreMode || mode === 'trace') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = selectedVal === 100 ? 1 : selectedVal + 1;
          handleSelectNumber(NUMBERS_1_TO_100[next - 1]);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = selectedVal === 1 ? 100 : selectedVal - 1;
          handleSelectNumber(NUMBERS_1_TO_100[prev - 1]);
        } else if (e.code === 'Space') {
          e.preventDefault();
          speakNumberForMode(
            activeNumber,
            mode === 'trace' ? traceScript : mode
          );
        } else if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          const val = e.key === '0' ? 10 : Number(e.key);
          handleSelectNumber(NUMBERS_1_TO_100[val - 1]);
        }
      } else if (mode === 'count-quiz' && ['1', '2', '3'].includes(e.key)) {
        const opt = countOptions[Number(e.key) - 1];
        if (opt) {
          e.preventDefault();
          handleCountAnswer(opt);
        }
      } else if (mode === 'roman-quiz' && ['1', '2', '3'].includes(e.key)) {
        const opt = romanOptions[Number(e.key) - 1];
        if (opt) {
          e.preventDefault();
          handleRomanAnswer(opt);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    deviceMode,
    mode,
    traceScript,
    isExploreMode,
    selectedVal,
    activeNumber,
    countOptions,
    romanOptions,
    handleSelectNumber,
    speakNumberForMode,
    handleCountAnswer,
    handleRomanAnswer,
  ]);

  const tensCount = Math.floor(activeNumber.value / 10);
  const onesCount = activeNumber.value % 10;

  const mascotSpeech =
    mode === 'bangla'
      ? `বাংলা সংখ্যা: ${activeNumber.banglaDigit} · বানান: ${activeNumber.banglaWord}`
      : mode === 'english'
      ? `English Number: ${activeNumber.value} · Word: ${activeNumber.englishWord}`
      : mode === 'roman'
      ? `রোমান সংখ্যা: ${activeNumber.roman} (মান ${activeNumber.banglaDigit} / ${activeNumber.value})`
      : mode === 'trace'
      ? `আঙুল বা মাউস দিয়ে '${
          traceScript === 'bangla'
            ? activeNumber.banglaDigit
            : traceScript === 'english'
            ? activeNumber.value
            : activeNumber.roman
        }' লিখে ফেলো!`
      : mode === 'count-quiz'
      ? 'সবগুলো গুনে সঠিক সংখ্যায় ট্যাপ করো!'
      : mode === 'number-hunt'
      ? '১ থেকে ১০ পর্যন্ত ছোট থেকে বড় সাজিয়ে সংখ্যাগুলোতে ট্যাপ করো!'
      : `${romanTarget.banglaDigit} (${romanTarget.value}) এর রোমান সংখ্যা খুঁজে বের করো!`;

  const themeCardClasses =
    mode === 'bangla'
      ? 'bg-amber-50 border-amber-200'
      : mode === 'english'
      ? 'bg-sky-50 border-sky-200'
      : 'bg-emerald-50 border-emerald-200';

  const traceChar =
    traceScript === 'bangla'
      ? activeNumber.banglaDigit
      : traceScript === 'english'
      ? String(activeNumber.value)
      : activeNumber.roman;

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={IMAGE_ASSETS.elephantMath}
        fallbackEmoji="🐘"
        name="হাতু হাতি (বাংলা · English · রোমান ১–১০০)"
        speechBubble={mascotSpeech}
        isSpeaking={isSpeaking}
        celebrating={celebrating}
        onTap={() => {
          if (isExploreMode || mode === 'trace') {
            speakNumberForMode(
              activeNumber,
              mode === 'trace' ? traceScript : mode
            );
          } else if (mode === 'count-quiz') {
            void speakText(
              'গুনে বলো তো এখানে কয়টি আছে?',
              'bn',
              voiceEnabledRef.current
            );
          } else if (mode === 'number-hunt') {
            void speakText(
              'এক থেকে দশ পর্যন্ত ছোট থেকে বড় সাজিয়ে সংখ্যাগুলোতে ট্যাপ করো!',
              'bn',
              voiceEnabledRef.current
            );
          } else {
            void speakText(
              `${romanTarget.banglaWord} এর রোমান সংখ্যা কোনটি?`,
              'bn',
              voiceEnabledRef.current
            );
          }
        }}
      />

      {/* Separated Mode Switcher: Bangla (1-100) | English (1-100) | Roman (I-C) | Games | Trace */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border-2 border-slate-200 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('bangla');
            speakNumberForMode(activeNumber, 'bangla');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'bangla'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-700 hover:bg-amber-50'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>বাংলা (১–১০০)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('english');
            speakNumberForMode(activeNumber, 'english');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'english'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-700 hover:bg-sky-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>English (1–100)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('roman');
            speakNumberForMode(activeNumber, 'roman');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'roman'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>রোমান (I–C / ১–১০০)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('count-quiz');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'count-quiz'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>গুনে বের করো</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('roman-quiz');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'roman-quiz'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>রোমান খেলা</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('number-hunt');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'number-hunt'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>সংখ্যা শিকার (১–১০)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMode('trace');
          }}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mode === 'trace'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>সংখ্যা লিখি</span>
        </button>
      </div>

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 ল্যাপটপ কিবোর্ড:{' '}
          {isExploreMode || mode === 'trace'
            ? '0–9 বা ← → বোতামে সংখ্যা বদলাও · Space আবার শোনাবে'
            : mode === 'number-hunt'
            ? '1–9 এবং 0 (১০) চাপলে সংখ্যা ধরবে · R নতুন খেলা'
            : 'কিবোর্ডে 1, 2 বা 3 চাপলেই উত্তর হয়ে যাবে!'}
        </div>
      )}

      {/* SEPARATED MODE 1, 2, 3: BANGLA (1-100), ENGLISH (1-100), OR ROMAN (I-C / 1-100) */}
      {isExploreMode && (
        <div className="space-y-5">
          {/* Roman Symbol Quick Legend (Only in Roman Mode) */}
          {mode === 'roman' && (
            <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-3xl p-4 space-y-2.5">
              <div className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-emerald-600" />
                <span>রোমান সংখ্যার মূল ৫টি চিহ্ন (ট্যাপ করে শোনো):</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ROMAN_KEY_SYMBOLS.map((item) => (
                  <motion.button
                    key={item.sym}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => {
                      playPop();
                      handleSelectNumber(NUMBERS_1_TO_100[item.val - 1]);
                      void speakText(item.spoken, 'bn', voiceEnabledRef.current);
                    }}
                    className={`rounded-2xl border-2 p-2.5 text-center transition-colors cursor-pointer ${
                      activeNumber.value === item.val
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                        : 'bg-white border-emerald-200 hover:border-emerald-400 text-slate-900'
                    }`}
                  >
                    <div className="font-display text-2xl sm:text-3xl font-bold leading-none">
                      {item.sym}
                    </div>
                    <div
                      className={`text-xs font-bold mt-1 tabular-nums ${
                        activeNumber.value === item.val
                          ? 'text-emerald-100'
                          : 'text-emerald-700'
                      }`}
                    >
                      {toBanglaDigits(item.val)} ({item.val})
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Decade Range Filter (1–100) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DECADE_RANGES.map((range) => {
              const active = range.idx === decadeIdx;
              const activeClass =
                mode === 'bangla'
                  ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                  : mode === 'english'
                  ? 'bg-sky-500 border-sky-600 text-white shadow-xs'
                  : 'bg-emerald-600 border-emerald-700 text-white shadow-xs';
              const label =
                mode === 'bangla'
                  ? range.labelBn
                  : mode === 'english'
                  ? range.labelEn
                  : range.labelRoman;

              return (
                <button
                  key={range.idx}
                  type="button"
                  onClick={() => {
                    const first = NUMBERS_1_TO_100[range.start - 1];
                    if (first) {
                      handleSelectNumber(first);
                    } else {
                      playPop();
                      setDecadeIdx(range.idx);
                    }
                  }}
                  className={`min-h-[44px] px-3.5 py-2 rounded-2xl border-2 text-sm font-bold tabular-nums whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? activeClass
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Active Number Spotlight Stage */}
          <motion.div
            key={`${mode}-${activeNumber.value}`}
            initial={{ opacity: 0.75, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className={`rounded-3xl border-2 p-5 sm:p-6 shadow-sm space-y-5 ${themeCardClasses}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Left Focused Display Card for Chosen Script */}
              <div className="md:col-span-5 bg-white rounded-3xl p-5 border-2 border-white shadow-xs text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                  {mode === 'bangla'
                    ? 'বাংলা সংখ্যা (১–১০০)'
                    : mode === 'english'
                    ? 'English Numbers (1–100)'
                    : 'রোমান সংখ্যা (I–C · ১–১০০)'}
                </div>

                <div className="py-2">
                  <div
                    className={`font-display font-bold tabular-nums leading-none ${
                      mode === 'roman'
                        ? activeNumber.roman.length > 5
                          ? 'text-5xl sm:text-6xl text-emerald-700'
                          : 'text-6xl sm:text-7xl text-emerald-700'
                        : mode === 'bangla'
                        ? 'text-7xl sm:text-8xl text-amber-600'
                        : 'text-7xl sm:text-8xl text-sky-600'
                    }`}
                  >
                    {mode === 'bangla'
                      ? activeNumber.banglaDigit
                      : mode === 'english'
                      ? activeNumber.value
                      : activeNumber.roman}
                  </div>

                  <div className="mt-3">
                    <div className="text-2xl font-bold text-slate-900">
                      {mode === 'bangla'
                        ? activeNumber.banglaWord
                        : mode === 'english'
                        ? activeNumber.englishWord
                        : `${activeNumber.banglaDigit} · ${activeNumber.value}`}
                    </div>
                    {mode === 'roman' && (
                      <div className="text-sm font-semibold text-slate-500 mt-1">
                        {activeNumber.banglaWord} / {activeNumber.englishWord}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = selectedVal === 1 ? 100 : selectedVal - 1;
                      handleSelectNumber(NUMBERS_1_TO_100[prev - 1]);
                    }}
                    aria-label="আগের সংখ্যা"
                    className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => speakNumberForMode(activeNumber, mode)}
                    className={`min-h-[46px] px-5 rounded-2xl text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      mode === 'bangla'
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : mode === 'english'
                        ? 'bg-sky-500 hover:bg-sky-600'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{mode === 'english' ? 'Listen' : 'শোনো'}</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = selectedVal === 100 ? 1 : selectedVal + 1;
                      handleSelectNumber(NUMBERS_1_TO_100[next - 1]);
                    }}
                    aria-label="পরের সংখ্যা"
                    className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right Interactive Visual Counting Area */}
              <div className="md:col-span-7 bg-white rounded-3xl p-4 sm:p-5 border-2 border-white shadow-xs">
                <div className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between">
                  <span>
                    {activeNumber.value <= 20
                      ? mode === 'english'
                        ? 'Tap each apple to count 1, 2, 3!'
                        : 'প্রতিটি আপেলে ট্যাপ করে গুনো!'
                      : mode === 'english'
                      ? `Tens Baskets (${tensCount}×10) & Ones (${onesCount})`
                      : `দশকের ঝুড়ি (${toBanglaDigits(tensCount)}×১০) ও একক (${toBanglaDigits(onesCount)})`}
                  </span>
                  {activeNumber.value <= 20 && tappedCounters.length > 0 && (
                    <span className="text-emerald-600 font-bold tabular-nums">
                      {mode === 'english'
                        ? `Counted: ${tappedCounters.length}`
                        : `গোনা হয়েছে: ${toBanglaDigits(tappedCounters.length)}`}
                    </span>
                  )}
                </div>

                {activeNumber.value <= 20 ? (
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {Array.from({ length: activeNumber.value }, (_, i) => {
                      const isTapped = tappedCounters.includes(i);
                      return (
                        <motion.button
                          key={`${activeNumber.value}-item-${i}`}
                          type="button"
                          initial={{ scale: 0, y: 12 }}
                          animate={{
                            scale: isTapped ? 1.15 : 1,
                            y: 0,
                          }}
                          transition={{
                            delay: i * 0.03,
                            type: 'spring',
                            stiffness: 350,
                            damping: 18,
                          }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleTapCounterObject(i)}
                          className={`w-12 h-12 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            isTapped
                              ? 'bg-emerald-100 border-emerald-400'
                              : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                          }`}
                        >
                          <img
                            src="/images/objects/apple.jpg"
                            alt="Apple"
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-md object-cover"
                          />
                          <span className="text-[10px] font-bold text-slate-600 tabular-nums leading-none mt-0.5">
                            {mode === 'english'
                              ? i + 1
                              : mode === 'roman'
                              ? toRomanNumeral(i + 1)
                              : toBanglaDigits(i + 1)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: tensCount }, (_, t) => (
                        <motion.div
                          key={`ten-${t}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: t * 0.04, type: 'spring' }}
                          className="px-3 py-2 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center gap-1.5"
                        >
                          <span className="text-2xl leading-none">🧺</span>
                          <span className="text-xs font-bold text-amber-900 tabular-nums">
                            {mode === 'english'
                              ? '10'
                              : mode === 'roman'
                              ? 'X (10)'
                              : '১০'}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    {onesCount > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Array.from({ length: onesCount }, (_, o) => (
                          <motion.span
                            key={`one-${o}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.12 + o * 0.035, type: 'spring' }}
                            className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center overflow-hidden p-1"
                          >
                            <img
                              src="/images/objects/apple.jpg"
                              alt="Apple"
                              referrerPolicy="no-referrer"
                              className="w-full h-full rounded-lg object-cover"
                            />
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 10-Card Decade Selector Grid (Strictly Separated per Mode) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {decadeNumbers.map((num) => {
              const isSelected = num.value === activeNumber.value;
              const isMastered = masteredIds.includes(`num-${num.value}`);
              const selectedBtnClass =
                mode === 'bangla'
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : mode === 'english'
                  ? 'bg-sky-500 border-sky-600 text-white shadow-sm'
                  : 'bg-emerald-600 border-emerald-700 text-white shadow-sm';

              return (
                <motion.button
                  key={`${mode}-card-${num.value}`}
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectNumber(num)}
                  className={`relative min-h-[86px] rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                    isSelected
                      ? selectedBtnClass
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                  }`}
                >
                  <span
                    className={`font-display font-bold tabular-nums leading-tight ${
                      mode === 'roman' && num.roman.length > 5
                        ? 'text-xl sm:text-2xl'
                        : 'text-3xl sm:text-4xl'
                    }`}
                  >
                    {mode === 'bangla'
                      ? num.banglaDigit
                      : mode === 'english'
                      ? num.value
                      : num.roman}
                  </span>

                  <span
                    className={`text-xs font-bold leading-tight text-center ${
                      isSelected ? 'text-white/90' : 'text-slate-500'
                    }`}
                  >
                    {mode === 'bangla'
                      ? num.banglaWord
                      : mode === 'english'
                      ? num.englishWord
                      : `${num.banglaDigit} · ${num.value}`}
                  </span>

                  {isMastered && !isSelected && (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-500 absolute top-1.5 right-1.5"
                      aria-label="শেখা হয়েছে"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 4: COUNTING GAME */}
      {mode === 'count-quiz' && (
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-5 sm:p-8 space-y-6 text-center shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
              <Sparkles className="w-4 h-4" />
              <span>গুনে বের করো</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              এখানে মোট কয়টি ছবি আছে?
            </h3>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 max-w-xl mx-auto flex flex-wrap items-center justify-center gap-3 min-h-[140px]">
            {Array.from({ length: countTarget.value }, (_, i) => {
              const tapped = quizTapped.includes(i);
              return (
                <motion.button
                  key={`${countTarget.value}-${i}`}
                  type="button"
                  initial={{ scale: 0, y: 15 }}
                  animate={{ scale: tapped ? 1.15 : 1, y: [0, -6, 0] }}
                  transition={{
                    scale: { delay: i * 0.05, type: 'spring' },
                    y: {
                      delay: i * 0.1,
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    playCountTick(i + 1);
                    setQuizTapped((prev) => (prev.includes(i) ? prev : [...prev, i]));
                    const itemWord = NUMBERS_1_TO_100[i]?.banglaWord;
                    if (itemWord) {
                      void speakText(itemWord, 'bn', voiceEnabledRef.current);
                    }
                  }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    tapped
                      ? 'bg-emerald-200 border-emerald-500'
                      : 'bg-white/80 border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl select-none leading-none">
                    {countEmoji}
                  </span>
                  {tapped && (
                    <span className="text-[11px] font-bold text-emerald-900 tabular-nums leading-none mt-0.5">
                      {toBanglaDigits(i + 1)}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            {countOptions.map((opt, idx) => {
              const isWrong = countWrong === opt.value;
              const isCorrect = countSolved && opt.value === countTarget.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  animate={
                    isWrong
                      ? { x: [0, -8, 8, -5, 0] }
                      : isCorrect
                      ? { scale: [1, 1.1, 1] }
                      : { scale: 1 }
                  }
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleCountAnswer(opt)}
                  className={`relative min-h-[92px] rounded-3xl border-2 p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : isWrong
                      ? 'bg-amber-50 border-amber-300 opacity-75'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-400 text-slate-900'
                  }`}
                >
                  {deviceMode === 'laptop' && (
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                  <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none">
                    {opt.banglaDigit}
                  </span>
                  <span
                    className={`text-sm font-bold mt-1 tabular-nums ${
                      isCorrect ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {opt.value} · {opt.roman}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 5: ROMAN NUMERAL MATCH GAME */}
      {mode === 'roman-quiz' && (
        <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 sm:p-8 space-y-6 text-center shadow-xs">
          <div className="space-y-2">
            <p className="text-base sm:text-lg font-bold text-slate-700">
              নিচের সংখ্যাটির সঠিক রোমান সংখ্যা (Roman Numeral) কোনটি?
            </p>
            <motion.div
              key={romanTarget.value}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto w-fit px-8 py-5 rounded-3xl bg-amber-50 border-2 border-amber-200"
            >
              <div className="font-display text-5xl sm:text-6xl font-bold text-slate-900 tabular-nums">
                {romanTarget.banglaDigit}{' '}
                <span className="text-amber-600 text-3xl sm:text-4xl">
                  ({romanTarget.value})
                </span>
              </div>
              <div className="text-base font-bold text-slate-600 mt-1">
                {romanTarget.banglaWord} · {romanTarget.englishWord}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            {romanOptions.map((opt, idx) => {
              const isWrong = romanWrong === opt.value;
              const isCorrect = romanSolved && opt.value === romanTarget.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  animate={
                    isWrong
                      ? { x: [0, -8, 8, -5, 0] }
                      : isCorrect
                      ? { scale: [1, 1.12, 1] }
                      : { scale: 1 }
                  }
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleRomanAnswer(opt)}
                  className={`relative min-h-[88px] rounded-3xl border-2 p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : isWrong
                      ? 'bg-amber-50 border-amber-300 opacity-75'
                      : 'bg-sky-50 border-sky-200 hover:border-amber-400 text-slate-900'
                  }`}
                >
                  {deviceMode === 'laptop' && (
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                  <span className="font-display text-3xl sm:text-4xl font-bold tracking-wider">
                    {opt.roman}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 6: NUMBER HUNT (1-10) */}
      {mode === 'number-hunt' && (
        <NumberHuntGame
          deviceMode={deviceMode}
          voiceEnabled={voiceEnabled}
          onWinStar={() => {
            triggerMascotCelebrate();
            onCorrectAnswer(NUMBERS_1_TO_100[9]);
          }}
        />
      )}

      {/* MODE 7: TRACE NUMBERS (Bangla 1-100 | English 1-100 | Roman I-C) */}
      {mode === 'trace' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border-2 border-slate-200 rounded-2xl p-2">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'bangla', label: 'বাংলা (১–১০০)' },
                  { id: 'english', label: 'English (1–100)' },
                  { id: 'roman', label: 'রোমান (I–C)' },
                ] as const
              ).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    playPop();
                    setTraceScript(sc.id);
                    speakNumberForMode(activeNumber, sc.id);
                  }}
                  className={`min-h-[40px] px-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    traceScript === sc.id
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-slate-500 px-2 tabular-nums">
              বর্তমান সংখ্যা: {toBanglaDigits(activeNumber.value)} / ১০০
            </div>
          </div>

          <MagicTracingPad
            character={traceChar}
            label={
              traceScript === 'bangla'
                ? `${activeNumber.banglaDigit} · ${activeNumber.banglaWord}`
                : traceScript === 'english'
                ? `${activeNumber.value} · ${activeNumber.englishWord}`
                : `${activeNumber.roman} (${activeNumber.banglaDigit} / ${activeNumber.value})`
            }
            lang={traceScript === 'english' ? 'en' : 'bn'}
            voiceEnabled={voiceEnabled}
            onCompleteTrace={() => onCorrectAnswer(activeNumber)}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const prev = selectedVal === 1 ? 100 : selectedVal - 1;
                handleSelectNumber(NUMBERS_1_TO_100[prev - 1]);
              }}
              className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>আগের সংখ্যা</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = selectedVal === 100 ? 1 : selectedVal + 1;
                handleSelectNumber(NUMBERS_1_TO_100[next - 1]);
              }}
              className="min-h-[48px] px-5 rounded-2xl bg-sky-500 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>পরের সংখ্যা</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
