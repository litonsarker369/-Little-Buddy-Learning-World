import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, Sparkles } from 'lucide-react';

type SceneMotionType = 'fly' | 'swim' | 'bounce' | 'hop' | 'music' | 'sky';

function detectSceneType(word: string, emoji: string): SceneMotionType {
  const flyEmojis = ['🦅', '🦜', '🐦', '🦋', '🦚', '🐦‍⬛', '🪁'];
  const swimEmojis = ['🚢', '⛵', '🐚', '🐟', '🐋', '🦆', '🦐', '🪷'];
  const bounceEmojis = ['⚽', '🍎', '🥭', '🍌', '🍊', '🍉', '🪀', '🥥'];
  const musicEmojis = ['🎸', '🥁', '🎶', '🎉'];
  const skyEmojis = ['🌅', '☀️', '🌈', '🌙', '☂️'];

  if (flyEmojis.includes(emoji) || /kite|parrot|bird/i.test(word)) return 'fly';
  if (swimEmojis.includes(emoji) || /fish|whale|boat/i.test(word)) return 'swim';
  if (bounceEmojis.includes(emoji) || /ball|apple|yo/i.test(word)) return 'bounce';
  if (musicEmojis.includes(emoji) || /xylo/i.test(word)) return 'music';
  if (skyEmojis.includes(emoji) || /sun|umbrella/i.test(word)) return 'sky';
  return 'hop';
}

interface AnimatedCartoonTheaterProps {
  symbol: string;
  word: string;
  wordMeaningBn?: string;
  emoji: string;
  imageUrl?: string;
  phoneticCue: string;
  isSpeaking?: boolean;
  onReplayAudio: () => void;
}

