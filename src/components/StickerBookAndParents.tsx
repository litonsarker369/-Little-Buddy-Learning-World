import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Star, Volume2, RotateCcw, ShieldCheck, X } from 'lucide-react';
import {
  ANIMAL_STICKERS,
  IMAGE_ASSETS,
  toBanglaDigits,
} from '../data/curriculum';
import { ChildProgress } from '../utils/progressStore';
import { playPop, speakText } from '../utils/audioEngine';

interface StickerBookProps {
  progress: ChildProgress;
  voiceEnabled: boolean;
}

export function StickerBook({ progress, voiceEnabled }: StickerBookProps) {
  const [bannerImgError, setBannerImgError] = useState(false);
  const unlockedCount = ANIMAL_STICKERS.filter(
    (s) => progress.stars >= s.requiredStars || progress.unlockedStickers.includes(s.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Showcase Card */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-amber-200 bg-amber-50 shrink-0 flex items-center justify-center">
          {!bannerImgError ? (
            <img
              src={IMAGE_ASSETS.stickerFriends}
              alt="স্টিকার খাতার পশুপাখি"
              referrerPolicy="no-referrer"
              onError={() => setBannerImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl">🐼</span>
          )}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            তোমার স্টিকার খাতা
          </h2>
          <p className="text-sm sm:text-base font-medium text-slate-600">
            খেলে খেলে তারা (★) জমাও আর সব নতুন পশুপাখি আনলক করো! আনলক করা বন্ধুদের গায়ে ট্যাপ করলে তারা কথা বলবে।
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-bold text-amber-700 tabular-nums">
            <span>মোট তারা: {toBanglaDigits(progress.stars)} ★</span>
            <span aria-hidden="true">·</span>
            <span>
              আনলক হয়েছে: {toBanglaDigits(unlockedCount)} /{' '}
              {toBanglaDigits(ANIMAL_STICKERS.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Sticker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
        {ANIMAL_STICKERS.map((sticker, idx) => {
          const unlocked = progress.stars >= sticker.requiredStars || progress.unlockedStickers.includes(sticker.id);
          const remaining = Math.max(0, sticker.requiredStars - progress.stars);

          return (
            <motion.button
              key={sticker.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileTap={{ scale: 0.94 }}
              whileHover={unlocked ? { y: -4 } : undefined}
              onClick={() => {
                playPop();
                if (unlocked) {
                  speakText(sticker.soundText, 'bn', voiceEnabled);
                } else {
                  speakText(
                    `আরো ${remaining}টি তারা জমালে ${sticker.nameBn} আনলক হবে!`,
                    'bn',
                    voiceEnabled
                  );
                }
              }}
              className={`relative rounded-3xl border-2 p-4 text-center flex flex-col items-center justify-center gap-2 min-h-[156px] cursor-pointer transition-colors ${
                unlocked
                  ? `${sticker.bgClass} shadow-xs`
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <motion.div
                animate={
                  unlocked
                    ? { y: [0, -5, 0] }
                    : undefined
                }
                transition={{
                  duration: 2.5 + (idx % 3) * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`text-5xl sm:text-6xl leading-none select-none ${
                  unlocked ? '' : 'grayscale opacity-35'
                }`}
              >
                {sticker.emoji}
              </motion.div>

              <div>
                <div
                  className={`text-base font-bold ${
                    unlocked ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {sticker.nameBn}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {sticker.nameEn}
                </div>
              </div>

              {unlocked ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>কথা শোনো</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 tabular-nums">
                  <Lock className="w-3.5 h-3.5" />
                  <span>আরো {toBanglaDigits(remaining)} ★</span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface ParentGateModalProps {
  open: boolean;
  progress: ChildProgress;
  usingFallbackVoice: boolean;
  onClose: () => void;
  onResetProgress: () => void;
}

export function ParentGateModal({
  open,
  progress,
  usingFallbackVoice,
  onClose,
  onResetProgress,
}: ParentGateModalProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [gateError, setGateError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleClose = () => {
    setUnlocked(false);
    setAnswerInput('');
    setGateError(false);
    setConfirmReset(false);
    onClose();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerInput.trim() === '9' || answerInput.trim() === '৯') {
      setUnlocked(true);
      setGateError(false);
    } else {
      setGateError(true);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parent-gate-title"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-md bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3
                  id="parent-gate-title"
                  className="text-xl font-bold text-slate-900"
                >
                  অভিভাবক কর্নার (Parent View)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="বন্ধ করুন"
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!unlocked ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-sm text-slate-600 font-medium">
                  শিশুর সুরক্ষার জন্য ছোট এই প্রশ্নের উত্তর দিন:
                </p>
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center font-display text-2xl font-bold text-slate-900">
                  5 + 4 = ?
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="উত্তর লিখুন (যেমন: 9)"
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:outline-none text-base font-bold text-slate-900"
                />
                {gateError && (
                  <p className="text-xs font-bold text-rose-600">
                    উত্তরটি সঠিক হয়নি, অনুগ্রহ করে আবার চেষ্টা করুন।
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base cursor-pointer"
                >
                  প্রবেশ করুন
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="text-xs font-bold text-amber-700">মোট তারা</div>
                    <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-0.5 flex items-center gap-1">
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      <span>{progress.stars}</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-700">শেখা আইটেম</div>
                    <div className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                      {progress.masteredIds.length}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5 text-sm">
                  <div className="font-bold text-slate-800 mb-1">
                    বিষয়ভিত্তিক অনুশীলন
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>বাংলা বর্ণ ও খেলা</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {progress.subjectCounts.bangla}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>English & Phonics</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {progress.subjectCounts.english}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>সংখ্যা ও রোমান (১–১০০)</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {progress.subjectCounts.numbers}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ছোট যোগ ও বিয়োগ</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {progress.subjectCounts.math}
                    </span>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700">
                  <div className="font-bold text-sky-900">
                    শিশু-নিরাপদ ও স্টোর প্রস্তুতি (Play Store / App Store)
                  </div>
                  <p>
                    বিজ্ঞাপনমুক্ত, স্থানীয় প্রোগ্রেস সেভ এবং{' '}
                    <a
                      href="/privacy.html"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-sky-700 underline"
                    >
                      গোপনীয়তা নীতি (/privacy.html)
                    </a>{' '}
                    সংযুক্ত রয়েছে।
                  </p>
                  <div className="text-slate-500 pt-0.5">
                    ভয়েস মোড:{' '}
                    <span className="font-bold text-slate-700">
                      {usingFallbackVoice
                        ? 'ডিভাইস ভয়েস ব্যাকআপ চালু'
                        : 'AI অটো ভয়েস প্রস্তুত'}
                    </span>
                  </div>
                </div>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full h-11 rounded-xl border-2 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>প্রোগ্রেস রিসেট করুন</span>
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 space-y-2 text-center">
                    <p className="text-xs font-bold text-rose-700">
                      সব স্টার ও স্টিকার মুছে ফেলতে চান?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        না, থাকুক
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetProgress();
                          setConfirmReset(false);
                        }}
                        className="flex-1 h-10 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
                      >
                        হ্যাঁ, রিসেট করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
