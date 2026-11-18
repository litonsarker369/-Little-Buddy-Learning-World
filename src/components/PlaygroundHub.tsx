import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Star, ArrowRight, Heart, Keyboard } from 'lucide-react';
import { IMAGE_ASSETS, toBanglaDigits } from '../data/curriculum';
import { ChildProgress } from '../utils/progressStore';
import { playPop, playSuccessChime, speakText } from '../utils/audioEngine';

export type ActiveSection =
  | 'home'
  | 'keyboard'
  | 'bangla'
  | 'english'
  | 'numbers'
  | 'math'
  | 'rhymes'
  | 'stories'
  | 'speak'
  | 'puzzle'
  | 'games'
  | 'drawing'
  | 'stickers';

interface PlaygroundHubProps {
  deviceMode: 'laptop' | 'mobile';
  progress: ChildProgress;
  onNavigate: (section: ActiveSection, preserveVoice?: boolean) => void;
}

interface IslandCard {
  id: ActiveSection;
  title: string;
  subtitle: string;
  buddyEmoji: string;
  buddyImg?: string;
  bgClass: string;
  borderClass: string;
  accentText: string;
  welcomeVoice: string;
  lang: 'bn' | 'en';
  laptopOnlyHighlight?: boolean;
}

const ISLANDS: IslandCard[] = [
  {
    id: 'keyboard',
    title: 'কিবোর্ড জাদু থিয়েটার',
    subtitle: 'কিবোর্ড চেপে কার্টুন ও শব্দ দেখো',
    buddyEmoji: '🎹',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200 hover:border-indigo-400',
    accentText: 'text-indigo-900',
    welcomeVoice: 'চলো কিবোর্ডের বোতাম চেপে মজার কার্টুন আর অক্ষর শিখি!',
    lang: 'bn',
    laptopOnlyHighlight: true,
  },
  {
    id: 'bangla',
    title: 'বাংলা বর্ণের বন',
    subtitle: 'স্বরবর্ণ অ–ঔ, ব্যঞ্জনবর্ণ ক–ঁ ও লেখা',
    buddyEmoji: '🐯',
    buddyImg: IMAGE_ASSETS.tigerMascot,
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200 hover:border-amber-400',
    accentText: 'text-amber-800',
    welcomeVoice: 'চলো টুকু বাঘের সাথে বাংলা বর্ণ শিখি!',
    lang: 'bn',
  },
  {
    id: 'english',
    title: 'English & Phonics',
    subtitle: 'আলাদা Capital (A–Z) ও Small (a–z)',
    buddyEmoji: '🦜',
    buddyImg: IMAGE_ASSETS.parrotPhonics,
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200 hover:border-emerald-400',
    accentText: 'text-emerald-800',
    welcomeVoice: 'Let us learn Capital and Small English letters with phonics!',
    lang: 'en',
  },
  {
    id: 'numbers',
    title: 'সংখ্যা ও রোমান নদী',
    subtitle: '১–১০০, 1–100 এবং রোমান I–C',
    buddyEmoji: '🐘',
    buddyImg: IMAGE_ASSETS.elephantMath,
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200 hover:border-sky-400',
    accentText: 'text-sky-800',
    welcomeVoice: 'চলো হাতু হাতির সাথে এক থেকে একশো এবং রোমান সংখ্যা গুনি!',
    lang: 'bn',
  },
  {
    id: 'math',
    title: 'ছোট্ট যোগ-বিয়োগ বাগান',
    subtitle: 'ফল ও প্রজাপতি দিয়ে মজার অংক',
    buddyEmoji: '🦋',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200 hover:border-rose-400',
    accentText: 'text-rose-800',
    welcomeVoice: 'চলো আপেল আর প্রজাপতি গুনে যোগ বিয়োগ খেলি!',
    lang: 'bn',
  },
  {
    id: 'rhymes',
    title: 'কবিতা ও ছড়া (Rhymes)',
    subtitle: 'বাংলা ও ইংরেজি ছড়া উচ্চারণ ও আবৃত্তি',
    buddyEmoji: '🎵',
    buddyImg: '/images/objects/parrot.jpg',
    bgClass: 'bg-fuchsia-50',
    borderClass: 'border-fuchsia-200 hover:border-fuchsia-400',
    accentText: 'text-fuchsia-900',
    welcomeVoice: 'চলো বাংলা ও ইংরেজি মিষ্টি ছড়া আর কবিতা আবৃত্তি করি!',
    lang: 'bn',
  },
  {
    id: 'stories',
    title: 'গল্পের আসর (Storybook)',
    subtitle: 'নৈতিক শিক্ষার অ্যানিমেটেড অডিও গল্প',
    buddyEmoji: '📖',
    buddyImg: '/images/objects/rabbit.jpg',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200 hover:border-violet-400',
    accentText: 'text-violet-900',
    welcomeVoice: '',
    lang: 'bn',
  },
  {
    id: 'speak',
    title: 'আমার সাথে বলো (Speak)',
    subtitle: 'মাইকে অক্ষর ও শব্দ উচ্চারণ অনুশীলন',
    buddyEmoji: '🎤',
    buddyImg: '/images/objects/myna.jpg',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200 hover:border-teal-400',
    accentText: 'text-teal-900',
    welcomeVoice: 'চলো মাইক্রোফোনে আমার সাথে মিষ্টি করে অক্ষর আর শব্দ বলি!',
    lang: 'bn',
  },
  {
    id: 'puzzle',
    title: 'জিগস পাজল (Puzzle)',
    subtitle: 'পশুপাখি ও ফলের টুকরো মিলিয়ে ছবি বানাও',
    buddyEmoji: '🧩',
    buddyImg: '/images/objects/mango.jpg',
    bgClass: 'bg-lime-50',
    borderClass: 'border-lime-200 hover:border-lime-400',
    accentText: 'text-lime-900',
    welcomeVoice: 'চলো পশুপাখি আর ফলের মজার জিগস পাজল মিলাই!',
    lang: 'bn',
  },
  {
    id: 'games',
    title: 'খেলার মেলা (Games)',
    subtitle: 'মেমোরি কার্ড, রং-আকৃতি ও ছায়া খেলা',
    buddyEmoji: '🎮',
    buddyImg: '/images/objects/ball.jpg',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200 hover:border-indigo-400',
    accentText: 'text-indigo-900',
    welcomeVoice: 'চলো খেলার মেলায় মজার মজার খেলা খেলে তারা জিতি!',
    lang: 'bn',
  },
  {
    id: 'drawing',
    title: 'ছবি আঁকার খাতা',
    subtitle: 'রং, তুলি, রংধনু ও তারা দিয়ে আঁকো',
    buddyEmoji: '🎨',
    buddyImg: '/images/objects/rainbow.jpg',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200 hover:border-orange-400',
    accentText: 'text-orange-900',
    welcomeVoice: 'চলো রং আর তুলি দিয়ে মনের আনন্দে ছবি আঁকি!',
    lang: 'bn',
  },
  {
    id: 'stickers',
    title: 'স্টার ও স্টিকার খাতা',
    subtitle: 'তোমার জমানো পশুপাখি বন্ধু',
    buddyEmoji: '🐼',
    buddyImg: IMAGE_ASSETS.stickerFriends,
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200 hover:border-teal-400',
    accentText: 'text-teal-800',
    welcomeVoice: 'দেখো তোমার স্টিকার খাতায় কত সুন্দর বন্ধুরা আছে!',
    lang: 'bn',
  },
];

