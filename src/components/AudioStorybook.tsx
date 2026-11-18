import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookHeart,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Volume2,
  CheckCircle2,
  Star,
  BookOpen,
  Layers,
} from 'lucide-react';
import {
  StoryBookItem,
  StorySceneMotion,
  IMAGE_ASSETS,
  toBanglaDigits,
} from '../data/curriculum';
import {
  playPop,
  playSuccessChime,
  speakText,
  prefetchSpeech,
  stopSpeaking,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';

type StoryFilter = 'all' | 'bn' | 'en';

interface AudioStorybookProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  masteredIds: string[];
  onExploreStory: (story: StoryBookItem) => void;
  onCompleteStory: (story: StoryBookItem) => void;
}

function getSceneMotionAnimate(motionType: StorySceneMotion, active: boolean) {
  if (!active) {
    return { y: [0, -5, 0], scale: 1 };
  }
  switch (motionType) {
    case 'hop':
      return { y: [0, -16, 0, -9, 0], scale: [1, 1.05, 1, 1.03, 1] };
    case 'fly':
      return {
        y: [0, -14, -4, -12, 0],
        x: [-5, 6, -3, 5, 0],
        rotate: [-3, 3, -2, 2, 0],
      };
    case 'float':
      return { y: [0, -10, 2, -8, 0], rotate: [-2, 2, -1.5, 1.5, 0] };
    case 'shine':
      return { scale: [1, 1.08, 1.02, 1.07, 1], rotate: [0, -1.5, 1.5, 0] };
    case 'share':
    default:
      return { scale: [1, 1.07, 1.03, 1.08, 1], y: [0, -8, 0] };
  }
}

