export interface SpeechMatchResult {
  matched: boolean;
  matchedText: string;
  score: number; // 0..1
}

const BANGLA_ALIASES: Record<string, string[]> = {
  অ: ['অ', 'স্বরে অ', 'সরে অ', 'শরে অ', 'ও', 'অ অ', 'অজগর', 'o', 'aw', 'ojogor', 'ajogor'],
  আ: ['আ', 'স্বরে আ', 'সরে আ', 'শরে আ', 'আ আ', 'আম', 'aa', 'ah', 'aam', 'am'],
  ই: ['ই', 'হ্রস্ব ই', 'রস ই', 'রসই', 'ইঁদুর', 'ইদুর', 'e', 'i', 'ee', 'idur'],
  ঈ: ['ঈ', 'দীর্ঘ ঈ', 'দীর্ঘই', 'দির্ঘই', 'ঈগল', 'ইগল', 'ee', 'eagle', 'igol'],
  উ: ['উ', 'হ্রস্ব উ', 'রস উ', 'রসু', 'উট', 'u', 'oo', 'ut'],
  ঊ: ['ঊ', 'দীর্ঘ ঊ', 'দীর্ঘউ', 'ঊষা', 'উষা', 'oo', 'usha'],
  ঋ: ['ঋ', 'রি', 'ঋষি', 'রিষি', 'ri', 'rishi'],
  এ: ['এ', 'এ এ', 'একতারা', 'e', 'ay', 'ektara'],
  ঐ: ['ঐ', 'ওই', 'অই', 'ঐরাবত', 'oi', 'oirabot'],
  ও: ['ও', 'ও ও', 'ওল', 'o', 'oh', 'ol'],
  ঔ: ['ঔ', 'ওউ', 'অউ', 'ঔষধ', 'ওষুধ', 'ou', 'oshudh'],
  ক: ['ক', 'ক ক', 'কলা', 'ka', 'ko', 'kola'],
  খ: ['খ', 'খ খ', 'খরগোশ', 'খা', 'kha', 'kho', 'khorgosh'],
  গ: ['গ', 'গ গ', 'গরু', 'গা', 'ga', 'go', 'goru'],
  ঘ: ['ঘ', 'ঘ ঘ', 'ঘুড়ি', 'ঘুড়ি', 'gha', 'gho', 'ghuri'],
  ঙ: ['ঙ', 'উঁয়', 'উয়', 'উম', 'ব্যাঙ', 'ব্যাং', 'uno', 'umo', 'byang'],
  চ: ['চ', 'চ চ', 'চশমা', 'চা', 'cha', 'cho', 'choshma'],
  ছ: ['ছ', 'ছ ছ', 'ছাতা', 'ছা', 'chha', 'chho', 'chhata', 'sata'],
  জ: ['জ', 'বর্গীয় জ', 'বর্গিয় জ', 'জাহাজ', 'জা', 'ja', 'jo', 'jahaj'],
  ঝ: ['ঝ', 'ঝ ঝ', 'ঝিনুক', 'ঝা', 'jha', 'jho', 'jhinuk'],
  ঞ: ['ঞ', 'ইঁয়', 'ইয়', 'নিয়', 'মিঞাও', 'মিয়াও', 'miyao', 'niyo'],
  ট: ['ট', 'ট ট', 'টিয়া', 'টিয়া', 'টা', 'ta', 'to', 'tiya'],
  ঠ: ['ঠ', 'ঠ ঠ', 'ঠেলাগাড়ি', 'ঠা', 'tha', 'tho'],
  ড: ['ড', 'ড ড', 'ডাব', 'ডা', 'da', 'do', 'dab'],
  ঢ: ['ঢ', 'ঢ ঢ', 'ঢোল', 'ঢা', 'dha', 'dho', 'dhol'],
  ণ: ['ণ', 'মূর্ধন্য ণ', 'মুদ্ধন্য ণ', 'ন', 'হরিণ', 'হরিণ', 'na', 'no', 'horin'],
  ত: ['ত', 'ত ত', 'তরমুজ', 'তা', 'ta', 'to', 'tormuj'],
  থ: ['থ', 'থ থ', 'থালা', 'থা', 'tha', 'tho', 'thala'],
  দ: ['দ', 'দ দ', 'দোয়েল', 'দা', 'da', 'do', 'doyel'],
  ধ: ['ধ', 'ধ ধ', 'ধান', 'ধা', 'dha', 'dho', 'dhan'],
  ন: ['ন', 'দন্ত্য ন', 'নৌকা', 'না', 'na', 'no', 'nouka'],
  প: ['প', 'প প', 'প্রজাপতি', 'পা', 'pa', 'po', 'projapoti'],
  ফ: ['ফ', 'ফ ফ', 'ফুল', 'ফা', 'fa', 'pha', 'fo', 'phul', 'ful'],
  ব: ['ব', 'ব ব', 'বাঘ', 'বা', 'ba', 'bo', 'bagh'],
  ভ: ['ভ', 'ভ ভ', 'ভালুক', 'ভাল্লুক', 'ভা', 'bha', 'bho', 'bhaluk'],
  ম: ['ম', 'ম ম', 'ময়ূর', 'ময়ূর', 'মা', 'ma', 'mo', 'moyur'],
  য: ['য', 'অন্তঃস্থ য', 'অন্তস্থ জ', 'যাঁতা', 'জাতা', 'ja', 'za', 'janta'],
  র: ['র', 'বয় শূন্য র', 'বয় শূন্য র', 'রংধনু', 'রা', 'ra', 'ro', 'rongdhonu'],
  ল: ['ল', 'ল ল', 'লাটিম', 'লা', 'la', 'lo', 'latim'],
  শ: ['শ', 'তালব্য শ', 'তালব্য স', 'শা', 'শাপলা', 'sha', 'sho', 'shapla'],
  ষ: ['ষ', 'মূর্ধন্য ষ', 'মুদ্ধন্য ষ', 'মূর্ধন্য শ', 'ষাঁড়', 'ষাঁড়', 'ষাড়', 'sha', 'shar'],
  স: ['স', 'দন্ত্য স', 'দন্ত্য শ', 'সা', 'সিংহ', 'sa', 'so', 'singho'],
  হ: ['হ', 'হ হ', 'হাতি', 'হা', 'ha', 'ho', 'hati'],
  ড়: ['ড়', 'ড়', 'ডয় শূন্য ড়', 'ডয় শূন্য ড়', 'ঘড়ি', 'ঘড়ি', 'ra', 'ghori'],
  ঢ়: ['ঢ়', 'ঢ়', 'ঢয় শূন্য ঢ়', 'আষাঢ়', 'আষাঢ়', 'asharh'],
  য়: ['য়', 'য়', 'অন্তঃস্থ য়', 'ময়না', 'ময়না', 'ya', 'moyna'],
  ৎ: ['ৎ', 'খণ্ড ত', 'খন্ড ত', 'উৎসব', 'utsob'],
  'ং': ['ং', 'অনুস্বার', 'অনুস্বর', 'চিংড়ি', 'চিংড়ি', 'chingri'],
  'ঃ': ['ঃ', 'বিসর্গ', 'দুঃখ', 'bisorgo'],
  'ঁ': ['ঁ', 'চন্দ্রবিন্দু', 'চাঁদ', 'চাদ', 'chand', 'chondrobindu'],
};

