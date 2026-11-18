import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  Star,
  Check,
  Target,
} from 'lucide-react';
import { NUMBERS_1_TO_100, toBanglaDigits } from '../data/curriculum';
import {
  playPop,
  playBubblePop,
  playCountTick,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
  stopSpeaking,
} from '../utils/audioEngine';

interface BubbleNode {
  value: number;
  xPct: number;
  yPct: number;
  colorClass: string;
  bobDuration: number;
}

interface NumberHuntGameProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  onWinStar: (stars?: number) => void;
}

const BUBBLE_STYLES = [
  'bg-amber-400 border-amber-200 text-amber-950 shadow-amber-200/70',
  'bg-sky-400 border-sky-200 text-sky-950 shadow-sky-200/70',
  'bg-emerald-400 border-emerald-200 text-emerald-950 shadow-emerald-200/70',
  'bg-rose-400 border-rose-200 text-white shadow-rose-200/70',
  'bg-violet-400 border-violet-200 text-white shadow-violet-200/70',
  'bg-orange-400 border-orange-200 text-orange-950 shadow-orange-200/70',
  'bg-teal-400 border-teal-200 text-teal-950 shadow-teal-200/70',
  'bg-pink-400 border-pink-200 text-white shadow-pink-200/70',
  'bg-indigo-400 border-indigo-200 text-white shadow-indigo-200/70',
  'bg-lime-400 border-lime-200 text-lime-950 shadow-lime-200/70',
];

function generateScatteredBubbles(): BubbleNode[] {
  // 5 columns x 2 rows shuffled cells with gentle jitter so bubbles appear randomly scattered without overlapping
  const cells: Array<{ xBase: number; yBase: number }> = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      cells.push({
        xBase: 11 + col * 19.5,
        yBase: 24 + row * 48,
      });
    }
  }

  // Shuffle cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const colorOrder = [...BUBBLE_STYLES].sort(() => Math.random() - 0.5);

  return Array.from({ length: 10 }, (_, idx) => {
    const cell = cells[idx];
    const xJitter = (Math.random() - 0.5) * 7.5;
    const yJitter = (Math.random() - 0.5) * 16;
    return {
      value: idx + 1,
      xPct: Math.max(9, Math.min(91, cell.xBase + xJitter)),
      yPct: Math.max(16, Math.min(84, cell.yBase + yJitter)),
      colorClass: colorOrder[idx % colorOrder.length],
      bobDuration: 2.2 + (idx % 4) * 0.35,
    };
  });
}

