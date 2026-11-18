import { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';

interface MascotStageProps {
  imageSrc: string;
  fallbackEmoji: string;
  name: string;
  speechBubble: string;
  isSpeaking?: boolean;
  celebrating?: boolean;
  onTap?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function MascotStage({
  imageSrc,
  fallbackEmoji,
  name,
  speechBubble,
  isSpeaking = false,
  celebrating = false,
  onTap,
  size = 'md',
}: MascotStageProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass =
    size === 'lg'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : size === 'sm'
      ? 'w-14 h-14 sm:w-16 sm:h-16'
      : 'w-18 h-18 sm:w-22 sm:h-22';

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <motion.button
        type="button"
        onClick={onTap}
        aria-label={`${name} — আবার শুনতে ট্যাপ করুন`}
        animate={
          celebrating
            ? { y: [0, -14, 0, -10, 0], rotate: [0, -6, 6, -3, 0], scale: [1, 1.08, 1] }
            : isSpeaking
            ? { y: [0, -6, 0], scale: [1, 1.04, 1] }
            : { y: [0, -3, 0] }
        }
        transition={
          celebrating
            ? { duration: 0.7, ease: 'easeOut' }
            : isSpeaking
            ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
        whileTap={{ scale: 0.92 }}
        className={`relative shrink-0 ${sizeClass} rounded-3xl bg-white border-2 border-amber-200 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400`}
      >
        {isSpeaking && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0.6, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl border-4 border-amber-400 pointer-events-none"
          />
        )}

        {!imgFailed ? (
          <img
            src={imageSrc}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl">
            <span role="img" aria-label={name}>
              {fallbackEmoji}
            </span>
          </div>
        )}
      </motion.button>

      <button
        type="button"
        onClick={onTap}
        className="flex-1 min-w-0 text-left bg-white border-2 border-slate-200 hover:border-amber-300 rounded-2xl px-4 py-3 shadow-xs transition-colors cursor-pointer min-h-[52px] flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold text-amber-700 truncate">{name}</div>
          <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
            {speechBubble}
          </p>
        </div>
        <span
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isSpeaking
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-700'
          }`}
          aria-hidden="true"
        >
          <Volume2 className="w-5 h-5" />
        </span>
      </button>
    </div>
  );
}
