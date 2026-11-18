import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Keyboard, Sparkles } from 'lucide-react';
import {
  ENGLISH_PHONICS,
  NUMBERS_1_TO_100,
  toBanglaDigits,
} from '../data/curriculum';
import { playCountTick, speakText } from '../utils/audioEngine';
import { AnimatedCartoonTheater } from './AnimatedCartoonTheater';

interface KeyboardMagicStageProps {
  voiceEnabled: boolean;
  isSpeaking: boolean;
  onKeyPlayReward: (id: string) => void;
}

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function KeyboardMagicStage({
  voiceEnabled,
  isSpeaking,
  onKeyPlayReward,
}: KeyboardMagicStageProps) {
  const [letterCase, setLetterCase] = useState<'upper' | 'lower'>('upper');
  const [activeKey, setActiveKey] = useState<string>('A');
  const [pressCount, setPressCount] = useState(0);
  const pressCountRef = useRef(0);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const triggerKey = useCallback(
    (rawKey: string) => {
      const upper = rawKey.toUpperCase();
      if (/^[A-Z]$/.test(upper)) {
        const idx = upper.charCodeAt(0) - 65;
        const item = ENGLISH_PHONICS[idx];
        if (!item) return;
        setActiveKey(upper);
        playCountTick((idx % 12) + 1);
        const spoken =
          letterCase === 'lower'
            ? `Small ${item.symbol.toLowerCase()}! ${item.spokenText}`
            : item.spokenText;
        speakText(spoken, 'en', voiceEnabledRef.current);
        const next = pressCountRef.current + 1;
        pressCountRef.current = next;
        setPressCount(next);
        if (next % 5 === 0) {
          onKeyPlayReward(`key-${upper}`);
        }
      } else if (/^[0-9]$/.test(upper)) {
        const numVal = upper === '0' ? 10 : Number(upper);
        const numItem = NUMBERS_1_TO_100[numVal - 1];
        if (!numItem) return;
        setActiveKey(upper);
        playCountTick(numVal);
        speakText(numItem.spokenText, 'bn', voiceEnabledRef.current);
        const next = pressCountRef.current + 1;
        pressCountRef.current = next;
        setPressCount(next);
        if (next % 5 === 0) {
          onKeyPlayReward(`key-num-${numVal}`);
        }
      }
    },
    [letterCase, onKeyPlayReward]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        e.preventDefault();
        triggerKey(e.key);
      } else if (e.code === 'Space') {
        e.preventDefault();
        triggerKey(activeKey);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerKey, activeKey]);

  const activeLetter = /^[A-Z]$/.test(activeKey)
    ? ENGLISH_PHONICS[activeKey.charCodeAt(0) - 65]
    : null;
  const activeNumber = /^[0-9]$/.test(activeKey)
    ? NUMBERS_1_TO_100[(activeKey === '0' ? 10 : Number(activeKey)) - 1]
    : null;

  const displaySymbol = activeLetter
    ? letterCase === 'upper'
      ? activeLetter.symbol
      : activeLetter.secondarySymbol ?? activeLetter.symbol.toLowerCase()
    : activeNumber
    ? `${activeNumber.banglaDigit} · ${activeNumber.value}`
    : activeKey;

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <span>ল্যাপটপ কিবোর্ড জাদু (Keyboard Magic)</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              ল্যাপটপের যেকোনো A–Z বা 0–9 বোতামে চাপ দাও, কার্টুন নেচে উঠবে ও কথা বলবে! (প্রতি ৫ চাপে ১টি ★)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setLetterCase('upper')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              letterCase === 'upper'
                ? 'bg-amber-500 text-white'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            Capital (A–Z)
          </button>
          <button
            type="button"
            onClick={() => setLetterCase('lower')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              letterCase === 'lower'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            Small (a–z)
          </button>
        </div>
      </div>

      {/* Video-Animated Theater */}
      <AnimatedCartoonTheater
        symbol={displaySymbol}
        word={
          activeLetter
            ? activeLetter.word
            : activeNumber
            ? `${activeNumber.banglaWord} (${activeNumber.englishWord})`
            : 'Apple'
        }
        wordMeaningBn={
          activeLetter
            ? activeLetter.wordMeaningBn
            : activeNumber
            ? `রোমান: ${activeNumber.roman}`
            : undefined
        }
        emoji={activeLetter ? activeLetter.emoji : '🌟'}
        imageUrl={activeLetter?.imageUrl}
        phoneticCue={
          activeLetter
            ? activeLetter.phoneticCue
            : activeNumber
            ? `বাংলা: ${activeNumber.banglaDigit} · English: ${activeNumber.value} · Roman: ${activeNumber.roman}`
            : ''
        }
        isSpeaking={isSpeaking}
        onReplayAudio={() => triggerKey(activeKey)}
      />

      {/* Interactive On-Screen Laptop Keyboard */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>তোমার ল্যাপটপ কিবোর্ড (ক্লিক বা কী চাপো)</span>
          <span className="tabular-nums text-amber-400">
            মোট চাপ: {toBanglaDigits(pressCount)} · পরবর্তী ★ আর{' '}
            {toBanglaDigits(5 - (pressCount % 5))} চাপে
          </span>
        </div>

        <div className="space-y-2">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2">
              {row.map((keyChar) => {
                const isActive = activeKey === keyChar;
                const label =
                  /^[A-Z]$/.test(keyChar) && letterCase === 'lower'
                    ? keyChar.toLowerCase()
                    : keyChar;
                const isNum = /^[0-9]$/.test(keyChar);
                return (
                  <motion.button
                    key={keyChar}
                    type="button"
                    animate={
                      isActive
                        ? { y: -4, scale: 1.08 }
                        : { y: 0, scale: 1 }
                    }
                    whileTap={{ scale: 0.9, y: 2 }}
                    onClick={() => triggerKey(keyChar)}
                    className={`min-w-[30px] sm:min-w-[48px] h-12 sm:h-14 rounded-xl border-b-4 font-display font-bold text-base sm:text-xl flex items-center justify-center cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-amber-400 border-amber-600 text-slate-950'
                        : isNum
                        ? 'bg-sky-700 border-sky-900 text-white hover:bg-sky-600'
                        : 'bg-slate-700 border-slate-950 text-white hover:bg-slate-600'
                    }`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