export function AnimatedCartoonTheater({
  symbol,
  word,
  wordMeaningBn,
  emoji,
  imageUrl,
  phoneticCue,
  isSpeaking = false,
  onReplayAudio,
}: AnimatedCartoonTheaterProps) {
  const [sceneKey, setSceneKey] = useState(0);
  const [imgError, setImgError] = useState(false);
  const sceneType = detectSceneType(word, emoji);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl, symbol]);

  const replayScene = () => {
    setSceneKey((k) => k + 1);
    onReplayAudio();
  };

  const showOriginalImage = Boolean(imageUrl) && !imgError;

  return (
    <div className="relative rounded-3xl border-2 border-sky-200 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100 overflow-hidden shadow-sm">
      {/* Continuous Animated Cartoon Background Layers */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden select-none">
        {/* Smiling Sun */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.06, 1] }}
          transition={{
            rotate: { duration: 28, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute top-4 right-5 w-14 h-14 rounded-full bg-amber-300 border-4 border-amber-200 shadow-xs flex items-center justify-center text-2xl"
          aria-hidden="true"
        >
          ☀️
        </motion.div>

        {/* Drifting Fluffy Clouds */}
        <motion.div
          animate={{ x: [-20, 45, -20] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-5 left-6 text-4xl opacity-85"
          aria-hidden="true"
        >
          ☁️
        </motion.div>
        <motion.div
          animate={{ x: [25, -35, 25] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-12 left-1/3 text-3xl opacity-75"
          aria-hidden="true"
        >
          ☁️
        </motion.div>

        {/* Rolling Green Meadow / Rippling Water Footer */}
        {sceneType === 'swim' ? (
          <motion.div
            animate={{ x: [-12, 12, -12] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-sky-400/70 to-sky-300/40 rounded-t-[48%]"
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-emerald-400/70 to-emerald-300/40 rounded-t-[45%]"
            aria-hidden="true"
          />
        )}

        {/* Swaying Grass & Flowers */}
        <motion.div
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-2 left-6 text-2xl origin-bottom"
          aria-hidden="true"
        >
          🌷
        </motion.div>
        <motion.div
          animate={{ rotate: [6, -6, 6] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-2 right-7 text-2xl origin-bottom"
          aria-hidden="true"
        >
          🌻
        </motion.div>

        {/* Speaking Spotlight Dimmer */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-amber-100/35 backdrop-blur-[1px] z-10 pointer-events-none"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Center Hero Video-Animated Character Stage */}
        <div
          key={sceneKey}
          className="relative z-20 h-full flex items-center justify-center gap-5 sm:gap-12 px-4"
        >
          {/* Giant Animated Letter Card */}
          <motion.button
            type="button"
            onClick={replayScene}
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{
              scale: isSpeaking ? 0.94 : 1,
              rotate: 0,
              opacity: 1,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            whileTap={{ scale: 0.9 }}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white/95 border-4 border-amber-300 shadow-md flex items-center justify-center cursor-pointer shrink-0"
          >
            <span className="font-display font-bold text-slate-900 text-5xl sm:text-7xl leading-none">
              {symbol}
            </span>
          </motion.button>

          {/* Original Image / Character — Zooms BIG when speaking! */}
          <motion.button
            type="button"
            key={`actor-${sceneKey}`}
            onClick={replayScene}
            aria-label={`${word} — বড় করে দেখতে ও শুনতে ট্যাপ করুন`}
            initial={{ scale: 0.45, opacity: 0, y: 24 }}
            animate={
              isSpeaking
                ? {
                    scale: [1.26, 1.38, 1.3],
                    opacity: 1,
                    y: -4,
                    x: 0,
                    rotate: [0, -2, 2, 0],
                  }
                : sceneType === 'fly'
                ? {
                    scale: 1,
                    opacity: 1,
                    y: [-12, 8, -14, 5, -12],
                    x: [-10, 12, 0, -10],
                    rotate: [-5, 5, -3, 4, -5],
                  }
                : sceneType === 'swim'
                ? {
                    scale: 1,
                    opacity: 1,
                    x: [-14, 14, -14],
                    y: [3, -5, 3],
                    rotate: [-3, 4, -3],
                  }
                : sceneType === 'bounce'
                ? {
                    scale: 1,
                    opacity: 1,
                    y: [0, -20, 0, -10, 0],
                    rotate: [0, 4, -4, 2, 0],
                  }
                : sceneType === 'music'
                ? {
                    scale: [1, 1.06, 0.98, 1.05, 1],
                    opacity: 1,
                    rotate: [-6, 6, -6],
                    y: [0, -8, 0],
                  }
                : sceneType === 'sky'
                ? {
                    scale: [1, 1.05, 1],
                    opacity: 1,
                    y: [-8, 4, -8],
                  }
                : {
                    scale: [1, 1.03, 1],
                    opacity: 1,
                    y: [0, -14, 0, -6, 0],
                    x: [-6, 6, -6],
                  }
            }
            transition={
              isSpeaking
                ? {
                    scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                    y: { type: 'spring', stiffness: 260, damping: 18 },
                  }
                : {
                    duration: sceneType === 'bounce' ? 1.9 : 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            whileTap={{ scale: 0.95 }}
            className={`relative flex flex-col items-center justify-center cursor-pointer focus-visible:outline-none ${
              isSpeaking ? 'z-30' : 'z-20'
            }`}
          >
            {/* Glowing Halo Ring while speaking & zooming */}
            {isSpeaking && (
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0.7, scale: 0.92 }}
                animate={{ opacity: [0.65, 0.15, 0.65], scale: [1, 1.18, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-2 rounded-[2rem] border-4 border-amber-400 shadow-lg pointer-events-none"
              />
            )}

            {showOriginalImage ? (
              <div
                className={`w-36 h-36 sm:w-48 sm:h-48 rounded-3xl overflow-hidden bg-white border-4 transition-shadow ${
                  isSpeaking
                    ? 'border-amber-400 shadow-2xl'
                    : 'border-white shadow-lg'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={word}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/95 border-4 border-white shadow-lg flex items-center justify-center text-7xl sm:text-8xl leading-none">
                <span role="img" aria-label={word}>
                  {emoji}
                </span>
              </div>
            )}

            {/* Sparkle badge during big speech zoom */}
            {isSpeaking && (
              <motion.div
                initial={{ scale: 0, y: 6 }}
                animate={{ scale: 1, y: 0 }}
                className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{word}</span>
              </motion.div>
            )}

            {/* Extra Floating Sparkles / Musical Notes / Bubbles */}
            {sceneType === 'music' && !isSpeaking && (
              <motion.span
                animate={{ y: [0, -24], opacity: [1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="absolute -top-4 -right-3 text-2xl"
              >
                🎵
              </motion.span>
            )}
            {sceneType === 'swim' && !isSpeaking && (
              <motion.span
                animate={{ y: [0, -28], opacity: [0.9, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="absolute -top-3 right-0 text-xl"
              >
                🫧
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Video Story Caption & Replay Strip */}
      <div className="bg-white/95 border-t border-sky-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {word}
            </span>
            {wordMeaningBn && (
              <span className="text-sm font-bold text-emerald-700">
                ({wordMeaningBn})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            {phoneticCue}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={replayScene}
            className="min-h-[44px] px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>অ্যানিমেশন ও শব্দ</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={onReplayAudio}
            aria-label="ভয়েস আবার শোনো"
            className="min-h-[44px] w-11 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-800 flex items-center justify-center cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
