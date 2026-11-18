

export type CurriculumCategory =
  | 'bangla-vowel'
  | 'bangla-consonant'
  | 'english'
  | 'math-number';

export interface CurriculumItem {
  id: string;
  symbol: string;
  secondarySymbol?: string; // lowercase for English, bangla digit for numbers
  romanNumeral?: string;
  word: string;
  wordMeaningBn?: string;
  phoneticCue: string;
  spokenText: string;
  lang: 'bn' | 'en';
  emoji: string;
  imageUrl?: string;
  accentBg: string;
  accentBorder: string;
  category: CurriculumCategory;
}

export interface NumberItem {
  value: number;
  banglaDigit: string;
  roman: string;
  banglaWord: string;
  englishWord: string;
  spokenText: string;
}

export interface AnimalSticker {
  id: string;
  nameBn: string;
  nameEn: string;
  emoji: string;
  requiredStars: number;
  soundText: string;
  colorClass: string;
  bgClass: string;
}

export interface RhymeLine {
  text: string;
  pronunciationBn: string;
}

export interface RhymeItem {
  id: string;
  title: string;
  subtitle: string;
  lang: 'bn' | 'en';
  emoji: string;
  imageUrl: string;
  accentBg: string;
  accentBorder: string;
  lines: RhymeLine[];
}

export const IMAGE_ASSETS = {
  tigerMascot: '/src/assets/images/mascot_tiger_cub_1794897029059.jpg',
  elephantMath: '/src/assets/images/buddy_elephant_math_1794897028646.jpg',
  parrotPhonics: '/src/assets/images/buddy_parrot_phonics_1794897029082.jpg',
  safariBanner: '/src/assets/images/safari_playground_banner_1794897029613.jpg',
  stickerFriends: '/src/assets/images/sticker_animal_friends_1794897029678.jpg',
} as const;

const CARD_PALETTES = [
  { accentBg: 'bg-amber-50', accentBorder: 'border-amber-200' },
  { accentBg: 'bg-emerald-50', accentBorder: 'border-emerald-200' },
  { accentBg: 'bg-sky-50', accentBorder: 'border-sky-200' },
  { accentBg: 'bg-rose-50', accentBorder: 'border-rose-200' },
  { accentBg: 'bg-teal-50', accentBorder: 'border-teal-200' },
  { accentBg: 'bg-orange-50', accentBorder: 'border-orange-200' },
];

function paletteAt(index: number) {
  return CARD_PALETTES[index % CARD_PALETTES.length];
}

export const BANGLA_VOWELS: CurriculumItem[] = [
  { symbol: 'অ', word: 'অজগর', phoneticCue: 'স্বরে অ — অ-জ-গ-র', emoji: '🐍', imageUrl: '/images/objects/python.jpg', spokenText: 'অ! অ-তে অজগর আসে তেড়ে।' },
  { symbol: 'আ', word: 'আম', phoneticCue: 'স্বরে আ — আ-ম', emoji: '🥭', imageUrl: '/images/objects/mango.jpg', spokenText: 'আ! আ-তে আমটি আমি খাব পেড়ে।' },
  { symbol: 'ই', word: 'ইঁদুর', phoneticCue: 'হ্রস্ব ই — ইঁ-দু-র', emoji: '🐭', imageUrl: '/images/objects/mouse.jpg', spokenText: 'ই! ই-তে ইঁদুর ছানা ভয়ে মরে।' },
  { symbol: 'ঈ', word: 'ঈগল', phoneticCue: 'দীর্ঘ ঈ — ঈ-গ-ল', emoji: '🦅', imageUrl: '/images/objects/eagle.jpg', spokenText: 'ঈ! ঈ-তে ঈগল পাখি শিকার ধরে।' },
  { symbol: 'উ', word: 'উট', phoneticCue: 'হ্রস্ব উ — উ-ট', emoji: '🐪', imageUrl: '/images/objects/camel.jpg', spokenText: 'উ! উ-তে উট চলেছে মরুর দেশে।' },
  { symbol: 'ঊ', word: 'ঊষা', phoneticCue: 'দীর্ঘ ঊ — ভোরের আলো', emoji: '🌅', imageUrl: '/images/objects/sunrise.jpg', spokenText: 'ঊ! ঊ-তে ঊষা হাসে পুব আকাশে।' },
  { symbol: 'ঋ', word: 'ঋষি', phoneticCue: 'ঋ — ঋ-ষি', emoji: '🧘', imageUrl: '/images/objects/sage.jpg', spokenText: 'ঋ! ঋ-তে ঋষি মশাই বসেন ধ্যানে।' },
  { symbol: 'এ', word: 'একতারা', phoneticCue: 'এ — এ-ক-তা-রা', emoji: '🎸', imageUrl: '/images/objects/ektara.jpg', spokenText: 'এ! এ-তে একতারাটি বাজে গানে।' },
  { symbol: 'ঐ', word: 'ঐরাবত', phoneticCue: 'ঐ — হাতি বা ঐরাবত', emoji: '🐘', imageUrl: '/images/objects/elephant.jpg', spokenText: 'ঐ! ঐ-তে ঐরাবত ওই হেঁটে যায়।' },
  { symbol: 'ও', word: 'ওল', phoneticCue: 'ও — ও-ল-ক-চু', emoji: '🥔', imageUrl: '/images/objects/taro.jpg', spokenText: 'ও! ও-তে ওল খেও না ধরবে গলা।' },
  { symbol: 'ঔ', word: 'ঔষধ', phoneticCue: 'ঔ — ঔ-ষ-ধ', emoji: '💊', imageUrl: '/images/objects/medicine.jpg', spokenText: 'ঔ! ঔ-তে ঔষধ খেতে মিছে বলা।' },
].map((item, idx) => ({
  id: `bn-v-${idx}`,
  ...item,
  lang: 'bn' as const,
  category: 'bangla-vowel' as const,
  ...paletteAt(idx),
}));

