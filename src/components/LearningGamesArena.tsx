import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Sparkles,
  Volume2,
  RotateCcw,
  Star,
  Shapes,
  Ghost,
  Grid2x2,
  Target,
} from 'lucide-react';
import { IMAGE_ASSETS, toBanglaDigits } from '../data/curriculum';
import {
  playPop,
  playBubblePop,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
  stopSpeaking,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';
import { NumberHuntGame } from './NumberHuntGame';

type MiniGameType = 'memory' | 'colors-shapes' | 'shadow' | 'number-hunt';

interface LearningGamesArenaProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  onEarnStar: (gameItemId: string, stars?: number) => void;
}

interface PictureCardDef {
  id: string;
  labelBn: string;
  labelEn: string;
  emoji: string;
  imageUrl: string;
  voice: string;
  lang: 'bn' | 'en';
}

const GAME_PICTURES: PictureCardDef[] = [
  { id: 'gp-apple', labelBn: 'আপেল', labelEn: 'Apple', emoji: '🍎', imageUrl: '/images/objects/apple.jpg', voice: 'Apple! আপেল!', lang: 'en' },
  { id: 'gp-mango', labelBn: 'আম', labelEn: 'Mango', emoji: '🥭', imageUrl: '/images/objects/mango.jpg', voice: 'আম! Mango!', lang: 'bn' },
  { id: 'gp-banana', labelBn: 'কলা', labelEn: 'Banana', emoji: '🍌', imageUrl: '/images/objects/banana.jpg', voice: 'কলা! Banana!', lang: 'bn' },
  { id: 'gp-tiger', labelBn: 'বাঘ', labelEn: 'Tiger', emoji: '🐯', imageUrl: '/images/objects/tiger.jpg', voice: 'বাঘ! Tiger!', lang: 'bn' },
  { id: 'gp-elephant', labelBn: 'হাতি', labelEn: 'Elephant', emoji: '🐘', imageUrl: '/images/objects/elephant.jpg', voice: 'Elephant! হাতি!', lang: 'en' },
  { id: 'gp-rabbit', labelBn: 'খরগোশ', labelEn: 'Rabbit', emoji: '🐰', imageUrl: '/images/objects/rabbit.jpg', voice: 'খরগোশ! Rabbit!', lang: 'bn' },
  { id: 'gp-lion', labelBn: 'সিংহ', labelEn: 'Lion', emoji: '🦁', imageUrl: '/images/objects/lion.jpg', voice: 'Lion! সিংহ!', lang: 'en' },
  { id: 'gp-parrot', labelBn: 'টিয়া পাখি', labelEn: 'Parrot', emoji: '🦜', imageUrl: '/images/objects/parrot.jpg', voice: 'Parrot! টিয়া পাখি!', lang: 'en' },
  { id: 'gp-grapes', labelBn: 'আঙুর', labelEn: 'Grapes', emoji: '🍇', imageUrl: '/images/objects/grapes.jpg', voice: 'Grapes! আঙুর!', lang: 'en' },
  { id: 'gp-watermelon', labelBn: 'তরমুজ', labelEn: 'Watermelon', emoji: '🍉', imageUrl: '/images/objects/watermelon.jpg', voice: 'তরমুজ! Watermelon!', lang: 'bn' },
];

interface ColorShapeItem {
  id: string;
  colorBn: string;
  colorEn: string;
  shapeBn: string;
  shapeEn: string;
  shapeType: 'circle' | 'star' | 'heart' | 'square' | 'triangle';
  fillHex: string;
  bgClass: string;
  borderClass: string;
}

