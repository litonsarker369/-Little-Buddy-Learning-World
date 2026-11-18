import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Sparkles, Play, Volume2 } from 'lucide-react';
import { IMAGE_ASSETS, toBanglaDigits, NUMBERS_1_TO_100 } from '../data/curriculum';
import {
  playPop,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';

type MathFilter = 'mixed' | 'add' | 'subtract';

interface MathPuzzle {
  id: number;
  op: 'add' | 'subtract';
  left: number;
  right: number;
  answer: number;
  options: number[];
  emoji: string;
  imageUrl?: string;
  itemNameBn: string;
}

interface VisualMathGardenProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  onCorrectMath: (puzzleId: string) => void;
}

const MATH_THEMES = [
  { emoji: '🍎', imageUrl: '/images/objects/apple.jpg', itemNameBn: 'আপেল' },
  { emoji: '🦋', imageUrl: '/images/objects/butterfly.jpg', itemNameBn: 'প্রজাপতি' },
  { emoji: '🍌', imageUrl: '/images/objects/banana.jpg', itemNameBn: 'কলা' },
  { emoji: '🦜', imageUrl: '/images/objects/parrot.jpg', itemNameBn: 'টিয়া পাখি' },
];

function generatePuzzle(filter: MathFilter, id: number): MathPuzzle {
  const op: 'add' | 'subtract' =
    filter === 'mixed'
      ? Math.random() > 0.5
        ? 'add'
        : 'subtract'
      : filter;

  const theme = MATH_THEMES[Math.floor(Math.random() * MATH_THEMES.length)];

  let left = 1;
  let right = 1;
  let answer = 2;

  if (op === 'add') {
    left = Math.floor(Math.random() * 5) + 1;
    right = Math.floor(Math.random() * 4) + 1;
    answer = left + right;
  } else {
    left = Math.floor(Math.random() * 5) + 3;
    right = Math.floor(Math.random() * (left - 1)) + 1;
    answer = left - right;
  }

  const candidateSet = new Set<number>([answer]);
  while (candidateSet.size < 3) {
    const offset = Math.floor(Math.random() * 5) - 2;
    const alt = Math.max(1, Math.min(10, answer + offset));
    candidateSet.add(alt);
  }
  const options = Array.from(candidateSet).sort((a, b) => a - b);

  return {
    id,
    op,
    left,
    right,
    answer,
    options,
    emoji: theme.emoji,
    imageUrl: theme.imageUrl,
    itemNameBn: theme.itemNameBn,
  };
}