export const BANGLA_CONSONANTS: CurriculumItem[] = [
  { symbol: 'ক', word: 'কলা', phoneticCue: 'ক — ক-লা', emoji: '🍌', imageUrl: '/images/objects/banana.jpg', spokenText: 'ক! ক-তে কলা খায় হনুমান।' },
  { symbol: 'খ', word: 'খরগোশ', phoneticCue: 'খ — খ-র-গো-শ', emoji: '🐰', imageUrl: '/images/objects/rabbit.jpg', spokenText: 'খ! খ-তে খরগোশ ছানা লাফায় বেশ।' },
  { symbol: 'গ', word: 'গরু', phoneticCue: 'গ — গ-রু', emoji: '🐄', imageUrl: '/images/objects/cow.jpg', spokenText: 'গ! গ-তে গরু আমাদের দুধ দেয়।' },
  { symbol: 'ঘ', word: 'ঘুড়ি', phoneticCue: 'ঘ — ঘু-ড়ি', emoji: '🪁', imageUrl: '/images/objects/kite.jpg', spokenText: 'ঘ! ঘ-তে ঘুড়ি ওড়ে নীল আকাশে।' },
  { symbol: 'ঙ', word: 'ব্যাঙ', phoneticCue: 'উঁয় (ঙ) — ব্যা-ঙ', emoji: '🐸', imageUrl: '/images/objects/frog.jpg', spokenText: 'উঁয়! ঙ-তে ব্যাঙ ডাকে ঘ্যাঙর ঘ্যাঙ।' },
  { symbol: 'চ', word: 'চশমা', phoneticCue: 'চ — চ-শ-মা', emoji: '👓', imageUrl: '/images/objects/glasses.jpg', spokenText: 'চ! চ-তে চশমা পরে দাদুভাই।' },
  { symbol: 'ছ', word: 'ছাতা', phoneticCue: 'ছ — ছা-তা', emoji: '☂️', imageUrl: '/images/objects/umbrella.jpg', spokenText: 'ছ! ছ-তে ছাতা মাথায় বৃষ্টি এড়াই।' },
  { symbol: 'জ', word: 'জাহাজ', phoneticCue: 'বর্গীয় জ — জা-হা-জ', emoji: '🚢', imageUrl: '/images/objects/ship.jpg', spokenText: 'বর্গীয় জ! জ-তে জাহাজ ভাসে সাগর জলে।' },
  { symbol: 'ঝ', word: 'ঝিনুক', phoneticCue: 'ঝ — ঝি-নু-ক', emoji: '🐚', imageUrl: '/images/objects/seashell.jpg', spokenText: 'ঝ! ঝ-তে ঝিনুক মেলে নদীর তীরে।' },
  { symbol: 'ঞ', word: 'মিঞাও', phoneticCue: 'ইঁয় (ঞ) — বিড়াল ডাকে মিঞাও', emoji: '🐱', imageUrl: '/images/objects/cat.jpg', spokenText: 'ইঁয়! ঞ-তে বিড়াল ডাকে মিঞাও মিঞাও।' },
  { symbol: 'ট', word: 'টিয়া', phoneticCue: 'ট — টি-য়া পাখি', emoji: '🦜', imageUrl: '/images/objects/parrot.jpg', spokenText: 'ট! ট-তে টিয়া পাখির ঠোঁটটি লাল।' },
  { symbol: 'ঠ', word: 'ঠেলাগাড়ি', phoneticCue: 'ঠ — ঠেলা-গাড়ি', emoji: '🛒', imageUrl: '/images/objects/cart.jpg', spokenText: 'ঠ! ঠ-তে ঠেলাগাড়ি চলে পথে।' },
  { symbol: 'ড', word: 'ডাব', phoneticCue: 'ড — ডাব', emoji: '🥥', imageUrl: '/images/objects/coconut.jpg', spokenText: 'ড! ড-তে ডাবের পানি মিষ্টি ভারী।' },
  { symbol: 'ঢ', word: 'ঢোল', phoneticCue: 'ঢ — ঢোল', emoji: '🥁', imageUrl: '/images/objects/drum.jpg', spokenText: 'ঢ! ঢ-তে ঢোল বাজে ধুম ধাড়াক্কা।' },
  { symbol: 'ণ', word: 'হরিণ', phoneticCue: 'মূর্ধন্য ণ — হ-রি-ণ', emoji: '🦌', imageUrl: '/images/objects/deer.jpg', spokenText: 'মূর্ধন্য ণ! মূর্ধন্য ণ-তে হরিণ ছানা বনে থাকে।' },
  { symbol: 'ত', word: 'তরমুজ', phoneticCue: 'ত — ত-র-মু-জ', emoji: '🍉', imageUrl: '/images/objects/watermelon.jpg', spokenText: 'ত! ত-তে তরমুজ খেতে ভারী মজা।' },
  { symbol: 'থ', word: 'থালা', phoneticCue: 'থ — থা-লা', emoji: '🍽️', imageUrl: '/images/objects/plate.jpg', spokenText: 'থ! থ-তে থালা ভরা গরম ভাত।' },
  { symbol: 'দ', word: 'দোয়েল', phoneticCue: 'দ — দো-য়ে-ল পাখি', emoji: '🐦', imageUrl: '/images/objects/magpie.jpg', spokenText: 'দ! দ-তে দোয়েল আমাদের জাতীয় পাখি।' },
  { symbol: 'ধ', word: 'ধান', phoneticCue: 'ধ — ধা-ন', emoji: '🌾', imageUrl: '/images/objects/rice.jpg', spokenText: 'ধ! ধ-তে ধান ফলে সোনার মাঠে।' },
  { symbol: 'ন', word: 'নৌকা', phoneticCue: 'দন্ত্য ন — নৌ-কা', emoji: '⛵', imageUrl: '/images/objects/boat.jpg', spokenText: 'দন্ত্য ন! দন্ত্য ন-তে নৌকা চলে পাল তুলে।' },
  { symbol: 'প', word: 'প্রজাপতি', phoneticCue: 'প — প্র-জা-প-তি', emoji: '🦋', imageUrl: '/images/objects/butterfly.jpg', spokenText: 'প! প-তে প্রজাপতি নাচে ফুলে ফুলে।' },
  { symbol: 'ফ', word: 'ফুল', phoneticCue: 'ফ — ফু-ল', emoji: '🌸', imageUrl: '/images/objects/flower.jpg', spokenText: 'ফ! ফ-তে ফুল ফুটেছে বাগান জুড়ে।' },
  { symbol: 'ব', word: 'বাঘ', phoneticCue: 'ব — বা-ঘ', emoji: '🐯', imageUrl: '/images/objects/tiger.jpg', spokenText: 'ব! ব-তে বাঘ মামা গর্জন করে।' },
  { symbol: 'ভ', word: 'ভালুক', phoneticCue: 'ভ — ভা-লু-ক', emoji: '🐻', imageUrl: '/images/objects/bear.jpg', spokenText: 'ভ! ভ-তে ভালুক ভালোবাসে মধু খেতে।' },
  { symbol: 'ম', word: 'ময়ূর', phoneticCue: 'ম — ম-য়ূ-র', emoji: '🦚', imageUrl: '/images/objects/peacock.jpg', spokenText: 'ম! ম-তে ময়ূর নাচে পেখম মেলে।' },
  { symbol: 'য', word: 'যাঁতা', phoneticCue: 'অন্তঃস্থ য — যাঁ-তা', emoji: '⚙️', imageUrl: '/images/objects/millstone.jpg', spokenText: 'অন্তঃস্থ য! অন্তঃস্থ য-তে যাঁতা ঘোরে ধীরে ধীরে।' },
  { symbol: 'র', word: 'রংধনু', phoneticCue: 'বয় শূন্য র — র-ং-ধ-নু', emoji: '🌈', imageUrl: '/images/objects/rainbow.jpg', spokenText: 'বয় শূন্য র! র-তে রংধনু ওঠে আকাশ জুড়ে।' },
  { symbol: 'ল', word: 'লাটিম', phoneticCue: 'ল — লা-টি-ম', emoji: '🪀', imageUrl: '/images/objects/spinning_top.jpg', spokenText: 'ল! ল-তে লাটিম ঘোরে বন বন করে।' },
  { symbol: 'শ', word: 'শাপলা', phoneticCue: 'তালব্য শ — শা-প-লা', emoji: '🪷', imageUrl: '/images/objects/water_lily.jpg', spokenText: 'তালব্য শ! তালব্য শ-তে শাপলা ফোটে বিলের জলে।' },
  { symbol: 'ষ', word: 'ষাঁড়', phoneticCue: 'মূর্ধন্য ষ — ষাঁ-ড়', emoji: '🐂', imageUrl: '/images/objects/bull.jpg', spokenText: 'মূর্ধন্য ষ! মূর্ধন্য ষ-তে ষাঁড় চলেছে মাঠের পানে।' },
  { symbol: 'স', word: 'সিংহ', phoneticCue: 'দন্ত্য স — সিং-হ', emoji: '🦁', imageUrl: '/images/objects/lion.jpg', spokenText: 'দন্ত্য স! দন্ত্য স-তে সিংহ বনের রাজা হয়।' },
  { symbol: 'হ', word: 'হাতি', phoneticCue: 'হ — হা-তি', emoji: '🐘', imageUrl: '/images/objects/elephant.jpg', spokenText: 'হ! হ-তে হাতি চলে হেলে দুলে।' },
  { symbol: 'ড়', word: 'ঘড়ি', phoneticCue: 'ডয় শূন্য ড় — ঘ-ড়ি', emoji: '⏰', imageUrl: '/images/objects/clock.jpg', spokenText: 'ডয় শূন্য ড়! ড়-তে ঘড়ি চলে টিক টিক করে।' },
  { symbol: 'ঢ়', word: 'আষাঢ়', phoneticCue: 'ঢয় শূন্য ঢ় — আ-ষা-ঢ়', emoji: '🌧️', imageUrl: '/images/objects/rain.jpg', spokenText: 'ঢয় শূন্য ঢ়! ঢ়-তে আষাঢ় মাসে বৃষ্টি ঝরে।' },
  { symbol: 'য়', word: 'ময়না', phoneticCue: 'অন্তঃস্থ য় — ম-য়-না', emoji: '🐦‍⬛', imageUrl: '/images/objects/myna.jpg', spokenText: 'অন্তঃস্থ য়! অন্তঃস্থ য়-তে ময়না পাখি কথা কয়।' },
  { symbol: 'ৎ', word: 'উৎসব', phoneticCue: 'খণ্ড ত (ৎ) — উ-ৎ-স-ব', emoji: '🎉', imageUrl: '/images/objects/festival.jpg', spokenText: 'খণ্ড ত! খণ্ড ত-তে উৎসব আসে খুশি নিয়ে।' },
  { symbol: 'ং', word: 'চিংড়ি', phoneticCue: 'অনুস্বার (ং) — চিং-ড়ি', emoji: '🦐', imageUrl: '/images/objects/shrimp.jpg', spokenText: 'অনুস্বার! অনুস্বারে চিংড়ি মাছ জলে থাকে।' },
  { symbol: 'ঃ', word: 'দুঃখ', phoneticCue: 'বিসর্গ (ঃ) — দুঃ-খ', emoji: '🤗', imageUrl: '/images/objects/smile.jpg', spokenText: 'বিসর্গ! এটি বিসর্গ, হাসিখুশি থাকো সবাই।' },
  { symbol: 'ঁ', word: 'চাঁদ', phoneticCue: 'চন্দ্রবিন্দু (ঁ) — চাঁ-দ', emoji: '🌙', imageUrl: '/images/objects/moon.jpg', spokenText: 'চন্দ্রবিন্দু! চন্দ্রবিন্দুতে চাঁদ মামা হাসে রাতে।' },
].map((item, idx) => ({
  id: `bn-c-${idx}`,
  ...item,
  lang: 'bn' as const,
  category: 'bangla-consonant' as const,
  ...paletteAt(idx),
}));