const COLOR_SHAPES: ColorShapeItem[] = [
  { id: 'cs-red-heart', colorBn: 'লাল', colorEn: 'Red', shapeBn: 'হৃদয়', shapeEn: 'Heart', shapeType: 'heart', fillHex: '#EF4444', bgClass: 'bg-rose-50', borderClass: 'border-rose-200' },
  { id: 'cs-yellow-star', colorBn: 'হলুদ', colorEn: 'Yellow', shapeBn: 'তারা', shapeEn: 'Star', shapeType: 'star', fillHex: '#F59E0B', bgClass: 'bg-amber-50', borderClass: 'border-amber-200' },
  { id: 'cs-blue-circle', colorBn: 'নীল', colorEn: 'Blue', shapeBn: 'বৃত্ত', shapeEn: 'Circle', shapeType: 'circle', fillHex: '#0EA5E9', bgClass: 'bg-sky-50', borderClass: 'border-sky-200' },
  { id: 'cs-green-square', colorBn: 'সবুজ', colorEn: 'Green', shapeBn: 'বর্গ', shapeEn: 'Square', shapeType: 'square', fillHex: '#10B981', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200' },
  { id: 'cs-purple-triangle', colorBn: 'বেগুনি', colorEn: 'Purple', shapeBn: 'ত্রিভুজ', shapeEn: 'Triangle', shapeType: 'triangle', fillHex: '#8B5CF6', bgClass: 'bg-violet-50', borderClass: 'border-violet-200' },
  { id: 'cs-orange-circle', colorBn: 'কমলা', colorEn: 'Orange', shapeBn: 'গোল', shapeEn: 'Circle', shapeType: 'circle', fillHex: '#F97316', bgClass: 'bg-orange-50', borderClass: 'border-orange-200' },
];

function ShapeSvg({ type, fillHex }: { type: ColorShapeItem['shapeType']; fillHex: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-sm" aria-hidden="true">
      {type === 'circle' && <circle cx="50" cy="50" r="40" fill={fillHex} />}
      {type === 'square' && <rect x="14" y="14" width="72" height="72" rx="16" fill={fillHex} />}
      {type === 'triangle' && <polygon points="50,12 90,84 10,84" fill={fillHex} stroke={fillHex} strokeWidth="6" strokeLinejoin="round" />}
      {type === 'star' && (
        <polygon
          points="50,8 62,36 92,38 69,58 76,88 50,72 24,88 31,58 8,38 38,36"
          fill={fillHex}
          stroke={fillHex}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
      {type === 'heart' && (
        <path
          d="M50 84 C50 84 12 58 12 34 C12 20 23 12 35 12 C43 12 48 17 50 22 C52 17 57 12 65 12 C77 12 88 20 88 34 C88 58 50 84 50 84 Z"
          fill={fillHex}
        />
      )}
    </svg>
  );
}

interface MemoryCardInstance {
  uid: string;
  def: PictureCardDef;
}

function buildMemoryDeck(pairCount: number): MemoryCardInstance[] {
  const chosen = [...GAME_PICTURES].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const deck: MemoryCardInstance[] = [];
  chosen.forEach((def) => {
    deck.push({ uid: `${def.id}-a`, def });
    deck.push({ uid: `${def.id}-b`, def });
  });
  return deck.sort(() => Math.random() - 0.5);
}

export function LearningGamesArena({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  onEarnStar,
}: LearningGamesArenaProps) {
  const [activeGame, setActiveGame] = useState<MiniGameType>('memory');
  const [celebrating, setCelebrating] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  // --- MINI GAME 1: MEMORY FLIP ---
  const [memoryPairs, setMemoryPairs] = useState<3 | 4>(3);
  const [deck, setDeck] = useState<MemoryCardInstance[]>(() => buildMemoryDeck(3));
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedDefIds, setMatchedDefIds] = useState<string[]>([]);
  const [isCheckingPair, setIsCheckingPair] = useState(false);
  const [memoryWon, setMemoryWon] = useState(false);

  // --- MINI GAME 2: COLORS & SHAPES ---
  const [shapeTarget, setShapeTarget] = useState<ColorShapeItem>(COLOR_SHAPES[0]);
  const [shapeOptions, setShapeOptions] = useState<ColorShapeItem[]>([]);
  const [shapeSolved, setShapeSolved] = useState(false);
  const [shapeWrongId, setShapeWrongId] = useState<string | null>(null);

  // --- MINI GAME 3: ANIMAL & FRUIT SHADOW DETECTIVE ---
  const [shadowTarget, setShadowTarget] = useState<PictureCardDef>(GAME_PICTURES[0]);
  const [shadowOptions, setShadowOptions] = useState<PictureCardDef[]>([]);
  const [shadowSolved, setShadowSolved] = useState(false);
  const [shadowWrongId, setShadowWrongId] = useState<string | null>(null);

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      stopSpeaking();
    };
  }, [clearTimer]);

  const pulseCelebrate = useCallback(() => {
    setCelebrating(true);
    setGameScore((s) => s + 1);
    window.setTimeout(() => setCelebrating(false), 950);
  }, []);

  // Setup Memory Game
  const resetMemoryGame = useCallback(
    (pairs: 3 | 4 = memoryPairs, speakPrompt = false) => {
      clearTimer();
      setDeck(buildMemoryDeck(pairs));
      setFlippedUids([]);
      setMatchedDefIds([]);
      setIsCheckingPair(false);
      setMemoryWon(false);
      if (speakPrompt) {
        void speakText(
          'একই রকম দুটি ছবি খুঁজে মিলিয়ে দাও!',
          'bn',
          voiceEnabledRef.current
        );
      }
    },
    [clearTimer, memoryPairs]
  );

  // Setup Colors & Shapes Round
  const setupNextShapeRound = useCallback((speakNow = true) => {
    const shuffled = [...COLOR_SHAPES].sort(() => Math.random() - 0.5);
    const opts = shuffled.slice(0, 4);
    const target = opts[Math.floor(Math.random() * opts.length)];
    setShapeOptions(opts);
    setShapeTarget(target);
    setShapeSolved(false);
    setShapeWrongId(null);
    if (speakNow) {
      void speakText(
        `${target.colorBn} ${target.shapeBn} খুঁজে দাও! ${target.colorEn} ${target.shapeEn}!`,
        'bn',
        voiceEnabledRef.current
      );
    }
  }, []);

  // Setup Shadow Match Round
  const setupNextShadowRound = useCallback((speakNow = true) => {
    const shuffled = [...GAME_PICTURES].sort(() => Math.random() - 0.5);
    const opts = shuffled.slice(0, 3);
    const target = opts[Math.floor(Math.random() * opts.length)];
    setShadowOptions(opts);
    setShadowTarget(target);
    setShadowSolved(false);
    setShadowWrongId(null);
    if (speakNow) {
      void speakText(
        'ছায়া দেখে বলো তো এখানে কে লুকিয়ে আছে?',
        'bn',
        voiceEnabledRef.current
      );
    }
  }, []);

  // Initialize active mini-game cleanly on tab switch
  useEffect(() => {
    clearTimer();
    if (activeGame === 'memory') {
      resetMemoryGame(memoryPairs, false);
    } else if (activeGame === 'colors-shapes') {
      setupNextShapeRound(true);
    } else if (activeGame === 'shadow') {
      setupNextShadowRound(true);
    }
  }, [activeGame, clearTimer, memoryPairs, resetMemoryGame, setupNextShadowRound, setupNextShapeRound]);

  // Memory Flip Card Click
  const handleFlipCard = useCallback(
    (card: MemoryCardInstance) => {
      if (
        isCheckingPair ||
        memoryWon ||
        flippedUids.includes(card.uid) ||
        matchedDefIds.includes(card.def.id)
      ) {
        return;
      }

      playPop();
      const nextFlipped = [...flippedUids, card.uid];
      setFlippedUids(nextFlipped);

      if (nextFlipped.length === 1) {
        void speakText(card.def.labelBn, 'bn', voiceEnabledRef.current);
        return;
      }

      if (nextFlipped.length === 2) {
        setIsCheckingPair(true);
        const firstCard = deck.find((c) => c.uid === nextFlipped[0]);
        if (firstCard && firstCard.def.id === card.def.id) {
          playBubblePop();
          const nextMatched = [...matchedDefIds, card.def.id];
          setMatchedDefIds(nextMatched);
          setFlippedUids([]);
          setIsCheckingPair(false);

          if (nextMatched.length === memoryPairs) {
            setMemoryWon(true);
            playSuccessChime();
            pulseCelebrate();
            onEarnStar(`game-memory-${card.def.id}`, 2);
            void speakText(
              `বাহ! অসাধারণ! তুমি সবগুলো ছবি মিলিয়ে ফেলেছ!`,
              'bn',
              voiceEnabledRef.current
            );
          } else {
            void speakText(
              `দারুণ! দুটি ${card.def.labelBn} মিলে গেছে!`,
              'bn',
              voiceEnabledRef.current
            );
          }
        } else {
          timerRef.current = window.setTimeout(() => {
            setFlippedUids([]);
            setIsCheckingPair(false);
          }, 850);
        }
      }
    },
    [
      deck,
      flippedUids,
      isCheckingPair,
      matchedDefIds,
      memoryPairs,
      memoryWon,
      onEarnStar,
      pulseCelebrate,
    ]
  );

  // Colors & Shapes Answer Click
  const handlePickShape = useCallback(
    (item: ColorShapeItem) => {
      if (shapeSolved) return;
      if (item.id === shapeTarget.id) {
        playSuccessChime();
        setShapeSolved(true);
        pulseCelebrate();
        onEarnStar(`game-shape-${item.id}`, 1);
        void speakText(
          `বাহ! একদম ঠিক! এটি ${item.colorBn} ${item.shapeBn}!`,
          'bn',
          voiceEnabledRef.current
        );
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          setupNextShapeRound(true);
        }, 1650);
      } else {
        playSoftTryAgain();
        setShapeWrongId(item.id);
        void speakText(
          `ওটা ${item.colorBn} ${item.shapeBn}, আমরা খুঁজছি ${shapeTarget.colorBn} ${shapeTarget.shapeBn}!`,
          'bn',
          voiceEnabledRef.current
        );
        window.setTimeout(() => setShapeWrongId(null), 650);
      }
    },
    [clearTimer, onEarnStar, pulseCelebrate, setupNextShapeRound, shapeSolved, shapeTarget]
  );

  // Shadow Match Answer Click
  const handlePickShadow = useCallback(
    (opt: PictureCardDef) => {
      if (shadowSolved) return;
      if (opt.id === shadowTarget.id) {
        playSuccessChime();
        setShadowSolved(true);
        pulseCelebrate();
        onEarnStar(`game-shadow-${opt.id}`, 1);
        void speakText(
          `সাবাশ! ঠিক ধরেছ! এটি ${opt.labelBn} (${opt.labelEn})!`,
          'bn',
          voiceEnabledRef.current
        );
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          setupNextShadowRound(true);
        }, 1850);
      } else {
        playSoftTryAgain();
        setShadowWrongId(opt.id);
        void speakText(
          'আরেকবার ভালো করে ছায়াটা দেখে চেষ্টা করো, সোনা!',
          'bn',
          voiceEnabledRef.current
        );
        window.setTimeout(() => setShadowWrongId(null), 650);
      }
    },
    [clearTimer, onEarnStar, pulseCelebrate, setupNextShadowRound, shadowSolved, shadowTarget]
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
      if (activeGame === 'colors-shapes') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const item = shapeOptions[Number(e.key) - 1];
          if (item) {
            e.preventDefault();
            handlePickShape(item);
          }
        } else if (e.code === 'Space') {
          e.preventDefault();
          void speakText(
            `${shapeTarget.colorBn} ${shapeTarget.shapeBn} খুঁজে দাও!`,
            'bn',
            voiceEnabledRef.current
          );
        }
      } else if (activeGame === 'shadow') {
        if (['1', '2', '3'].includes(e.key)) {
          const item = shadowOptions[Number(e.key) - 1];
          if (item) {
            e.preventDefault();
            handlePickShadow(item);
          }
        } else if (e.code === 'Space') {
          e.preventDefault();
          void speakText(
            'ছায়া দেখে বলো তো এখানে কে লুকিয়ে আছে?',
            'bn',
            voiceEnabledRef.current
          );
        }
      } else if (activeGame === 'memory') {
        const num = Number(e.key);
        if (num >= 1 && num <= deck.length) {
          e.preventDefault();
          handleFlipCard(deck[num - 1]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeGame,
    deck,
    deviceMode,
    handleFlipCard,
    handlePickShadow,
    handlePickShape,
    shadowOptions,
    shapeOptions,
    shapeTarget,
  ]);

  const mascotSpeech =
    activeGame === 'memory'
      ? memoryWon
        ? 'বাহ! সবগুলো জোড়া ছবি দারুণ মিলিয়েছ! আবার খেলবে?'
        : 'কার্ড উল্টে একই রকম দুটি ছবি খুঁজে বের করো!'
      : activeGame === 'colors-shapes'
      ? `বলো তো, কোনটি ${shapeTarget.colorBn} ${shapeTarget.shapeBn} (${shapeTarget.colorEn} ${shapeTarget.shapeEn})?`
      : activeGame === 'number-hunt'
      ? '১ থেকে ১০ পর্যন্ত ছোট থেকে বড় সাজিয়ে সংখ্যাগুলোতে ট্যাপ করো!'
      : shadowSolved
      ? `হুররে! এটি ${shadowTarget.labelBn} (${shadowTarget.labelEn})!`
      : 'ছায়াটা ভালো করে দেখে বলো তো ভেতরে কে লুকিয়ে আছে?';

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={IMAGE_ASSETS.elephantMath}
        fallbackEmoji="🎮"
        name="খেলার মেলা (Learning Games)"
        speechBubble={mascotSpeech}
        isSpeaking={isSpeaking}
        celebrating={celebrating}
        onTap={() => void speakText(mascotSpeech, 'bn', voiceEnabledRef.current)}
      />

      {/* Game Selector Tabs + Score */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border-2 border-indigo-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              setActiveGame('memory');
            }}
            className={`min-h-[46px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeGame === 'memory'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Grid2x2 className="w-4 h-4" />
            <span>মেমোরি ম্যাচ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setActiveGame('colors-shapes');
            }}
            className={`min-h-[46px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeGame === 'colors-shapes'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shapes className="w-4 h-4" />
            <span>রং ও আকৃতি</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setActiveGame('shadow');
            }}
            className={`min-h-[46px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeGame === 'shadow'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Ghost className="w-4 h-4" />
            <span>ছায়া মেলাও</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setActiveGame('number-hunt');
            }}
            className={`min-h-[46px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeGame === 'number-hunt'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>সংখ্যা শিকার (১–১০)</span>
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-bold text-amber-800 tabular-nums">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>জয়: {toBanglaDigits(gameScore)} বার</span>
        </div>
      </div>

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 ল্যাপটপ কিবোর্ড:{' '}
          {activeGame === 'memory'
            ? `1–${deck.length} চাপলে কার্ড উল্টাবে`
            : activeGame === 'colors-shapes'
            ? '1–4 চাপলে উত্তর হবে · Space আবার প্রশ্ন শোনাবে'
            : activeGame === 'number-hunt'
            ? '1–9 এবং 0 (১০) চাপলে সংখ্যা ধরবে · R নতুন খেলা'
            : '1–3 চাপলে উত্তর হবে · Space আবার প্রশ্ন শোনাবে'}
        </div>
      )}

      {/* GAME 1: MEMORY FLIP MATCH */}
      {activeGame === 'memory' && (
        <section className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-amber-50 p-5 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-indigo-600" />
                <span>একই রকম ছবি মেলাও!</span>
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5 tabular-nums">
                মিলেছে: {toBanglaDigits(matchedDefIds.length)} / {toBanglaDigits(memoryPairs)} জোড়া
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-white border border-indigo-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setMemoryPairs(3);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    memoryPairs === 3 ? 'bg-indigo-600 text-white' : 'text-slate-700'
                  }`}
                >
                  ৬ কার্ড
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setMemoryPairs(4);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    memoryPairs === 4 ? 'bg-indigo-600 text-white' : 'text-slate-700'
                  }`}
                >
                  ৮ কার্ড
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  resetMemoryGame(memoryPairs, true);
                }}
                className="min-h-[40px] px-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-800 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>নতুন খেলা</span>
              </button>
            </div>
          </div>

          <div
            className={`grid gap-3 sm:gap-4 max-w-2xl mx-auto ${
              memoryPairs === 3 ? 'grid-cols-3' : 'grid-cols-4'
            }`}
          >
            {deck.map((card, idx) => {
              const isFlipped =
                flippedUids.includes(card.uid) || matchedDefIds.includes(card.def.id);
              const isMatched = matchedDefIds.includes(card.def.id);
              return (
                <motion.button
                  key={card.uid}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  animate={isMatched ? { scale: [1, 1.07, 1] } : undefined}
                  onClick={() => handleFlipCard(card)}
                  className={`relative aspect-square rounded-3xl border-4 p-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm ${
                    isMatched
                      ? 'bg-emerald-50 border-emerald-400'
                      : isFlipped
                      ? 'bg-white border-amber-400 shadow-md'
                      : 'bg-gradient-to-br from-indigo-500 to-sky-500 border-white hover:border-amber-300 text-white'
                  }`}
                >
                  {deviceMode === 'laptop' && !isFlipped && (
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-slate-900/65 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}

                  {isFlipped ? (
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full h-full flex flex-col items-center justify-center gap-1"
                    >
                      <img
                        src={card.def.imageUrl}
                        alt={card.def.labelBn}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 bg-white"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate max-w-full">
                        {card.def.labelBn}
                      </span>
                    </motion.div>
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold select-none">
                      ⭐
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {memoryWon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center pt-2"
            >
              <button
                type="button"
                onClick={() => {
                  playPop();
                  resetMemoryGame(memoryPairs, true);
                }}
                className="min-h-[50px] px-7 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>দারুণ! আরেকবার খেলো (+২ ★)</span>
              </button>
            </motion.div>
          )}
        </section>
      )}

      {/* GAME 2: COLORS & SHAPES */}
      {activeGame === 'colors-shapes' && (
        <section className="rounded-3xl border-2 border-amber-200 bg-white p-5 sm:p-8 space-y-6 text-center shadow-xs">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold">
              <Shapes className="w-4 h-4" />
              <span>রং ও আকৃতি চেনার খেলা</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              “{shapeTarget.colorBn} {shapeTarget.shapeBn}” ({shapeTarget.colorEn}{' '}
              {shapeTarget.shapeEn}) কোনটি?
            </h2>
            <button
              type="button"
              onClick={() =>
                void speakText(
                  `${shapeTarget.colorBn} ${shapeTarget.shapeBn} খুঁজে দাও! ${shapeTarget.colorEn} ${shapeTarget.shapeEn}!`,
                  'bn',
                  voiceEnabledRef.current
                )
              }
              className="min-h-[44px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>আবার শোনো</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {shapeOptions.map((opt, idx) => {
              const isWrong = shapeWrongId === opt.id;
              const isCorrect = shapeSolved && opt.id === shapeTarget.id;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  animate={
                    isWrong
                      ? { x: [0, -8, 8, -5, 0] }
                      : isCorrect
                      ? { scale: [1, 1.12, 1], y: [0, -10, 0] }
                      : { scale: 1 }
                  }
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handlePickShape(opt)}
                  className={`relative min-h-[150px] rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-100 border-emerald-500 shadow-md'
                      : isWrong
                      ? 'bg-amber-50 border-amber-300 opacity-75'
                      : `${opt.bgClass} ${opt.borderClass} hover:border-amber-400`
                  }`}
                >
                  {deviceMode === 'laptop' && (
                    <span className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                  <ShapeSvg type={opt.shapeType} fillHex={opt.fillHex} />
                  <span className="text-sm font-bold text-slate-800">
                    {opt.colorBn} {opt.shapeBn}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* GAME 3: ANIMAL & FRUIT SHADOW DETECTIVE */}
      {activeGame === 'shadow' && (
        <section className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 p-5 sm:p-8 space-y-6 text-center shadow-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
              <Ghost className="w-4 h-4" />
              <span>ছায়া দেখে বন্ধু চেনো</span>
            </div>

            {/* Mystery Silhouette Box */}
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={
                  shadowSolved
                    ? { scale: [1, 1.12, 1.06] }
                    : { y: [0, -6, 0] }
                }
                transition={
                  shadowSolved
                    ? { duration: 0.5 }
                    : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                }
                className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl border-4 bg-white overflow-hidden shadow-lg flex items-center justify-center ${
                  shadowSolved ? 'border-emerald-400 shadow-2xl' : 'border-white'
                }`}
              >
                <img
                  src={shadowTarget.imageUrl}
                  alt={shadowSolved ? shadowTarget.labelBn : 'রহস্য ছায়া'}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    shadowSolved
                      ? 'brightness-100 contrast-100 scale-105'
                      : 'brightness-0 contrast-200 opacity-75 blur-[1px]'
                  }`}
                />
                {!shadowSolved && (
                  <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-slate-900/80 text-white text-xs font-bold">
                    ?
                  </span>
                )}
              </motion.div>

              <p className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                {shadowSolved
                  ? `বাহ! এটা ${shadowTarget.labelBn} (${shadowTarget.labelEn})!`
                  : 'এই ছায়াটি কার? নিচের ছবি থেকে খুঁজে বের করো!'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {shadowOptions.map((opt, idx) => {
              const isWrong = shadowWrongId === opt.id;
              const isCorrect = shadowSolved && opt.id === shadowTarget.id;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  animate={
                    isWrong
                      ? { x: [0, -8, 8, -5, 0] }
                      : isCorrect
                      ? { scale: [1, 1.08, 1], y: [0, -8, 0] }
                      : { scale: 1 }
                  }
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handlePickShadow(opt)}
                  className={`relative min-h-[140px] rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-100 border-emerald-500 shadow-md'
                      : isWrong
                      ? 'bg-amber-50 border-amber-300 opacity-75'
                      : 'bg-white border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  {deviceMode === 'laptop' && (
                    <span className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                  <img
                    src={opt.imageUrl}
                    alt={opt.labelBn}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-white"
                  />
                  <span className="text-base font-bold text-slate-900">
                    {opt.labelBn} ({opt.labelEn})
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* GAME 4: NUMBER HUNT (1-10) */}
      {activeGame === 'number-hunt' && (
        <NumberHuntGame
          deviceMode={deviceMode}
          voiceEnabled={voiceEnabled}
          onWinStar={(stars = 1) => {
            pulseCelebrate();
            onEarnStar(`game-number-hunt-${Date.now()}`, stars);
          }}
        />
      )}
    </div>
  );
}