const ENGLISH_ALIASES: Record<string, string[]> = {
  A: ['a', 'ay', 'eh', 'ah', 'hey', 'apple', 'এ', 'অ্যা', 'অ্যাপল', 'আপেল'],
  B: ['b', 'be', 'bee', 'buh', 'ball', 'বি', 'বল'],
  C: ['c', 'see', 'sea', 'kuh', 'cat', 'সি', 'ক্যাট'],
  D: ['d', 'dee', 'duh', 'dog', 'ডি', 'ডগ'],
  E: ['e', 'ee', 'eh', 'elephant', 'ই', 'এলিফ্যান্ট'],
  F: ['f', 'ef', 'fff', 'fish', 'এফ', 'ফিশ'],
  G: ['g', 'jee', 'guh', 'grapes', 'grape', 'জি', 'গ্রেপস'],
  H: ['h', 'aitch', 'huh', 'hat', 'এইচ', 'হ্যাট'],
  I: ['i', 'eye', 'ih', 'igloo', 'আই', 'ইগলু'],
  J: ['j', 'jay', 'juh', 'juice', 'জে', 'জুস'],
  K: ['k', 'kay', 'kuh', 'kite', 'কে', 'কাইট'],
  L: ['l', 'el', 'lll', 'lion', 'এল', 'লায়ন'],
  M: ['m', 'em', 'mmm', 'moon', 'এম', 'মুন'],
  N: ['n', 'en', 'nnn', 'nest', 'এন', 'নেস্ট'],
  O: ['o', 'oh', 'aw', 'orange', 'ও', 'অরেঞ্জ'],
  P: ['p', 'pee', 'puh', 'parrot', 'পি', 'প্যারট'],
  Q: ['q', 'cue', 'queue', 'kwuh', 'queen', 'কিউ', 'কুইন'],
  R: ['r', 'are', 'rrr', 'rabbit', 'আর', 'র‍্যাবিট'],
  S: ['s', 'ess', 'sss', 'sun', 'এস', 'সান'],
  T: ['t', 'tee', 'tuh', 'tiger', 'টি', 'টাইগার'],
  U: ['u', 'you', 'uh', 'umbrella', 'ইউ', 'আমব্রেলা'],
  V: ['v', 'vee', 'vvv', 'van', 'ভি', 'ভ্যান'],
  W: ['w', 'double u', 'wuh', 'whale', 'ডাব্লিউ', 'হোয়েল'],
  X: ['x', 'ex', 'ks', 'xylophone', 'এক্স', 'জাইলোফোন'],
  Y: ['y', 'why', 'yuh', 'yo-yo', 'yoyo', 'ওয়াই', 'ইয়ো ইয়ো'],
  Z: ['z', 'zee', 'zed', 'zzz', 'zebra', 'জেড', 'জি', 'জেব্রা'],
};

function normalizeSpeechToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFC')
    .replace(/[।.,!?;:'"()[\]{}\-–—/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export function evaluateSpeechMatch(
  transcriptCandidates: string[],
  targetSymbol: string,
  targetWord: string,
  lang: 'bn' | 'en'
): SpeechMatchResult {
  const cleanedCandidates = transcriptCandidates
    .map((c) => normalizeSpeechToken(c))
    .filter(Boolean);

  if (cleanedCandidates.length === 0) {
    return { matched: false, matchedText: '', score: 0 };
  }

  const upperSym = targetSymbol.trim().toUpperCase();
  const normSym = normalizeSpeechToken(targetSymbol);
  const normWord = normalizeSpeechToken(targetWord);

  const aliases = new Set<string>([normSym, normWord]);
  const extraAliases =
    lang === 'bn'
      ? BANGLA_ALIASES[targetSymbol.trim()] ?? []
      : ENGLISH_ALIASES[upperSym] ?? [];
  for (const al of extraAliases) {
    const cleanAl = normalizeSpeechToken(al);
    if (cleanAl) aliases.add(cleanAl);
  }

  let bestScore = 0;
  let bestText = cleanedCandidates[0];

  for (const cand of cleanedCandidates) {
    const words = cand.split(' ');

    for (const target of aliases) {
      if (!target) continue;
      // Direct or whole-word match
      if (cand === target || words.includes(target)) {
        return { matched: true, matchedText: cand, score: 1 };
      }

      // Phrase contains target word cleanly (for multi-char targets like "apple" or "অজগর")
      if (target.length >= 2 && cand.includes(target)) {
        return { matched: true, matchedText: cand, score: 0.95 };
      }

      // Fuzzy similarity check for toddler articulation on words >= 3 chars
      for (const w of [cand, ...words]) {
        if (target.length >= 3 && w.length >= 2) {
          const dist = levenshtein(w, target);
          const maxLen = Math.max(w.length, target.length);
          const sim = 1 - dist / maxLen;
          if (sim > bestScore) {
            bestScore = sim;
            bestText = cand;
          }
          if ((target.length <= 4 && dist <= 1) || (target.length >= 5 && dist <= 2) || sim >= 0.68) {
            return { matched: true, matchedText: cand, score: sim };
          }
        }
      }
    }
  }

  return { matched: false, matchedText: bestText, score: bestScore };
}
