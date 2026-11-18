import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  Home,
  BookOpen,
  Sparkles,
  Hash,
  Calculator,
  Award,
  Star,
  Volume2,
  VolumeX,
  ShieldCheck,
  Monitor,
  Smartphone,
  Keyboard,
  Music,
  Palette,
  BookHeart,
  Mic,
  Puzzle,
  Gamepad2,
  LayoutGrid,
  X,
} from 'lucide-react';
import {
  AnimalSticker,
  CurriculumItem,
  NumberItem,
  RhymeItem,
  StoryBookItem,
  JigsawPuzzleItem,
  toBanglaDigits,
} from './data/curriculum';
import {
  playPop,
  playCelebrationFanfare,
  stopSpeaking,
  subscribeSpeaking,
  subscribeVoiceStatus,
} from './utils/audioEngine';
import {
  ChildProgress,
  loadProgress,
  saveProgress,
  applyStarReward,
  recordExploreItem,
  resetChildProgress,
  SubjectKey,
} from './utils/progressStore';
import { PlaygroundHub, ActiveSection } from './components/PlaygroundHub';
import { LetterPlayground } from './components/LetterPlayground';
import { VisualMathGarden } from './components/VisualMathGarden';
import { KeyboardMagicStage } from './components/KeyboardMagicStage';
import { NumbersRomanPlayground } from './components/NumbersRomanPlayground';
import { RhymesPlayground } from './components/RhymesPlayground';
import { AudioStorybook } from './components/AudioStorybook';
import { SpeakWithMe } from './components/SpeakWithMe';
import { JigsawPuzzlePlayground } from './components/JigsawPuzzlePlayground';
import { LearningGamesArena } from './components/LearningGamesArena';
import { DrawingBoard } from './components/DrawingBoard';
import { StickerBook, ParentGateModal } from './components/StickerBookAndParents';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { usePWAInstall } from './hooks/usePWAInstall';

const LAPTOP_NAV_ITEMS: {
  id: ActiveSection;
  label: string;
  icon: typeof Home;
}[] = [
  { id: 'home', label: 'হোম', icon: Home },
  { id: 'keyboard', label: 'কিবোর্ড জাদু', icon: Keyboard },
  { id: 'bangla', label: 'বাংলা', icon: BookOpen },
  { id: 'english', label: 'English', icon: Sparkles },
  { id: 'numbers', label: '১–১০০', icon: Hash },
  { id: 'math', label: 'যোগ-বিয়োগ', icon: Calculator },
  { id: 'rhymes', label: 'ছড়া', icon: Music },
  { id: 'stories', label: 'গল্পের আসর', icon: BookHeart },
  { id: 'speak', label: 'আমার সাথে বলো', icon: Mic },
  { id: 'puzzle', label: 'পাজল', icon: Puzzle },
  { id: 'games', label: 'খেলার মেলা', icon: Gamepad2 },
  { id: 'drawing', label: 'ছবি আঁকি', icon: Palette },
  { id: 'stickers', label: 'স্টিকার', icon: Award },
];

const MOBILE_NAV_ITEMS: {
  id: ActiveSection;
  label: string;
  icon: typeof Home;
}[] = [
  { id: 'home', label: 'হোম', icon: Home },
  { id: 'bangla', label: 'বাংলা', icon: BookOpen },
  { id: 'english', label: 'English', icon: Sparkles },
  { id: 'numbers', label: 'সংখ্যা', icon: Hash },
  { id: 'math', label: 'অংক', icon: Calculator },
  { id: 'rhymes', label: 'ছড়া', icon: Music },
  { id: 'stories', label: 'গল্প', icon: BookHeart },
  { id: 'speak', label: 'বলো', icon: Mic },
  { id: 'puzzle', label: 'পাজল', icon: Puzzle },
  { id: 'games', label: 'খেলা', icon: Gamepad2 },
  { id: 'drawing', label: 'আঁকি', icon: Palette },
  { id: 'stickers', label: 'স্টিকার', icon: Award },
];