export const ENGLISH_PHONICS: CurriculumItem[] = [
  { symbol: 'A', secondarySymbol: 'a', word: 'Apple', wordMeaningBn: 'আপেল', phoneticCue: 'A says /æ/ · অ্যা (A-a-Apple)', emoji: '🍎', imageUrl: '/images/objects/apple.jpg', spokenText: 'A! A says ah, ah, ah! A is for Apple.' },
  { symbol: 'B', secondarySymbol: 'b', word: 'Ball', wordMeaningBn: 'বল', phoneticCue: 'B says /b/ · ব (B-b-Ball)', emoji: '⚽', imageUrl: '/images/objects/ball.jpg', spokenText: 'B! B says buh, buh, buh! B is for Ball.' },
  { symbol: 'C', secondarySymbol: 'c', word: 'Cat', wordMeaningBn: 'বিড়াল', phoneticCue: 'C says /k/ · ক (C-c-Cat)', emoji: '🐱', imageUrl: '/images/objects/cat.jpg', spokenText: 'C! C says kuh, kuh, kuh! C is for Cat.' },
  { symbol: 'D', secondarySymbol: 'd', word: 'Dog', wordMeaningBn: 'কুকুর', phoneticCue: 'D says /d/ · ড (D-d-Dog)', emoji: '🐶', imageUrl: '/images/objects/dog.jpg', spokenText: 'D! D says duh, duh, duh! D is for Dog.' },
  { symbol: 'E', secondarySymbol: 'e', word: 'Elephant', wordMeaningBn: 'হাতি', phoneticCue: 'E says /ɛ/ · এ (E-e-Elephant)', emoji: '🐘', imageUrl: '/images/objects/elephant.jpg', spokenText: 'E! E says eh, eh, eh! E is for Elephant.' },
  { symbol: 'F', secondarySymbol: 'f', word: 'Fish', wordMeaningBn: 'মাছ', phoneticCue: 'F says /f/ · ফ (F-f-Fish)', emoji: '🐟', imageUrl: '/images/objects/fish.jpg', spokenText: 'F! F says fff, fff, fff! F is for Fish.' },
  { symbol: 'G', secondarySymbol: 'g', word: 'Grapes', wordMeaningBn: 'আঙুর', phoneticCue: 'G says /g/ · গ (G-g-Grapes)', emoji: '🍇', imageUrl: '/images/objects/grapes.jpg', spokenText: 'G! G says guh, guh, guh! G is for Grapes.' },
  { symbol: 'H', secondarySymbol: 'h', word: 'Hat', wordMeaningBn: 'টুপি', phoneticCue: 'H says /h/ · হ (H-h-Hat)', emoji: '👒', imageUrl: '/images/objects/hat.jpg', spokenText: 'H! H says huh, huh, huh! H is for Hat.' },
  { symbol: 'I', secondarySymbol: 'i', word: 'Igloo', wordMeaningBn: 'বরফের ঘর', phoneticCue: 'I says /ɪ/ · ই (I-i-Igloo)', emoji: '🧊', imageUrl: '/images/objects/igloo.jpg', spokenText: 'I! I says ih, ih, ih! I is for Igloo.' },
  { symbol: 'J', secondarySymbol: 'j', word: 'Juice', wordMeaningBn: 'জুস', phoneticCue: 'J says /dʒ/ · জ (J-j-Juice)', emoji: '🧃', imageUrl: '/images/objects/juice.jpg', spokenText: 'J! J says juh, juh, juh! J is for Juice.' },
  { symbol: 'K', secondarySymbol: 'k', word: 'Kite', wordMeaningBn: 'ঘুড়ি', phoneticCue: 'K says /k/ · ক (K-k-Kite)', emoji: '🪁', imageUrl: '/images/objects/kite.jpg', spokenText: 'K! K says kuh, kuh, kuh! K is for Kite.' },
  { symbol: 'L', secondarySymbol: 'l', word: 'Lion', wordMeaningBn: 'সিংহ', phoneticCue: 'L says /l/ · ল (L-l-Lion)', emoji: '🦁', imageUrl: '/images/objects/lion.jpg', spokenText: 'L! L says lll, lll, lll! L is for Lion.' },
  { symbol: 'M', secondarySymbol: 'm', word: 'Mango', wordMeaningBn: 'আম', phoneticCue: 'M says /m/ · ম (M-m-Mango)', emoji: '🥭', imageUrl: '/images/objects/mango.jpg', spokenText: 'M! M says mmm, mmm, mmm! M is for Mango.' },
  { symbol: 'N', secondarySymbol: 'n', word: 'Nest', wordMeaningBn: 'পাখির বাসা', phoneticCue: 'N says /n/ · ন (N-n-Nest)', emoji: '🪺', imageUrl: '/images/objects/nest.jpg', spokenText: 'N! N says nnn, nnn, nnn! N is for Nest.' },
  { symbol: 'O', secondarySymbol: 'o', word: 'Orange', wordMeaningBn: 'কমলা', phoneticCue: 'O says /ɒ/ · অ (O-o-Orange)', emoji: '🍊', imageUrl: '/images/objects/orange.jpg', spokenText: 'O! O says oh, oh, oh! O is for Orange.' },
  { symbol: 'P', secondarySymbol: 'p', word: 'Parrot', wordMeaningBn: 'টিয়া পাখি', phoneticCue: 'P says /p/ · প (P-p-Parrot)', emoji: '🦜', imageUrl: '/images/objects/parrot.jpg', spokenText: 'P! P says puh, puh, puh! P is for Parrot.' },
  { symbol: 'Q', secondarySymbol: 'q', word: 'Queen', wordMeaningBn: 'রানী', phoneticCue: 'Q says /kw/ · কুয় (Q-q-Queen)', emoji: '👑', imageUrl: '/images/objects/queen.jpg', spokenText: 'Q! Q says kwuh, kwuh, kwuh! Q is for Queen.' },
  { symbol: 'R', secondarySymbol: 'r', word: 'Rabbit', wordMeaningBn: 'খরগোশ', phoneticCue: 'R says /r/ · র (R-r-Rabbit)', emoji: '🐰', imageUrl: '/images/objects/rabbit.jpg', spokenText: 'R! R says rrr, rrr, rrr! R is for Rabbit.' },
  { symbol: 'S', secondarySymbol: 's', word: 'Sun', wordMeaningBn: 'সূর্য', phoneticCue: 'S says /s/ · স (S-s-Sun)', emoji: '☀️', imageUrl: '/images/objects/sun.jpg', spokenText: 'S! S says sss, sss, sss! S is for Sun.' },
  { symbol: 'T', secondarySymbol: 't', word: 'Tiger', wordMeaningBn: 'বাঘ', phoneticCue: 'T says /t/ · ট (T-t-Tiger)', emoji: '🐯', imageUrl: '/images/objects/tiger.jpg', spokenText: 'T! T says tuh, tuh, tuh! T is for Tiger.' },
  { symbol: 'U', secondarySymbol: 'u', word: 'Umbrella', wordMeaningBn: 'ছাতা', phoneticCue: 'U says /ʌ/ · আ (U-u-Umbrella)', emoji: '☂️', imageUrl: '/images/objects/umbrella.jpg', spokenText: 'U! U says uh, uh, uh! U is for Umbrella.' },
  { symbol: 'V', secondarySymbol: 'v', word: 'Van', wordMeaningBn: 'গাড়ি', phoneticCue: 'V says /v/ · ভ (V-v-Van)', emoji: '🚐', imageUrl: '/images/objects/van.jpg', spokenText: 'V! V says vvv, vvv, vvv! V is for Van.' },
  { symbol: 'W', secondarySymbol: 'w', word: 'Whale', wordMeaningBn: 'তিমি মাছ', phoneticCue: 'W says /w/ · ওয়া (W-w-Whale)', emoji: '🐋', imageUrl: '/images/objects/whale.jpg', spokenText: 'W! W says wuh, wuh, wuh! W is for Whale.' },
  { symbol: 'X', secondarySymbol: 'x', word: 'Xylophone', wordMeaningBn: 'জাইলোফোন', phoneticCue: 'X says /ks/ · জ / ক্স', emoji: '🎶', imageUrl: '/images/objects/xylophone.png', spokenText: 'X! X says ks, ks! X is for Xylophone.' },
  { symbol: 'Y', secondarySymbol: 'y', word: 'Yo-yo', wordMeaningBn: 'ইয়ো-ইয়ো', phoneticCue: 'Y says /j/ · ইয় (Y-y-Yoyo)', emoji: '🪀', imageUrl: '/images/objects/yoyo.jpg', spokenText: 'Y! Y says yuh, yuh, yuh! Y is for Yo-yo.' },
  { symbol: 'Z', secondarySymbol: 'z', word: 'Zebra', wordMeaningBn: 'জেব্রা', phoneticCue: 'Z says /z/ · জ় (Z-z-Zebra)', emoji: '🦓', imageUrl: '/images/objects/zebra.jpg', spokenText: 'Z! Z says zzz, zzz, zzz! Z is for Zebra.' },
].map((item, idx) => ({
  id: `en-${idx}`,
  ...item,
  lang: 'en' as const,
  category: 'english' as const,
  ...paletteAt(idx),
}));

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(num: number): string {
  return String(num)
    .split('')
    .map((ch) => {
      const idx = Number(ch);
      return Number.isNaN(idx) ? ch : BN_DIGITS[idx];
    })
    .join('');
}