export function NumberHuntGame({
  deviceMode,
  voiceEnabled,
  onWinStar,
}: NumberHuntGameProps) {
  const [huntLang, setHuntLang] = useState<'bn' | 'en'>('bn');
  const [bubbles, setBubbles] = useState<BubbleNode[]>(() => generateScatteredBubbles());
  const [nextTarget, setNextTarget] = useState<number>(1);
  const [wrongVal, setWrongVal] = useState<number | null>(null);
  const [hintTarget, setHintTarget] = useState<boolean>(false);
  const [poppedSpot, setPoppedSpot] = useState<{
    value: number;
    xPct: number;
    yPct: number;
  } | null>(null);
  const [wonRound, setWonRound] = useState(false);

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const startNewRound = useCallback(
    (langOverride?: 'bn' | 'en', speakIntro = true) => {
      const activeLang = langOverride ?? huntLang;
      setBubbles(generateScatteredBubbles());
      setNextTarget(1);
      setWrongVal(null);
      setHintTarget(false);
      setPoppedSpot(null);
      setWonRound(false);
      if (speakIntro) {
        const prompt =
          activeLang === 'bn'
            ? 'এক থেকে দশ পর্যন্ত ছোট থেকে বড় সাজিয়ে সংখ্যাগুলোতে ট্যাপ করো!'
            : 'Tap the numbers in order from one to ten!';
        void speakText(prompt, activeLang, voiceEnabledRef.current);
      }
    },
    [huntLang]
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleTapBubble = useCallback(
    (node: BubbleNode) => {
      if (wonRound || node.value < nextTarget) return;

      const numDef = NUMBERS_1_TO_100[node.value - 1];
      if (!numDef) return;

      if (node.value === nextTarget) {
        playCountTick(node.value);
        playBubblePop();
        setWrongVal(null);
        setHintTarget(false);
        setPoppedSpot({ value: node.value, xPct: node.xPct, yPct: node.yPct });

        if (node.value === 10) {
          setNextTarget(11);
          setWonRound(true);
          playSuccessChime();
          onWinStar(1);
          const winVoice =
            huntLang === 'bn'
              ? 'বাহ! অসাধারণ! তুমি এক থেকে দশ পর্যন্ত সবগুলো সংখ্যা ঠিকভাবে খুঁজে ধরেছ!'
              : 'Hooray! Amazing job! You found all numbers from one to ten in order!';
          void speakText(winVoice, huntLang, voiceEnabledRef.current);
        } else {
          setNextTarget(node.value + 1);
          const spokenNum = huntLang === 'bn' ? numDef.banglaWord : numDef.englishWord;
          void speakText(spokenNum, huntLang, voiceEnabledRef.current);
        }
      } else {
        playSoftTryAgain();
        setWrongVal(node.value);
        setHintTarget(true);
        const expectedDef = NUMBERS_1_TO_100[nextTarget - 1];
        const hintVoice =
          huntLang === 'bn'
            ? `আগে ${expectedDef?.banglaWord ?? nextTarget} খুঁজো, সোনা!`
            : `Let us find number ${nextTarget} first!`;
        void speakText(hintVoice, huntLang, voiceEnabledRef.current);
        window.setTimeout(() => setWrongVal(null), 600);
      }
    },
    [huntLang, nextTarget, onWinStar, wonRound]
  );

  // Laptop Keyboard support: press 1..9 or 0 (for 10)
  useEffect(() => {
    if (deviceMode !== 'laptop') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        const val = e.key === '0' ? 10 : Number(e.key);
        const node = bubbles.find((b) => b.value === val);
        if (node && node.value >= nextTarget) {
          e.preventDefault();
          handleTapBubble(node);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playPop();
        startNewRound(huntLang, true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bubbles, deviceMode, handleTapBubble, huntLang, nextTarget, startNewRound]);

  const targetNumInfo = NUMBERS_1_TO_100[Math.min(nextTarget, 10) - 1];

  return (
    <section
      aria-label="সংখ্যা শিকার খেলা (Number Hunt)"
      className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-amber-50/40 to-emerald-50 p-4 sm:p-6 shadow-xs space-y-4"
    >
      {/* Top Controls & Language Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 mb-0.5">
            <Target className="w-4 h-4" />
            <span>সংখ্যা শিকার · Number Hunt (১–১০)</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            {wonRound
              ? '🎉 বাহ! সবগুলো সংখ্যা ধরে ফেলেছ!'
              : huntLang === 'bn'
              ? `ছোট থেকে বড় সাজিয়ে খুঁজো: “${targetNumInfo?.banglaDigit}” (${targetNumInfo?.banglaWord})`
              : `Tap in order! Next number: “${nextTarget}” (${targetNumInfo?.englishWord})`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-sky-200 rounded-xl">
            <button
              type="button"
              onClick={() => {
                playPop();
                setHuntLang('bn');
                startNewRound('bn', true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                huntLang === 'bn' ? 'bg-amber-500 text-white' : 'text-slate-700'
              }`}
            >
              বাংলা (১–১০)
            </button>
            <button
              type="button"
              onClick={() => {
                playPop();
                setHuntLang('en');
                startNewRound('en', true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                huntLang === 'en' ? 'bg-sky-600 text-white' : 'text-slate-700'
              }`}
            >
              English (1–10)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              playPop();
              const prompt =
                huntLang === 'bn'
                  ? `এখন ${targetNumInfo?.banglaWord ?? nextTarget} খুঁজে ট্যাপ করো!`
                  : `Find number ${nextTarget}!`;
              void speakText(prompt, huntLang, voiceEnabledRef.current);
            }}
            className="min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 hover:border-amber-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>শোনো</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              startNewRound(huntLang, true);
            }}
            className="min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>নতুন করে</span>
          </button>
        </div>
      </div>

      {/* Ascending Progress Strip (1 .. 10) */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-white/90 rounded-2xl border border-sky-100 p-2.5">
        {Array.from({ length: 10 }, (_, idx) => {
          const val = idx + 1;
          const isCollected = val < nextTarget;
          const isCurrent = val === nextTarget && !wonRound;
          const label = huntLang === 'bn' ? toBanglaDigits(val) : String(val);
          return (
            <div
              key={val}
              className={`min-w-[34px] h-9 px-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all tabular-nums ${
                isCollected
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : isCurrent
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 scale-110 shadow-xs'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isCollected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Scattered Pop-Up Number Stage */}
      <div className="relative w-full h-[380px] sm:h-[430px] rounded-3xl border-2 border-white bg-gradient-to-b from-sky-100/80 via-white/75 to-emerald-100/75 overflow-hidden shadow-inner select-none">
        {/* Soft Background Clouds */}
        <span
          aria-hidden="true"
          className="absolute top-4 left-8 text-3xl opacity-45 pointer-events-none"
        >
          ☁️
        </span>
        <span
          aria-hidden="true"
          className="absolute top-6 right-12 text-2xl opacity-40 pointer-events-none"
        >
          ☁️
        </span>

        {/* Pop Burst Sparkle */}
        <AnimatePresence>
          {poppedSpot && (
            <motion.div
              key={`burst-${poppedSpot.value}`}
              initial={{ opacity: 1, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.7, y: -18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              style={{
                left: `${poppedSpot.xPct}%`,
                top: `${poppedSpot.yPct}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 font-display text-2xl font-bold text-emerald-600 pointer-events-none z-20"
            >
              ★ {huntLang === 'bn' ? toBanglaDigits(poppedSpot.value) : poppedSpot.value}!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scattered Bubbles 1-10 */}
        <AnimatePresence>
          {bubbles.map((node, idx) => {
            if (node.value < nextTarget) return null;
            const isWrong = wrongVal === node.value;
            const isHinted = hintTarget && node.value === nextTarget;
            const displayLabel =
              huntLang === 'bn' ? toBanglaDigits(node.value) : String(node.value);

            return (
              <motion.button
                key={`hunt-bubble-${node.value}-${bubbles[0]?.xPct}`}
                type="button"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  isWrong
                    ? {
                        x: ['-50%', '-58%', '-42%', '-54%', '-50%'],
                        y: '-50%',
                        scale: 1,
                        opacity: 1,
                      }
                    : isHinted
                    ? {
                        x: '-50%',
                        y: ['-50%', '-56%', '-50%'],
                        scale: [1, 1.16, 1],
                        opacity: 1,
                      }
                    : {
                        x: '-50%',
                        y: ['-50%', '-57%', '-50%'],
                        scale: 1,
                        opacity: 1,
                      }
                }
                exit={{ scale: 1.45, opacity: 0 }}
                transition={
                  isWrong
                    ? { duration: 0.38 }
                    : {
                        scale: { delay: idx * 0.04, type: 'spring', stiffness: 320, damping: 18 },
                        opacity: { delay: idx * 0.04, duration: 0.2 },
                        y: {
                          duration: node.bobDuration,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }
                }
                whileTap={{ scale: 0.85 }}
                style={{
                  left: `${node.xPct}%`,
                  top: `${node.yPct}%`,
                }}
                aria-label={`সংখ্যা ${displayLabel}`}
                onClick={() => handleTapBubble(node)}
                className={`absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-lg flex flex-col items-center justify-center cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                  node.colorClass
                } ${
                  isHinted
                    ? 'ring-4 ring-amber-400 ring-offset-2 z-20'
                    : 'z-10 hover:scale-105'
                }`}
              >
                <span className="font-display text-3xl sm:text-4xl font-bold leading-none tabular-nums">
                  {displayLabel}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Round Victory Overlay */}
        <AnimatePresence>
          {wonRound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-md"
              >
                <Star className="w-11 h-11 fill-amber-400 text-amber-500" />
              </motion.div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>অসাধারণ! +১ স্টার ★</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {huntLang === 'bn'
                  ? 'তুমি ১ থেকে ১০ সব সংখ্যা জয় করেছ!'
                  : 'You hunted all numbers from 1 to 10!'}
              </h3>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  startNewRound(huntLang, true);
                }}
                className="min-h-[52px] px-7 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-base inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>আবার খেলো!</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