const PRIMARY_MOBILE_TABS: {
  id: ActiveSection;
  label: string;
  icon: typeof Home;
}[] = [
  { id: 'home', label: 'হোম', icon: Home },
  { id: 'bangla', label: 'বাংলা', icon: BookOpen },
  { id: 'numbers', label: '১–১০০', icon: Hash },
  { id: 'stories', label: 'গল্প', icon: BookHeart },
];

const VALID_SECTIONS = new Set<ActiveSection>([
  'home',
  'keyboard',
  'bangla',
  'english',
  'numbers',
  'math',
  'rhymes',
  'stories',
  'speak',
  'puzzle',
  'games',
  'drawing',
  'stickers',
]);

function getInitialSectionFromUrl(): ActiveSection {
  if (typeof window === 'undefined') return 'home';
  const param = new URLSearchParams(window.location.search).get('section');
  if (param && VALID_SECTIONS.has(param as ActiveSection)) {
    return param as ActiveSection;
  }
  return 'home';
}

export default function App() {
  const { isInstalled } = usePWAInstall();
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [manualPreviewMode, setManualPreviewMode] = useState<'laptop' | 'mobile' | null>(null);
  const deviceMode: 'laptop' | 'mobile' = isMobileViewport
    ? 'mobile'
    : manualPreviewMode ?? 'laptop';

  const [section, setSection] = useState<ActiveSection>(() => getInitialSectionFromUrl());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [progress, setProgress] = useState<ChildProgress>(() => loadProgress());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [usingFallbackVoice, setUsingFallbackVoice] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [starRainTrigger, setStarRainTrigger] = useState(0);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [newlyUnlockedSticker, setNewlyUnlockedSticker] =
    useState<AnimalSticker | null>(null);
  const [parentOpen, setParentOpen] = useState(false);
  const lastMilestoneStarsRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(mq.matches);
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    const unsubSpeak = subscribeSpeaking(setIsSpeaking);
    const unsubStatus = subscribeVoiceStatus(setUsingFallbackVoice);
    return () => {
      unsubSpeak();
      unsubStatus();
      stopSpeaking();
    };
  }, []);

  const handleNavigate = useCallback(
    (next: ActiveSection, preserveVoice = false) => {
      if (!preserveVoice) {
        stopSpeaking();
      }
      setMobileMenuOpen(false);
      setSection(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleSwitchDeviceMode = (nextMode: 'laptop' | 'mobile') => {
    playPop();
    setManualPreviewMode(nextMode);
    if (nextMode === 'mobile' && section === 'keyboard') {
      setSection('home');
    }
  };

  const toggleVoice = () => {
    playPop();
    setProgress((prev) => {
      const next = { ...prev, voiceEnabled: !prev.voiceEnabled };
      if (!next.voiceEnabled) {
        stopSpeaking();
      }
      saveProgress(next);
      return next;
    });
  };

  const triggerReward = useCallback(
    (subject: SubjectKey, itemId?: string, stars = 1) => {
      setConfettiTrigger((c) => c + 1);
      setProgress((prev) => {
        const { next, newlyUnlocked } = applyStarReward(
          prev,
          subject,
          itemId,
          stars
        );
        const crossedFiveStarMilestone =
          Math.floor(next.stars / 5) > Math.floor(prev.stars / 5);

        if (
          (newlyUnlocked || crossedFiveStarMilestone) &&
          lastMilestoneStarsRef.current !== next.stars
        ) {
          lastMilestoneStarsRef.current = next.stars;
          playCelebrationFanfare();
          setMilestoneTitle(
            newlyUnlocked
              ? `নতুন বন্ধু ${newlyUnlocked.emoji} ${newlyUnlocked.nameBn}! তারা বৃষ্টি!`
              : `${toBanglaDigits(next.stars)} তারা মাইলফলক! তারা বৃষ্টি!`
          );
          setStarRainTrigger((r) => r + 1);
          if (newlyUnlocked) {
            setNewlyUnlockedSticker(newlyUnlocked);
          }
        }
        return next;
      });
    },
    []
  );

  const handleExploreLetter = useCallback((item: CurriculumItem) => {
    const subj: SubjectKey = item.lang === 'bn' ? 'bangla' : 'english';
    setProgress((prev) => recordExploreItem(prev, subj, item.id));
  }, []);

  const handleCorrectLetter = useCallback(
    (item: CurriculumItem) => {
      const subj: SubjectKey = item.lang === 'bn' ? 'bangla' : 'english';
      triggerReward(subj, item.id, 1);
    },
    [triggerReward]
  );

  const handleExploreNumber = useCallback((num: NumberItem) => {
    setProgress((prev) => recordExploreItem(prev, 'numbers', `num-${num.value}`));
  }, []);

  const handleCorrectNumber = useCallback(
    (num: NumberItem) => {
      triggerReward('numbers', `num-${num.value}`, 1);
    },
    [triggerReward]
  );

  const handleCorrectMath = useCallback(
    (puzzleId: string) => {
      triggerReward('math', puzzleId, 1);
    },
    [triggerReward]
  );

  const handleExploreRhyme = useCallback((rhyme: RhymeItem) => {
    const subj: SubjectKey = rhyme.lang === 'bn' ? 'bangla' : 'english';
    setProgress((prev) => recordExploreItem(prev, subj, rhyme.id));
  }, []);

  const handleCompleteRhyme = useCallback(
    (rhyme: RhymeItem) => {
      const subj: SubjectKey = rhyme.lang === 'bn' ? 'bangla' : 'english';
      triggerReward(subj, rhyme.id, 1);
    },
    [triggerReward]
  );

  const handleExploreStory = useCallback((story: StoryBookItem) => {
    const subj: SubjectKey = story.lang === 'bn' ? 'bangla' : 'english';
    setProgress((prev) => recordExploreItem(prev, subj, story.id));
  }, []);

  const handleCompleteStory = useCallback(
    (story: StoryBookItem) => {
      const subj: SubjectKey = story.lang === 'bn' ? 'bangla' : 'english';
      triggerReward(subj, story.id, 1);
    },
    [triggerReward]
  );

  const handleExplorePuzzle = useCallback((puzzle: JigsawPuzzleItem) => {
    const subj: SubjectKey = puzzle.lang === 'bn' ? 'bangla' : 'english';
    setProgress((prev) => recordExploreItem(prev, subj, puzzle.id));
  }, []);

  const handleCompletePuzzle = useCallback(
    (puzzle: JigsawPuzzleItem, starsEarned: number) => {
      const subj: SubjectKey = puzzle.lang === 'bn' ? 'bangla' : 'english';
      triggerReward(subj, puzzle.id, starsEarned);
    },
    [triggerReward]
  );

  const handleEarnGameStar = useCallback(
    (gameItemId: string, stars = 1) => {
      triggerReward('math', gameItemId, stars);
    },
    [triggerReward]
  );

  const handleCompleteDrawing = useCallback(
    (drawingId: string) => {
      triggerReward('bangla', drawingId, 1);
    },
    [triggerReward]
  );

  const handleResetProgress = () => {
    const fresh = resetChildProgress();
    lastMilestoneStarsRef.current = 0;
    setProgress(fresh);
    setParentOpen(false);
    setSection('home');
  };

  const navItems =
    deviceMode === 'laptop' ? LAPTOP_NAV_ITEMS : MOBILE_NAV_ITEMS;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#FFFDF7] text-slate-900 flex flex-col safe-pt">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => {
              playPop();
              handleNavigate('home');
            }}
            className="font-display text-sm sm:text-lg font-bold text-slate-900 min-w-0 cursor-pointer flex items-center gap-1.5 sm:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
          >
            <span aria-hidden="true" className="shrink-0">🐯</span>
            <span className="truncate">ছোট্ট বন্ধু পাঠশালা</span>
          </button>

          {/* Zone 2: Desktop Navigation Links (Visible in Laptop Mode) */}
          {deviceMode === 'laptop' && (
            <nav
              aria-label="ল্যাপটপ নেভিগেশন"
              className="hidden lg:flex items-center gap-2 xl:gap-3.5 text-xs xl:text-sm font-bold text-slate-600 overflow-x-auto"
            >
              {navItems.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playPop();
                      handleNavigate(item.id);
                    }}
                    className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                      active
                        ? 'text-amber-600 border-amber-500'
                        : 'border-transparent hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zone 3: Install + Stars + Voice + Parent */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton deviceMode={deviceMode} />

            <motion.button
              type="button"
              key={progress.stars}
              initial={{ scale: 1.38, rotate: -8 }}
              animate={{ scale: [1.38, 0.94, 1.08, 1], rotate: [ -8, 6, 0 ] }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              onClick={() => {
                playPop();
                handleNavigate('stickers');
              }}
              aria-label={`মোট তারা ${progress.stars}`}
              className="h-9 px-2 sm:px-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs sm:text-sm tabular-nums inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
              <span>{toBanglaDigits(progress.stars)}</span>
            </motion.button>

            <button
              type="button"
              onClick={toggleVoice}
              aria-label={progress.voiceEnabled ? 'ভয়েস বন্ধ করুন' : 'ভয়েস চালু করুন'}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                progress.voiceEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              {progress.voiceEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playPop();
                setParentOpen(true);
              }}
              aria-label="অভিভাবক কর্নার"
              className="h-9 px-2 sm:px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অভিভাবক</span>
            </button>
          </div>
        </header>

        {/* Desktop/Tablet Toolbar (Hidden on phones & standalone store installs for clean native feel) */}
        {!isInstalled && (
          <div className="hidden md:block bg-sky-50/80 border-b border-sky-100 px-3 sm:px-6 py-2">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSwitchDeviceMode('laptop')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    deviceMode === 'laptop'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>ল্যাপটপ ভিউ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchDeviceMode('mobile')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                    deviceMode === 'mobile'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>মোবাইল প্রিভিউ</span>
                </button>
              </div>

              {deviceMode === 'laptop' && (
                <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        section === item.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Play Viewport (Fluid across all screens + simulates mobile width only during desktop preview) */}
        <main
          className={`flex-1 w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6 transition-all ${
            !isMobileViewport && manualPreviewMode === 'mobile'
              ? 'max-w-md pb-24 border-x border-slate-200/70 bg-[#FFFDF7] shadow-xs'
              : 'max-w-7xl pb-24 md:pb-12'
          }`}
        >
          <AnimatePresence mode="wait">
              <motion.div
                key={`${deviceMode}-${section}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {section === 'home' && (
                  <PlaygroundHub
                    deviceMode={deviceMode}
                    progress={progress}
                    onNavigate={handleNavigate}
                  />
                )}

                {section === 'keyboard' && (
                  <KeyboardMagicStage
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    onKeyPlayReward={(id) => triggerReward('english', id, 1)}
                  />
                )}

                {section === 'bangla' && (
                  <LetterPlayground
                    modeType="bangla"
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExploreItem={handleExploreLetter}
                    onCorrectAnswer={handleCorrectLetter}
                  />
                )}

                {section === 'english' && (
                  <LetterPlayground
                    modeType="english"
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExploreItem={handleExploreLetter}
                    onCorrectAnswer={handleCorrectLetter}
                  />
                )}

                {section === 'numbers' && (
                  <NumbersRomanPlayground
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExploreNumber={handleExploreNumber}
                    onCorrectAnswer={handleCorrectNumber}
                  />
                )}

                {section === 'math' && (
                  <VisualMathGarden
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    onCorrectMath={handleCorrectMath}
                  />
                )}

                {section === 'rhymes' && (
                  <RhymesPlayground
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExploreRhyme={handleExploreRhyme}
                    onCompleteRhyme={handleCompleteRhyme}
                  />
                )}

                {section === 'stories' && (
                  <AudioStorybook
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExploreStory={handleExploreStory}
                    onCompleteStory={handleCompleteStory}
                  />
                )}

                {section === 'speak' && (
                  <SpeakWithMe
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExploreItem={handleExploreLetter}
                    onSuccessSpeak={handleCorrectLetter}
                  />
                )}

                {section === 'puzzle' && (
                  <JigsawPuzzlePlayground
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    masteredIds={progress.masteredIds}
                    onExplorePuzzle={handleExplorePuzzle}
                    onCompletePuzzle={handleCompletePuzzle}
                  />
                )}

                {section === 'games' && (
                  <LearningGamesArena
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    onEarnStar={handleEarnGameStar}
                  />
                )}

                {section === 'drawing' && (
                  <DrawingBoard
                    deviceMode={deviceMode}
                    voiceEnabled={progress.voiceEnabled}
                    isSpeaking={isSpeaking}
                    onCompleteDrawing={handleCompleteDrawing}
                  />
                )}

                {section === 'stickers' && (
                  <StickerBook
                    progress={progress}
                    voiceEnabled={progress.voiceEnabled}
                  />
                )}
              </motion.div>
            </AnimatePresence>
        </main>

        {/* Mobile All-Sections Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-xs flex items-end justify-center"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-amber-200 p-4 pb-24 shadow-2xl max-h-[80vh] overflow-y-auto space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">
                    ✨ সব খেলা ও শেখার পাতা
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="মেনু বন্ধ করুন"
                    className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {MOBILE_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = section === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playPop();
                          handleNavigate(item.id);
                        }}
                        className={`min-h-[72px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          active
                            ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                            : 'bg-amber-50/50 border-amber-100 hover:border-amber-300 text-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold leading-tight text-center">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Native 5-Tab Mobile Bottom Bar (Active on mobile viewport or mobile preview) */}
        <nav
          aria-label="মোবাইল নেভিগেশন"
          className={`${
            !isMobileViewport && manualPreviewMode === 'mobile'
              ? 'fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40'
              : 'md:hidden fixed bottom-0 left-0 right-0 z-40'
          } bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2 pt-1.5 safe-pb shadow-[0_-4px_16px_rgba(15,23,42,0.05)]`}
        >
          {PRIMARY_MOBILE_TABS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id && !mobileMenuOpen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playPop();
                  handleNavigate(item.id);
                }}
                className={`min-h-[48px] flex-1 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-colors ${
                  active ? 'text-amber-600' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[11px] font-bold leading-tight mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              playPop();
              setMobileMenuOpen((v) => !v);
            }}
            aria-expanded={mobileMenuOpen}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-colors ${
              mobileMenuOpen ||
              !PRIMARY_MOBILE_TABS.some((t) => t.id === section)
                ? 'text-amber-600'
                : 'text-slate-500'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[11px] font-bold leading-tight mt-0.5">
              সব খেলা
            </span>
          </button>
        </nav>

        <OfflineIndicator />

        <CelebrationOverlay
          confettiTrigger={confettiTrigger}
          starRainTrigger={starRainTrigger}
          milestoneTitle={milestoneTitle}
          unlockedSticker={newlyUnlockedSticker}
          onDismissSticker={() => setNewlyUnlockedSticker(null)}
        />

        <ParentGateModal
          open={parentOpen}
          progress={progress}
          usingFallbackVoice={usingFallbackVoice}
          onClose={() => setParentOpen(false)}
          onResetProgress={handleResetProgress}
        />
      </div>
    </MotionConfig>
  );
}