export function toRomanNumeral(num: number): string {
  const map: [number, string][] = [
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let n = num;
  let result = '';
  for (const [val, sym] of map) {
    while (n >= val) {
      result += sym;
      n -= val;
    }
  }
  return result;
}

const BANGLA_1_TO_100_WORDS: string[] = [
  'শূন্য',
  'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
  'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
  'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ', 'ত্রিশ',
  'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
  'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
  'একান্ন', 'বাহান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
  'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
  'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
  'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই', 'নব্বই',
  'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই', 'একশো',
];

const EN_ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function toEnglishNumberWord(num: number): string {
  if (num === 100) return 'One Hundred';
  if (num < 20) return EN_ONES[num];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return o === 0 ? EN_TENS[t] : `${EN_TENS[t]}-${EN_ONES[o]}`;
}

export const NUMBERS_1_TO_100: NumberItem[] = Array.from({ length: 100 }, (_, i) => {
  const value = i + 1;
  const banglaDigit = toBanglaDigits(value);
  const roman = toRomanNumeral(value);
  const banglaWord = BANGLA_1_TO_100_WORDS[value];
  const englishWord = toEnglishNumberWord(value);
  return {
    value,
    banglaDigit,
    roman,
    banglaWord,
    englishWord,
    spokenText: `${banglaWord}! ইংরেজিতে ${englishWord}, রোমান সংখ্যায় ${roman}`,
  };
});

export const ANIMAL_STICKERS: AnimalSticker[] = [
  {
    id: 'tiger',
    nameBn: 'টুকু বাঘ',
    nameEn: 'Tuku Tiger',
    emoji: '🐯',
    requiredStars: 0,
    soundText: 'হালুম! আমি টুকু বাঘ, তোমার খেলার বন্ধু!',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'parrot',
    nameBn: 'টিয়া পাখি',
    nameEn: 'Tiya Parrot',
    emoji: '🦜',
    requiredStars: 2,
    soundText: 'টুক টুক! আমি টিয়া পাখি, চলো একসাথে গান গাই!',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'elephant',
    nameBn: 'হাতু হাতি',
    nameEn: 'Hatu Elephant',
    emoji: '🐘',
    requiredStars: 5,
    soundText: 'পোঁও! আমি হাতু হাতি, আমি আপেল গুনতে ভালোবাসি!',
    colorClass: 'text-sky-700',
    bgClass: 'bg-sky-50 border-sky-200',
  },
  {
    id: 'rabbit',
    nameBn: 'খরগোশ ছানা',
    nameEn: 'Bubu Rabbit',
    emoji: '🐰',
    requiredStars: 8,
    soundText: 'টুপ টুপ লাফ! আমি খরগোশ ছানা, গাজর খাই!',
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
  },
  {
    id: 'panda',
    nameBn: 'পান্ডা বন্ধু',
    nameEn: 'Piku Panda',
    emoji: '🐼',
    requiredStars: 12,
    soundText: 'বাহ! তুমি অনেক তারা জিতেছ, আমি তোমার পান্ডা বন্ধু!',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50 border-slate-200',
  },
  {
    id: 'lion',
    nameBn: 'সিংহ রাজা',
    nameEn: 'Leo Lion',
    emoji: '🦁',
    requiredStars: 16,
    soundText: 'গর্জন! দারুণ খেলেছ ছোট্ট বন্ধু!',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'giraffe',
    nameBn: 'লম্বু জিরাফ',
    nameEn: 'Gigi Giraffe',
    emoji: '🦒',
    requiredStars: 20,
    soundText: 'উঁচু গাছের পাতা খাই, তোমার সাথে বর্ণ শিখতে চাই!',
    colorClass: 'text-yellow-700',
    bgClass: 'bg-yellow-50 border-yellow-200',
  },
  {
    id: 'butterfly',
    nameBn: 'রঙিন প্রজাপতি',
    nameEn: 'Bella Butterfly',
    emoji: '🦋',
    requiredStars: 25,
    soundText: 'ফুররর! ফুলে ফুলে উড়ে বেড়াই আমি!',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50 border-indigo-200',
  },
  {
    id: 'duck',
    nameBn: 'হাঁস ছানা',
    nameEn: 'Dodo Duck',
    emoji: '🦆',
    requiredStars: 30,
    soundText: 'প্যাক প্যাক! জলের মাঝে সাঁতার কাটি!',
    colorClass: 'text-teal-700',
    bgClass: 'bg-teal-50 border-teal-200',
  },
  {
    id: 'peacock',
    nameBn: 'নাচুনে ময়ূর',
    nameEn: 'Mitu Peacock',
    emoji: '🦚',
    requiredStars: 38,
    soundText: 'পেখম মেলে নাচি যখন মেঘ জমে আকাশে!',
    colorClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50 border-cyan-200',
  },
  {
    id: 'whale',
    nameBn: 'নীল তিমি',
    nameEn: 'Wally Whale',
    emoji: '🐋',
    requiredStars: 46,
    soundText: 'ঝপাং! সাগরের ঢেউয়ে খেলি আমরা!',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'unicorn',
    nameBn: 'জাদুর বন্ধু',
    nameEn: 'Starry Unicorn',
    emoji: '🦄',
    requiredStars: 55,
    soundText: 'অভিনন্দন! তুমি সুপারস্টার লার্নার হয়ে গেছ!',
    colorClass: 'text-fuchsia-700',
    bgClass: 'bg-fuchsia-50 border-fuchsia-200',
  },
];



export type StorySceneMotion = 'hop' | 'fly' | 'float' | 'shine' | 'share';

export interface StoryScene {
  narration: string;
  imageUrl: string;
  emoji: string;
  companionEmoji: string;
  motion: StorySceneMotion;
  backdropClass: string;
}

export interface StoryBookItem {
  id: string;
  title: string;
  subtitle: string;
  lang: 'bn' | 'en';
  moralLabel: string;
  moralVoice: string;
  coverImg: string;
  coverEmoji: string;
  accentBg: string;
  accentBorder: string;
  scenes: StoryScene[];
}



export type PuzzleCategory = 'animal' | 'fruit';

export interface JigsawPuzzleItem {
  id: string;
  titleBn: string;
  titleEn: string;
  letterCue: string;
  category: PuzzleCategory;
  emoji: string;
  imageUrl: string;
  lang: 'bn' | 'en';
  completionVoice: string;
  accentBg: string;
  accentBorder: string;
}

export const JIGSAW_PUZZLES: JigsawPuzzleItem[] = [
  {
    id: 'puzzle-apple',
    titleBn: 'লাল আপেল',
    titleEn: 'Apple',
    letterCue: 'A for Apple',
    category: 'fruit',
    emoji: '🍎',
    imageUrl: '/images/objects/apple.jpg',
    lang: 'en',
    completionVoice: 'Yay! Wonderful job! You completed the red Apple puzzle! A is for Apple!',
    accentBg: 'bg-rose-50',
    accentBorder: 'border-rose-200',
  },
  {
    id: 'puzzle-mango',
    titleBn: 'পাকা আম',
    titleEn: 'Mango',
    letterCue: 'আ-তে আম · M for Mango',
    category: 'fruit',
    emoji: '🥭',
    imageUrl: '/images/objects/mango.jpg',
    lang: 'bn',
    completionVoice: 'বাহ! দারুণ করেছ! তুমি পাকা আমের ছবিটি দারুণভাবে মিলিয়েছ! আ তে আম!',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
  },
  {
    id: 'puzzle-tiger',
    titleBn: 'রয়েল বেঙ্গল বাঘ',
    titleEn: 'Tiger',
    letterCue: 'ব-তে বাঘ · T for Tiger',
    category: 'animal',
    emoji: '🐯',
    imageUrl: '/images/objects/tiger.jpg',
    lang: 'bn',
    completionVoice: 'চমৎকার! তুমি টুকু বাঘ মামার ছবিটি একদম ঠিক মিলিয়ে ফেলেছ! ব তে বাঘ!',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-orange-200',
  },
  {
    id: 'puzzle-elephant',
    titleBn: 'বড় হাতি',
    titleEn: 'Elephant',
    letterCue: 'হ-তে হাতি · E for Elephant',
    category: 'animal',
    emoji: '🐘',
    imageUrl: '/images/objects/elephant.jpg',
    lang: 'en',
    completionVoice: 'Awesome job, little buddy! You built the big Elephant puzzle! E is for Elephant!',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
  },
  {
    id: 'puzzle-banana',
    titleBn: 'হলুদ কলা',
    titleEn: 'Banana',
    letterCue: 'ক-তে কলা',
    category: 'fruit',
    emoji: '🍌',
    imageUrl: '/images/objects/banana.jpg',
    lang: 'bn',
    completionVoice: 'সাবাশ! তুমি মিষ্টি পাকা কলার পাজলটি সুন্দর করে মিলিয়েছ! ক তে কলা!',
    accentBg: 'bg-yellow-50',
    accentBorder: 'border-yellow-200',
  },
  {
    id: 'puzzle-lion',
    titleBn: 'বনের রাজা সিংহ',
    titleEn: 'Lion',
    letterCue: 'স-তে সিংহ · L for Lion',
    category: 'animal',
    emoji: '🦁',
    imageUrl: '/images/objects/lion.jpg',
    lang: 'en',
    completionVoice: 'Roar! Great job! You solved the Lion puzzle! L is for Lion!',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
  },
  {
    id: 'puzzle-grapes',
    titleBn: 'সবুজ আঙুর',
    titleEn: 'Grapes',
    letterCue: 'G for Grapes',
    category: 'fruit',
    emoji: '🍇',
    imageUrl: '/images/objects/grapes.jpg',
    lang: 'en',
    completionVoice: 'Sweet work! You completed the Grapes puzzle! G is for Grapes!',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
  },
  {
    id: 'puzzle-rabbit',
    titleBn: 'মিষ্টি খরগোশ',
    titleEn: 'Rabbit',
    letterCue: 'খ-তে খরগোশ · R for Rabbit',
    category: 'animal',
    emoji: '🐰',
    imageUrl: '/images/objects/rabbit.jpg',
    lang: 'bn',
    completionVoice: 'বাহ! খুব সুন্দর! তুমি মিষ্টি খরগোশের ছবিটি মিলিয়ে দিয়েছ! খ তে খরগোশ!',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200',
  },
  {
    id: 'puzzle-watermelon',
    titleBn: 'রসালো তরমুজ',
    titleEn: 'Watermelon',
    letterCue: 'ত-তে তরমুজ',
    category: 'fruit',
    emoji: '🍉',
    imageUrl: '/images/objects/watermelon.jpg',
    lang: 'bn',
    completionVoice: 'দারুণ! রসালো লাল তরমুজের ছবিটি একদম ঠিক হয়েছে! ত তে তরমুজ!',
    accentBg: 'bg-rose-50',
    accentBorder: 'border-rose-200',
  },
  {
    id: 'puzzle-parrot',
    titleBn: 'সবুজ টিয়া পাখি',
    titleEn: 'Parrot',
    letterCue: 'ট-তে টিয়া · P for Parrot',
    category: 'animal',
    emoji: '🦜',
    imageUrl: '/images/objects/parrot.jpg',
    lang: 'en',
    completionVoice: 'Yay! You put the colorful Parrot puzzle together! P is for Parrot!',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
  },
  {
    id: 'puzzle-orange',
    titleBn: 'মিষ্টি কমলা',
    titleEn: 'Orange',
    letterCue: 'O for Orange',
    category: 'fruit',
    emoji: '🍊',
    imageUrl: '/images/objects/orange.jpg',
    lang: 'en',
    completionVoice: 'Hooray! You finished the juicy Orange puzzle! O is for Orange!',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-orange-200',
  },
  {
    id: 'puzzle-deer',
    titleBn: 'চঞ্চল হরিণ',
    titleEn: 'Deer',
    letterCue: 'ণ-তে হরিণ',
    category: 'animal',
    emoji: '🦌',
    imageUrl: '/images/objects/deer.jpg',
    lang: 'bn',
    completionVoice: 'বাহ! চমৎকার! তুমি হরিণ ছানার ছবিটি দারুণভাবে মিলিয়ে ফেলেছ!',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
  },
];