export function AudioStorybook({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  masteredIds,
  onExploreStory,
  onCompleteStory,
}: AudioStorybookProps) {
  const [storiesList, setStoriesList] = useState<StoryBookItem[]>([]);
  const [filter, setFilter] = useState<StoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  // 0..scenes.length-1 = scenes, scenes.length = moral finale step
  const [sceneStep, setSceneStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showFullReader, setShowFullReader] = useState(false);

  const playbackSessionRef = useRef(0);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const completedInRunRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    void import('../data/storiesAll').then((mod) => {
      if (active) setStoriesList(mod.CHILDREN_STORIES);
    });
    return () => {
      active = false;
    };
  }, []);

  const banglaCount = useMemo(
    () => storiesList.filter((s) => s.lang === 'bn').length,
    [storiesList]
  );
  const englishCount = useMemo(
    () => storiesList.filter((s) => s.lang === 'en').length,
    [storiesList]
  );

  const filteredStories = useMemo(() => {
    if (filter === 'all') return storiesList;
    return storiesList.filter((s) => s.lang === filter);
  }, [filter, storiesList]);

  const activeStory = filteredStories[selectedIndex] ?? filteredStories[0];
  const totalSteps = activeStory ? activeStory.scenes.length + 1 : 1;
  const isMoralStep = activeStory ? sceneStep >= activeStory.scenes.length : false;
  const currentScene = activeStory && !isMoralStep ? activeStory.scenes[sceneStep] : null;
  const activeWordCount = useMemo(() => {
    if (!activeStory) return 0;
    return activeStory.scenes
      .map((s) => s.narration)
      .join(' ')
      .trim()
      .split(/\s+/).length;
  }, [activeStory]);

  useEffect(() => {
    setImgError(false);
  }, [activeStory?.id, sceneStep]);

  const pausePlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    setIsPlaying(false);
    stopSpeaking();
  }, []);

  const waitDelay = (ms: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const playStoryFromStep = useCallback(
    async (story: StoryBookItem, startStep: number, speakTitleFirst: boolean) => {
      playbackSessionRef.current += 1;
      const sessionId = playbackSessionRef.current;

      stopSpeaking();
      setIsPlaying(true);
      setCelebrating(false);
      onExploreStory(story);

      const speakWithMinimumPace = async (text: string, minMsIfMuted = 2600) => {
        const startTime = Date.now();
        await speakText(text, story.lang, voiceEnabledRef.current, { mode: 'story' });
        if (playbackSessionRef.current !== sessionId) return false;
        const elapsed = Date.now() - startTime;
        if (!voiceEnabledRef.current && elapsed < minMsIfMuted) {
          await waitDelay(minMsIfMuted - elapsed);
        }
        return playbackSessionRef.current === sessionId;
      };

      if (speakTitleFirst && startStep === 0) {
        setSceneStep(0);
        if (voiceEnabledRef.current && story.scenes[0]) {
          prefetchSpeech(story.scenes[0].narration, story.lang, 'story');
        }
        const okTitle = await speakWithMinimumPace(story.title, 1500);
        if (!okTitle) return;
        await waitDelay(200);
        if (playbackSessionRef.current !== sessionId) return;
      }

      for (let step = startStep; step < story.scenes.length; step++) {
        if (playbackSessionRef.current !== sessionId) return;
        setSceneStep(step);
        if (voiceEnabledRef.current) {
          const nextText =
            step + 1 < story.scenes.length
              ? story.scenes[step + 1].narration
              : story.moralVoice;
          prefetchSpeech(nextText, story.lang, 'story');
        }
        const okScene = await speakWithMinimumPace(story.scenes[step].narration, 2800);
        if (!okScene) return;
        await waitDelay(220);
        if (playbackSessionRef.current !== sessionId) return;
      }

      // Final step: Moral Education Lesson
      if (playbackSessionRef.current !== sessionId) return;
      setSceneStep(story.scenes.length);
      const okMoral = await speakWithMinimumPace(story.moralVoice, 3000);
      if (!okMoral) return;

      if (playbackSessionRef.current === sessionId) {
        setIsPlaying(false);
        playSuccessChime();
        setCelebrating(true);
        if (!completedInRunRef.current[story.id]) {
          completedInRunRef.current[story.id] = true;
          onCompleteStory(story);
        }
        window.setTimeout(() => {
          setCelebrating(false);
        }, 1200);
      }
    },
    [onCompleteStory, onExploreStory]
  );

  // Auto-play story gently whenever section opens or active story changes
  useEffect(() => {
    if (!activeStory) return;
    const timer = window.setTimeout(() => {
      void playStoryFromStep(activeStory, 0, true);
    }, 140);

    return () => {
      window.clearTimeout(timer);
      playbackSessionRef.current += 1;
      stopSpeaking();
    };
  }, [activeStory, playStoryFromStep]);

  const handleSelectStory = useCallback(
    (idx: number) => {
      playPop();
      pausePlayback();
      setSceneStep(0);
      setSelectedIndex(idx);
    },
    [pausePlayback]
  );

  const handleTogglePlay = useCallback(() => {
    if (!activeStory) return;
    playPop();
    if (isPlaying) {
      pausePlayback();
    } else {
      const resumeStep = sceneStep >= totalSteps - 1 ? 0 : sceneStep;
      void playStoryFromStep(activeStory, resumeStep, resumeStep === 0);
    }
  }, [activeStory, isPlaying, pausePlayback, playStoryFromStep, sceneStep, totalSteps]);

  const handleReplay = useCallback(() => {
    if (!activeStory) return;
    playPop();
    void playStoryFromStep(activeStory, 0, true);
  }, [activeStory, playStoryFromStep]);

  const handleJumpToStep = useCallback(
    (nextStep: number) => {
      if (!activeStory) return;
      const bounded = Math.max(0, Math.min(totalSteps - 1, nextStep));
      playPop();
      void playStoryFromStep(activeStory, bounded, false);
    },
    [activeStory, playStoryFromStep, totalSteps]
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
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleJumpToStep(sceneStep + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleJumpToStep(sceneStep - 1);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReplay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deviceMode, handleJumpToStep, handleReplay, handleTogglePlay, sceneStep]);

  if (!activeStory) {
    return (
      <div className="min-h-[260px] flex items-center justify-center">
        <div className="bg-white border-2 border-indigo-200 rounded-3xl px-6 py-4 text-indigo-700 font-bold text-base animate-pulse">
          📖 গল্পের বই খোলা হচ্ছে...
        </div>
      </div>
    );
  }

  const isStageActive = isPlaying || isSpeaking;

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={
          activeStory.lang === 'bn'
            ? IMAGE_ASSETS.tigerMascot
            : IMAGE_ASSETS.parrotPhonics
        }
        fallbackEmoji={activeStory.lang === 'bn' ? '🐯' : '🦜'}
        name="নৈতিক গল্পের আসর"
        speechBubble={
          isMoralStep
            ? `আজকের শিক্ষা: ${activeStory.moralLabel}`
            : `গল্প শুনছি: ${activeStory.title}`
        }
        isSpeaking={isStageActive}
        celebrating={celebrating}
        onTap={handleTogglePlay}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-indigo-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              pausePlayback();
              setFilter('all');
              setSelectedIndex(0);
              setSceneStep(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            সব গল্প ({toBanglaDigits(storiesList.length)})
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              pausePlayback();
              setFilter('bn');
              setSelectedIndex(0);
              setSceneStep(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'bn'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            বাংলা গল্প ({toBanglaDigits(banglaCount)})
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              pausePlayback();
              setFilter('en');
              setSelectedIndex(0);
              setSceneStep(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'en'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            English Stories ({toBanglaDigits(englishCount)})
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm font-bold text-amber-900">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
          <span>শিক্ষা: {activeStory.moralLabel}</span>
        </div>
      </div>

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 ল্যাপটপ কিবোর্ড: Space শুরু/থামাও · ← → আগের বা পরের দৃশ্য · R প্রথম থেকে গল্প শোনো
        </div>
      )}

      {/* Animated Audio Storybook Theater */}
      <section
        aria-label={activeStory.title}
        className={`relative rounded-3xl border-2 ${activeStory.accentBorder} ${activeStory.accentBg} p-4 sm:p-7 shadow-sm overflow-hidden space-y-5`}
      >
        {/* Top Story Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200">
                {activeStory.lang === 'bn' ? 'বাংলা নৈতিক গল্প' : 'English Moral Story'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
                {toBanglaDigits(activeWordCount)} শব্দ
              </span>
              <span className="tabular-nums">
                {isMoralStep
                  ? 'গল্পের নৈতিক শিক্ষা'
                  : `অধ্যায় ${toBanglaDigits(sceneStep + 1)} / ${toBanglaDigits(
                      activeStory.scenes.length
                    )}`}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {activeStory.title}
            </h2>
          </div>

          {/* Primary Play/Pause, Reader Mode & Replay Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handleTogglePlay}
              className={`min-h-[48px] px-5 rounded-2xl font-bold text-sm sm:text-base inline-flex items-center gap-2 shadow-xs cursor-pointer transition-colors ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
                  <span>থামাও</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>{isMoralStep ? 'আবার শোনো' : 'গল্প শোনো'}</span>
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                playPop();
                setShowFullReader((v) => !v);
              }}
              className={`min-h-[48px] px-4 rounded-2xl border-2 font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                showFullReader
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-800'
              }`}
            >
              {showFullReader ? (
                <>
                  <Layers className="w-4 h-4" />
                  <span>দৃশ্য আকারে দেখো</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>সম্পূর্ণ গল্প পড়ো</span>
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handleReplay}
              aria-label="প্রথম থেকে গল্প শোনো"
              className="min-h-[48px] px-4 rounded-2xl bg-white hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-300 text-slate-800 font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">প্রথম থেকে</span>
            </motion.button>
          </div>
        </div>

        {/* Animated Visual Stage */}
        <AnimatePresence mode="wait">
          {!isMoralStep && currentScene ? (
            <motion.div
              key={`${activeStory.id}-scene-${sceneStep}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className={`relative rounded-3xl border-2 border-white/90 bg-gradient-to-br ${currentScene.backdropClass} p-5 sm:p-8 shadow-xs overflow-hidden`}
            >
              {/* Soft Animated Clouds & Twinkling Sparkles Backdrop */}
              <motion.span
                aria-hidden="true"
                animate={{ x: [-12, 18, -12] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-3 left-6 text-3xl opacity-55 pointer-events-none select-none"
              >
                ☁️
              </motion.span>
              <motion.span
                aria-hidden="true"
                animate={{ x: [14, -14, 14] }}
                transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 right-10 text-2xl opacity-50 pointer-events-none select-none"
              >
                ☁️
              </motion.span>
              <motion.span
                aria-hidden="true"
                animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.4, 0.95, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-4 right-6 text-xl pointer-events-none select-none"
              >
                ✨
              </motion.span>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Animated Character / Scene Picture */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative">
                    <motion.div
                      animate={getSceneMotionAnimate(
                        currentScene.motion,
                        isStageActive
                      )}
                      transition={{
                        duration: currentScene.motion === 'hop' ? 1.5 : 2.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      onClick={handleTogglePlay}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTogglePlay();
                      }}
                      aria-label={activeStory.title}
                      className={`w-48 h-48 sm:w-56 sm:h-56 rounded-3xl border-4 bg-white overflow-hidden shadow-lg flex items-center justify-center cursor-pointer ${
                        isStageActive ? 'border-amber-400 shadow-2xl' : 'border-white'
                      }`}
                    >
                      {!imgError ? (
                        <img
                          src={currentScene.imageUrl}
                          alt={activeStory.title}
                          referrerPolicy="no-referrer"
                          onError={() => setImgError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-8xl">{currentScene.emoji}</span>
                      )}
                    </motion.div>

                    {/* Animated Companion Buddy Badge */}
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        rotate: [-6, 6, -6],
                      }}
                      transition={{
                        duration: 2.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl bg-white border-2 border-amber-300 shadow-md flex items-center justify-center text-3xl select-none"
                    >
                      {currentScene.companionEmoji}
                    </motion.div>

                    {isStageActive && (
                      <motion.div
                        animate={{ scale: [1, 1.18, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -top-3 -left-3 w-11 h-11 rounded-2xl bg-amber-500 text-white shadow-md flex items-center justify-center"
                      >
                        <Volume2 className="w-5 h-5" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Story Narration Text Card */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white/95 backdrop-blur-xs rounded-3xl border-2 border-white p-5 sm:p-7 shadow-xs">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl mb-3">
                      <BookHeart className="w-4 h-4" />
                      <span>অধ্যায় {toBanglaDigits(sceneStep + 1)}</span>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto pr-2">
                      <p className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
                        {currentScene.narration}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {isStageActive
                          ? 'ম্যাম গল্প পড়ে শোনাচ্ছেন...'
                          : 'শুনতে ছবিতে বা প্লে বাটনে ট্যাপ করো'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(sceneStep)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>আবার শোনো</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Moral Education Finale Card */
            <motion.div
              key={`${activeStory.id}-moral`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-50 to-rose-50 p-6 sm:p-9 text-center shadow-sm overflow-hidden"
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, -4, 4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="w-20 h-20 mx-auto rounded-3xl bg-white border-2 border-amber-300 shadow-md flex items-center justify-center mb-4"
              >
                <Star className="w-11 h-11 fill-amber-400 text-amber-500" />
              </motion.div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-amber-500 text-white text-xs sm:text-sm font-bold mb-3">
                <Sparkles className="w-4 h-4" />
                <span>আজকের সুন্দর শিক্ষা · {activeStory.moralLabel}</span>
              </div>

              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 max-w-2xl mx-auto leading-relaxed">
                {activeStory.moralVoice}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReplay}
                  className="min-h-[48px] px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>গল্পটি আবার শোনো</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    handleSelectStory((selectedIndex + 1) % filteredStories.length)
                  }
                  className="min-h-[48px] px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>পরের গল্প শোনো</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Long-Form Story Reading View (when toggled) */}
        {showFullReader && (
          <div className="rounded-3xl border-2 border-emerald-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  সম্পূর্ণ গল্প পাঠ ({toBanglaDigits(activeWordCount)} শব্দ)
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  যেকোনো অধ্যায়ের স্পিকার বাটনে ট্যাপ করলে সেখান থেকে পড়ে শোনাবে
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullReader(false)}
                className="min-h-[38px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                বন্ধ করো
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto pr-2 space-y-4">
              {activeStory.scenes.map((scene, idx) => {
                const isCurrent = !isMoralStep && sceneStep === idx;
                return (
                  <div
                    key={`${activeStory.id}-full-${idx}`}
                    className={`rounded-2xl border-2 p-4 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50/80 border-indigo-300'
                        : 'bg-slate-50/70 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">
                        {scene.emoji} অধ্যায় {toBanglaDigits(idx + 1)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(idx)}
                        className="min-h-[34px] px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>এখান থেকে শোনো</span>
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                      {scene.narration}
                    </p>
                  </div>
                );
              })}
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-bold text-amber-800 mb-1">
                  ⭐ নৈতিক শিক্ষা · {activeStory.moralLabel}
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {activeStory.moralVoice}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scene Step Navigation & Progress Dots */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={sceneStep === 0}
            onClick={() => handleJumpToStep(sceneStep - 1)}
            className="min-h-[44px] px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-800 font-bold text-sm inline-flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>আগের দৃশ্য</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {activeStory.scenes.map((_, idx) => {
              const active = sceneStep === idx;
              const visited = sceneStep > idx;
              return (
                <button
                  key={`${activeStory.id}-dot-${idx}`}
                  type="button"
                  onClick={() => handleJumpToStep(idx)}
                  aria-label={`দৃশ্য ${idx + 1}`}
                  className={`h-9 min-w-[36px] px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer tabular-nums ${
                    active
                      ? 'bg-indigo-600 text-white scale-105 shadow-xs'
                      : visited
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {toBanglaDigits(idx + 1)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleJumpToStep(activeStory.scenes.length)}
              aria-label="নৈতিক শিক্ষা"
              className={`h-9 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer ${
                isMoralStep
                  ? 'bg-amber-500 text-white scale-105 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>শিক্ষা</span>
            </button>
          </div>

          <button
            type="button"
            disabled={sceneStep >= totalSteps - 1}
            onClick={() => handleJumpToStep(sceneStep + 1)}
            className="min-h-[44px] px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-sm inline-flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <span>পরের দৃশ্য</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Story Shelf Selector Grid */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-slate-700">
            গল্পের বইয়ের তাক ({toBanglaDigits(filteredStories.length)}টি গল্প — ট্যাপ করলেই শুরু হবে):
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            প্রতিটি গল্প ১,২০০–১,৫০০ শব্দের
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredStories.map((story, idx) => {
              const isSelected = idx === selectedIndex;
              const isMastered = masteredIds.includes(story.id);
              const words = story.scenes
                .map((s) => s.narration)
                .join(' ')
                .trim()
                .split(/\s+/).length;
              return (
                <motion.button
                  key={story.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectStory(idx)}
                  className={`relative rounded-2xl border-2 p-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-900'
                  }`}
                >
                  <span className="w-12 h-12 rounded-xl bg-white/95 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                    <img
                      src={story.coverImg}
                      alt={story.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold opacity-85 truncate">
                      {toBanglaDigits(idx + 1)}. {story.moralLabel} · {toBanglaDigits(words)} শব্দ
                    </div>
                    <div className="font-bold text-sm leading-tight truncate mt-0.5">
                      {story.title}
                    </div>
                  </div>
                  {isMastered && !isSelected && (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-500 absolute top-2 right-2"
                      aria-label="গল্প শোনা হয়েছে"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