const TREATS = [
  { emoji: '🍎', name: 'আপেল', reply: 'হুমম! লাল আপেলটা খুব মিষ্টি! ধন্যবাদ বন্ধু!' },
  { emoji: '🍌', name: 'কলা', reply: 'ওয়াও! পাকা কলা খেয়ে আমার খুব শক্তি হলো!' },
  { emoji: '🥭', name: 'আম', reply: 'মজা! পাকা আম আমার সবচেয়ে প্রিয়!' },
];

export function PlaygroundHub({
  deviceMode,
  progress,
  onNavigate,
}: PlaygroundHubProps) {
  const [bannerError, setBannerError] = useState(false);
  const [tigerError, setTigerError] = useState(false);
  const [failedCards, setFailedCards] = useState<Record<string, boolean>>({});
  const [feedingAnim, setFeedingAnim] = useState<string | null>(null);
  const feedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedTimerRef.current !== null) {
        window.clearTimeout(feedTimerRef.current);
      }
    };
  }, []);

  const visibleIslands =
    deviceMode === 'laptop'
      ? ISLANDS
      : ISLANDS.filter((i) => !i.laptopOnlyHighlight);

  const handleFeedTiger = (treat: (typeof TREATS)[number]) => {
    playSuccessChime();
    setFeedingAnim(treat.emoji);
    speakText(treat.reply, 'bn', progress.voiceEnabled);
    if (feedTimerRef.current !== null) {
      window.clearTimeout(feedTimerRef.current);
    }
    feedTimerRef.current = window.setTimeout(() => {
      setFeedingAnim(null);
      feedTimerRef.current = null;
    }, 1300);
  };

  return (
    <div className="space-y-6">
      {/* Storybook Welcome Hero */}
      <section className="relative rounded-3xl border-2 border-sky-200 overflow-hidden bg-gradient-to-br from-sky-50 via-amber-50/40 to-emerald-50 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={
                    feedingAnim
                      ? { y: [0, -14, 0, -10, 0], scale: [1, 1.12, 1] }
                      : { y: [0, -6, 0], rotate: [0, -3, 3, 0] }
                  }
                  transition={
                    feedingAnim
                      ? { duration: 0.7 }
                      : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  }
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-amber-200 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-xs"
                >
                  {!tigerError ? (
                    <img
                      src={IMAGE_ASSETS.tigerMascot}
                      alt="টুকু বাঘ"
                      referrerPolicy="no-referrer"
                      onError={() => setTigerError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">🐯</span>
                  )}
                </motion.div>

                <AnimatePresence>
                  {feedingAnim && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.5 }}
                      animate={{ opacity: 1, y: -28, scale: 1.2 }}
                      exit={{ opacity: 0, y: -48 }}
                      className="absolute -top-2 right-0 flex items-center gap-1 pointer-events-none"
                    >
                      <span className="text-2xl">{feedingAnim}</span>
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight text-balance">
                  খেলার ছলে শিখি চলো!
                </h1>
                <p className="text-sm sm:text-base font-medium text-slate-600 mt-1">
                  {deviceMode === 'laptop'
                    ? 'ল্যাপটপ মোড: কিবোর্ড চেপে কার্টুন ভিডিও অ্যানিমেশনের সাথে মজার পড়াশোনা।'
                    : 'মোবাইল মোড: বড় বাটনে ট্যাপ করে খেলার ছলে শেখা।'}
                </p>
              </div>
            </div>

            {/* Companion Nurturing Strip (Child Psychology: Emotional Bond) */}
            <div className="bg-white/85 border border-amber-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-amber-900">
                টুকু বাঘের ক্ষুধা লেগেছে! খাবার দাও:
              </span>
              <div className="flex items-center gap-2">
                {TREATS.map((t) => (
                  <motion.button
                    key={t.name}
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleFeedTiger(t)}
                    className="min-h-[42px] px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-sm font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <span>{t.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  playPop();
                  speakText(
                    'স্বাগতম ছোট্ট বন্ধু! তুমি কোন খেলাটা খেলতে চাও? নিচের যেকোনো ছবিতে ট্যাপ করো!',
                    'bn',
                    progress.voiceEnabled
                  );
                }}
                className="min-h-[48px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
                <span>বন্ধুর কথা শোনো</span>
              </motion.button>

              {deviceMode === 'laptop' && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    playPop();
                    onNavigate('keyboard');
                  }}
                  className="min-h-[48px] px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Keyboard className="w-5 h-5" />
                  <span>কিবোর্ড জাদু খেলো</span>
                </motion.button>
              )}

              <div className="flex items-center gap-3 text-sm font-bold text-slate-700 tabular-nums px-1">
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{toBanglaDigits(progress.stars)} তারা</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 min-h-[160px] lg:min-h-[260px] relative bg-sky-100">
            {!bannerError ? (
              <img
                src={IMAGE_ASSETS.safariBanner}
                alt="ছোট্ট বন্ধুদের খেলার মাঠ"
                referrerPolicy="no-referrer"
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover lg:h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sky-100 via-emerald-100 to-amber-100 flex items-center justify-center text-6xl">
                🌈🌳🦋
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Learning Island Cards */}
      <section aria-label="শেখার খেলাসমূহ">
        <div
          className={`grid gap-4 ${
            deviceMode === 'mobile'
              ? 'grid-cols-1 max-w-md mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {visibleIslands.map((island, idx) => {
            const imgBroken = failedCards[island.id];
            return (
              <motion.button
                key={island.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: idx * 0.05,
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  playPop();
                  if (island.id === 'stories') {
                    onNavigate(island.id, false);
                  } else {
                    speakText(island.welcomeVoice, island.lang, progress.voiceEnabled);
                    onNavigate(island.id, true);
                  }
                }}
                className={`group text-left rounded-3xl border-2 p-5 ${island.bgClass} ${island.borderClass} shadow-xs transition-colors cursor-pointer flex items-center gap-4 min-h-[124px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400`}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 2.6 + idx * 0.25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-20 h-20 rounded-2xl bg-white border-2 border-white shadow-xs overflow-hidden shrink-0 flex items-center justify-center"
                >
                  {island.buddyImg && !imgBroken ? (
                    <img
                      src={island.buddyImg}
                      alt={island.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedCards((prev) => ({ ...prev, [island.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl" role="img" aria-label={island.title}>
                      {island.buddyEmoji}
                    </span>
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h2
                    className={`text-lg sm:text-xl font-bold leading-snug ${island.accentText}`}
                  >
                    {island.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                    {island.subtitle}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-800 group-hover:translate-x-1 transition-transform">
                    <span>খেলা শুরু করি</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