export function VisualMathGarden({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  onCorrectMath,
}: VisualMathGardenProps) {
  const [filter, setFilter] = useState<MathFilter>('mixed');
  const [puzzle, setPuzzle] = useState<MathPuzzle>(() => generatePuzzle('mixed', 1));
  const [animateAction, setAnimateAction] = useState(false);
  const [wrongVal, setWrongVal] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const pendingTimerRef = useRef<number | null>(null);
  const animTimerRef = useRef<number | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPendingTimers();
  }, [clearPendingTimers]);

  const speakPuzzlePrompt = useCallback(
    (p: MathPuzzle) => {
      const leftWord = NUMBERS_1_TO_100[p.left - 1]?.banglaWord ?? String(p.left);
      const rightWord = NUMBERS_1_TO_100[p.right - 1]?.banglaWord ?? String(p.right);
      const text =
        p.op === 'add'
          ? `${leftWord}টি ${p.itemNameBn} আর ${rightWord}টি ${p.itemNameBn} মিলে কয়টি হয়?`
          : `${leftWord}টি ${p.itemNameBn} থেকে ${rightWord}টি উড়ে গেল, কয়টি থাকল?`;
      speakText(text, 'bn', voiceEnabledRef.current);
    },
    []
  );

  const loadNewPuzzle = useCallback(
    (nextFilter: MathFilter, speakNow = true) => {
      clearPendingTimers();
      const next = generatePuzzle(nextFilter, Date.now());
      setPuzzle(next);
      setAnimateAction(false);
      setWrongVal(null);
      setSolved(false);
      if (speakNow) {
        speakPuzzlePrompt(next);
      }
      animTimerRef.current = window.setTimeout(() => {
        animTimerRef.current = null;
        setAnimateAction(true);
      }, 550);
    },
    [speakPuzzlePrompt, clearPendingTimers]
  );

  useEffect(() => {
    loadNewPuzzle(filter, true);
  }, [filter, loadNewPuzzle]);

  const handleReplayAnimation = useCallback(() => {
    playPop();
    setAnimateAction(false);
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
    }
    animTimerRef.current = window.setTimeout(() => {
      animTimerRef.current = null;
      setAnimateAction(true);
    }, 120);
    speakPuzzlePrompt(puzzle);
  }, [puzzle, speakPuzzlePrompt]);

  const handleChooseAnswer = useCallback(
    (val: number) => {
      if (solved) return;
      if (val === puzzle.answer) {
        playSuccessChime();
        setSolved(true);
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), 900);
        onCorrectMath(`math-${puzzle.op}-${puzzle.id}`);
        const ansWord =
          NUMBERS_1_TO_100[puzzle.answer - 1]?.banglaWord ?? String(puzzle.answer);
        speakText(`দারুণ! উত্তর হলো ${ansWord}!`, 'bn', voiceEnabledRef.current);
        clearPendingTimers();
        pendingTimerRef.current = window.setTimeout(() => {
          pendingTimerRef.current = null;
          loadNewPuzzle(filter, true);
        }, 1750);
      } else {
        playSoftTryAgain();
        setWrongVal(val);
        speakText('আবার গুনে দেখো তো!', 'bn', voiceEnabledRef.current);
        window.setTimeout(() => setWrongVal(null), 650);
      }
    },
    [solved, puzzle, onCorrectMath, loadNewPuzzle, filter, clearPendingTimers]
  );

  useEffect(() => {
    if (deviceMode !== 'laptop') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (['1', '2', '3'].includes(e.key)) {
        const chosen = puzzle.options[Number(e.key) - 1];
        if (chosen !== undefined) {
          e.preventDefault();
          handleChooseAnswer(chosen);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleReplayAnimation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deviceMode, puzzle, handleChooseAnswer, handleReplayAnimation]);

  const leftText = `${toBanglaDigits(puzzle.left)} (${puzzle.left})`;
  const rightText = `${toBanglaDigits(puzzle.right)} (${puzzle.right})`;

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={IMAGE_ASSETS.elephantMath}
        fallbackEmoji="🐘"
        name="হাতু হাতি (যোগ-বিয়োগ)"
        speechBubble={
          puzzle.op === 'add'
            ? `${leftText} + ${rightText} = কত? ছবি গুনে বলো!`
            : `${leftText} - ${rightText} = কত? কয়টি বাকি থাকল?`
        }
        isSpeaking={isSpeaking}
        celebrating={celebrating}
        onTap={() => speakPuzzlePrompt(puzzle)}
      />

      {/* Operation Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-slate-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              setFilter('mixed');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'mixed'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>সব খেলা</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setFilter('add');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'add'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>যোগ (+)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setFilter('subtract');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'subtract'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Minus className="w-4 h-4" />
            <span>বিয়োগ (-)</span>
          </button>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={handleReplayAnimation}
          className="min-h-[44px] px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>অ্যানিমেশন আবার দেখো</span>
        </motion.button>
      </div>

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 ল্যাপটপ কিবোর্ড: 1, 2 বা 3 চেপে সঠিক উত্তর বাছাই করো · Space অ্যানিমেশন আবার চালাবে
        </div>
      )}

      {/* Animated Visual Stage */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 sm:p-7 shadow-xs space-y-6">
        {puzzle.op === 'add' ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              <div className="sm:col-span-5 bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 min-h-[120px] flex flex-col items-center justify-center gap-2">
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: puzzle.left }, (_, idx) => (
                    <motion.div
                      key={`add-l-${puzzle.id}-${idx}`}
                      initial={{ scale: 0 }}
                      animate={
                        animateAction
                          ? { scale: 1, y: [0, -6, 0] }
                          : { scale: 1 }
                      }
                      transition={{
                        scale: { delay: idx * 0.06, type: 'spring' },
                        y: { delay: idx * 0.1, duration: 1.6, repeat: Infinity },
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-xs bg-white select-none flex items-center justify-center"
                    >
                      {puzzle.imageUrl ? (
                        <img
                          src={puzzle.imageUrl}
                          alt={puzzle.itemNameBn}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{puzzle.emoji}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <span className="font-display text-2xl font-bold text-amber-900 tabular-nums">
                  {toBanglaDigits(puzzle.left)} ({puzzle.left})
                </span>
              </div>

              <div className="sm:col-span-1 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center font-display text-3xl font-bold"
                >
                  +
                </motion.div>
              </div>

              <div className="sm:col-span-5 bg-sky-50 border-2 border-sky-200 rounded-3xl p-4 min-h-[120px] flex flex-col items-center justify-center gap-2">
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: puzzle.right }, (_, idx) => (
                    <motion.div
                      key={`add-r-${puzzle.id}-${idx}`}
                      initial={{ scale: 0 }}
                      animate={
                        animateAction
                          ? { scale: 1, y: [0, -6, 0] }
                          : { scale: 1 }
                      }
                      transition={{
                        scale: { delay: 0.25 + idx * 0.06, type: 'spring' },
                        y: { delay: 0.2 + idx * 0.1, duration: 1.6, repeat: Infinity },
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-xs bg-white select-none flex items-center justify-center"
                    >
                      {puzzle.imageUrl ? (
                        <img
                          src={puzzle.imageUrl}
                          alt={puzzle.itemNameBn}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{puzzle.emoji}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <span className="font-display text-2xl font-bold text-sky-900 tabular-nums">
                  {toBanglaDigits(puzzle.right)} ({puzzle.right})
                </span>
              </div>
            </div>

            <AnimatePresence>
              {animateAction && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-4 text-center"
                >
                  <div className="text-xs font-bold text-emerald-700 mb-2">
                    একসাথে ঝুড়িতে গুনি চলো!
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({ length: puzzle.answer }, (_, idx) => (
                      <motion.div
                        key={`sum-${puzzle.id}-${idx}`}
                        initial={{ scale: 0, y: -18 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{
                          delay: idx * 0.09,
                          type: 'spring',
                          stiffness: 320,
                        }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-white shadow-xs bg-white">
                          {puzzle.imageUrl ? (
                            <img
                              src={puzzle.imageUrl}
                              alt={puzzle.itemNameBn}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">{puzzle.emoji}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-emerald-800 tabular-nums mt-1">
                          {toBanglaDigits(idx + 1)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-sky-50 to-emerald-50 border-2 border-sky-200 rounded-3xl p-5 sm:p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-3 text-2xl sm:text-3xl font-display font-bold text-slate-900 tabular-nums">
              <span>{toBanglaDigits(puzzle.left)}</span>
              <span className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 inline-flex items-center justify-center">
                -
              </span>
              <span>{toBanglaDigits(puzzle.right)}</span>
              <span>=</span>
              <span className="text-amber-600">
                {solved ? toBanglaDigits(puzzle.answer) : '?'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[120px] py-2">
              {Array.from({ length: puzzle.left }, (_, idx) => {
                const fliesAway = idx >= puzzle.answer;
                return (
                  <motion.div
                    key={`sub-${puzzle.id}-${idx}`}
                    initial={{ scale: 0, y: 10 }}
                    animate={
                      fliesAway && animateAction
                        ? {
                            y: -65,
                            x: 35,
                            scale: 0.65,
                            opacity: 0.18,
                            rotate: 18,
                          }
                        : {
                            scale: 1,
                            y: [0, -8, 0],
                            opacity: 1,
                            rotate: [0, -5, 5, 0],
                          }
                    }
                    transition={
                      fliesAway && animateAction
                        ? {
                            delay: (idx - puzzle.answer) * 0.22,
                            duration: 0.9,
                            ease: 'easeOut',
                          }
                        : {
                            scale: { delay: idx * 0.05, type: 'spring' },
                            y: {
                              delay: idx * 0.12,
                              duration: 2.1,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                            rotate: {
                              delay: idx * 0.12,
                              duration: 2.1,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                          }
                    }
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white select-none">
                      {puzzle.imageUrl ? (
                        <img
                          src={puzzle.imageUrl}
                          alt={puzzle.itemNameBn}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">{puzzle.emoji}</span>
                      )}
                    </div>
                    {fliesAway && animateAction && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1">
                        উড়ে গেল
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-bold text-slate-700">
              সঠিক উত্তরটিতে ট্যাপ করো:
            </span>
            <button
              type="button"
              onClick={() => speakPuzzlePrompt(puzzle)}
              aria-label="প্রশ্ন আবার শোনো"
              className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            {puzzle.options.map((opt, idx) => {
              const isWrong = wrongVal === opt;
              const isCorrect = solved && opt === puzzle.answer;
              return (
                <motion.button
                  key={opt}
                  type="button"
                  animate={
                    isWrong
                      ? { x: [0, -8, 8, -5, 0] }
                      : isCorrect
                      ? { scale: [1, 1.12, 1] }
                      : { scale: 1 }
                  }
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleChooseAnswer(opt)}
                  className={`relative min-h-[84px] rounded-3xl border-2 p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-md'
                      : isWrong
                      ? 'bg-amber-50 border-amber-300 opacity-75'
                      : 'bg-amber-50 border-amber-200 hover:border-emerald-400 text-slate-900'
                  }`}
                >
                  {deviceMode === 'laptop' && (
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                  <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none">
                    {toBanglaDigits(opt)}
                  </span>
                  <span
                    className={`text-sm font-bold mt-1 tabular-nums ${
                      isCorrect ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    ({opt})
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
