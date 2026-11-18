import { ANIMAL_STICKERS, AnimalSticker } from '../data/curriculum';

export type SubjectKey = 'bangla' | 'english' | 'numbers' | 'math';

export interface ChildProgress {
  stars: number;
  streak: number;
  masteredIds: string[];
  unlockedStickers: string[];
  subjectCounts: Record<SubjectKey, number>;
  voiceEnabled: boolean;
}

const STORAGE_KEY = 'chotto_bondhu_progress_v1';

export const DEFAULT_PROGRESS: ChildProgress = {
  stars: 0,
  streak: 0,
  masteredIds: [],
  unlockedStickers: ['tiger'],
  subjectCounts: {
    bangla: 0,
    english: 0,
    numbers: 0,
    math: 0,
  },
  voiceEnabled: true,
};

export function loadProgress(): ChildProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ChildProgress>;
    return {
      stars: typeof parsed.stars === 'number' ? parsed.stars : 0,
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      masteredIds: Array.isArray(parsed.masteredIds) ? parsed.masteredIds : [],
      unlockedStickers:
        Array.isArray(parsed.unlockedStickers) && parsed.unlockedStickers.length > 0
          ? parsed.unlockedStickers
          : ['tiger'],
      subjectCounts: {
        bangla: parsed.subjectCounts?.bangla ?? 0,
        english: parsed.subjectCounts?.english ?? 0,
        numbers: parsed.subjectCounts?.numbers ?? 0,
        math: parsed.subjectCounts?.math ?? 0,
      },
      voiceEnabled: parsed.voiceEnabled ?? true,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: ChildProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function applyStarReward(
  prev: ChildProgress,
  subject: SubjectKey,
  itemId?: string,
  starsEarned = 1
): { next: ChildProgress; newlyUnlocked: AnimalSticker | null } {
  const newStars = prev.stars + starsEarned;
  const nextMastered =
    itemId && !prev.masteredIds.includes(itemId)
      ? [...prev.masteredIds, itemId]
      : prev.masteredIds;

  let newlyUnlocked: AnimalSticker | null = null;
  const nextUnlocked = [...prev.unlockedStickers];

  for (const sticker of ANIMAL_STICKERS) {
    if (newStars >= sticker.requiredStars && !nextUnlocked.includes(sticker.id)) {
      nextUnlocked.push(sticker.id);
      if (!newlyUnlocked) {
        newlyUnlocked = sticker;
      }
    }
  }

  const next: ChildProgress = {
    ...prev,
    stars: newStars,
    streak: prev.streak + 1,
    masteredIds: nextMastered,
    unlockedStickers: nextUnlocked,
    subjectCounts: {
      ...prev.subjectCounts,
      [subject]: prev.subjectCounts[subject] + 1,
    },
  };

  saveProgress(next);
  return { next, newlyUnlocked };
}

export function recordExploreItem(
  prev: ChildProgress,
  subject: SubjectKey,
  itemId: string
): ChildProgress {
  const alreadyMastered = prev.masteredIds.includes(itemId);
  const next: ChildProgress = {
    ...prev,
    masteredIds: alreadyMastered ? prev.masteredIds : [...prev.masteredIds, itemId],
    subjectCounts: {
      ...prev.subjectCounts,
      [subject]: prev.subjectCounts[subject] + (alreadyMastered ? 0 : 1),
    },
  };
  saveProgress(next);
  return next;
}

export function resetChildProgress(): ChildProgress {
  saveProgress(DEFAULT_PROGRESS);
  return DEFAULT_PROGRESS;
}
