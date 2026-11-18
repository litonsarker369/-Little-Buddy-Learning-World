export type DrawingCategory =
  | 'all'
  | 'animals'
  | 'fruits'
  | 'nature'
  | 'vehicles'
  | 'shapes'
  | 'letters';

export interface GuideTemplate {
  id: string;
  label: string;
  emoji: string;
  category: Exclude<DrawingCategory, 'all'>;
}

export const DRAWING_CATEGORIES: { id: DrawingCategory; label: string }[] = [
  { id: 'all', label: 'সব ছবি' },
  { id: 'animals', label: 'প্রাণী ও পাখি' },
  { id: 'fruits', label: 'ফল ও খাবার' },
  { id: 'nature', label: 'প্রকৃতি ও আকাশ' },
  { id: 'vehicles', label: 'যানবাহন ও খেলনা' },
  { id: 'shapes', label: 'ঘর ও আকার' },
  { id: 'letters', label: 'বর্ণ ও সংখ্যা' },
];

export const DRAWING_TEMPLATES: GuideTemplate[] = [
  { id: 'blank', label: 'ফাঁকা কাগজ', emoji: '📄', category: 'shapes' },

  // 1. Animals & Birds (24)
  { id: 'cat', label: 'বিড়াল ছানা', emoji: '🐱', category: 'animals' },
  { id: 'dog', label: 'কুকুর ছানা', emoji: '🐶', category: 'animals' },
  { id: 'bunny', label: 'খরগোশ', emoji: '🐰', category: 'animals' },
  { id: 'fish', label: 'মাছ', emoji: '🐟', category: 'animals' },
  { id: 'butterfly', label: 'প্রজাপতি', emoji: '🦋', category: 'animals' },
  { id: 'bird', label: 'পাখি', emoji: '🐦', category: 'animals' },
  { id: 'duck', label: 'হাঁস', emoji: '🦆', category: 'animals' },
  { id: 'chick', label: 'মুরগির ছানা', emoji: '🐤', category: 'animals' },
  { id: 'elephant', label: 'হাতি', emoji: '🐘', category: 'animals' },
  { id: 'lion', label: 'সিংহ', emoji: '🦁', category: 'animals' },
  { id: 'panda', label: 'পান্ডা', emoji: '🐼', category: 'animals' },
  { id: 'owl', label: 'প্যাঁচা', emoji: '🦉', category: 'animals' },
  { id: 'frog', label: 'ব্যাঙ', emoji: '🐸', category: 'animals' },
  { id: 'turtle', label: 'কচ্ছপ', emoji: '🐢', category: 'animals' },
  { id: 'snail', label: 'শামুক', emoji: '🐌', category: 'animals' },
  { id: 'bee', label: 'মৌমাছি', emoji: '🐝', category: 'animals' },
  { id: 'ladybug', label: 'গুবরে পোকা', emoji: '🐞', category: 'animals' },
  { id: 'whale', label: 'তিমি মাছ', emoji: '🐳', category: 'animals' },
  { id: 'octopus', label: 'অক্টোপাস', emoji: '🐙', category: 'animals' },
  { id: 'crab', label: 'কাঁকড়া', emoji: '🦀', category: 'animals' },
  { id: 'penguin', label: 'পেঙ্গুইন', emoji: '🐧', category: 'animals' },
  { id: 'giraffe', label: 'জিরাফ', emoji: '🦒', category: 'animals' },
  { id: 'cow', label: 'গরু', emoji: '🐮', category: 'animals' },
  { id: 'bear', label: 'ভাল্লুক', emoji: '🐻', category: 'animals' },

  // 2. Fruits & Treats (20)
  { id: 'apple', label: 'আপেল', emoji: '🍎', category: 'fruits' },
  { id: 'mango', label: 'আম', emoji: '🥭', category: 'fruits' },
  { id: 'banana', label: 'কলা', emoji: '🍌', category: 'fruits' },
  { id: 'grapes', label: 'আঙুর', emoji: '🍇', category: 'fruits' },
  { id: 'watermelon', label: 'তরমুজ', emoji: '🍉', category: 'fruits' },
  { id: 'strawberry', label: 'স্ট্রবেরি', emoji: '🍓', category: 'fruits' },
  { id: 'orange', label: 'কমলা', emoji: '🍊', category: 'fruits' },
  { id: 'pineapple', label: 'আনারস', emoji: '🍍', category: 'fruits' },
  { id: 'cherry', label: 'চেরি', emoji: '🍒', category: 'fruits' },
  { id: 'pear', label: 'নাশপাতি', emoji: '🍐', category: 'fruits' },
  { id: 'carrot', label: 'গাজর', emoji: '🥕', category: 'fruits' },
  { id: 'corn', label: 'ভুট্টা', emoji: '🌽', category: 'fruits' },
  { id: 'coconut', label: 'ডাব', emoji: '🥥', category: 'fruits' },
  { id: 'icecream', label: 'আইসক্রিম', emoji: '🍦', category: 'fruits' },
  { id: 'cupcake', label: 'কাপকেক', emoji: '🧁', category: 'fruits' },
  { id: 'cake', label: 'জন্মদিনের কেক', emoji: '🎂', category: 'fruits' },
  { id: 'lollipop', label: 'ললিপপ', emoji: '🍭', category: 'fruits' },
  { id: 'donut', label: 'ডোনাট', emoji: '🍩', category: 'fruits' },
  { id: 'mug', label: 'দুধের মগ', emoji: '☕', category: 'fruits' },
  { id: 'pizza', label: 'পিৎজা', emoji: '🍕', category: 'fruits' },

  // 3. Nature & Sky (18)
  { id: 'sun', label: 'সূর্য', emoji: '☀️', category: 'nature' },
  { id: 'crescent', label: 'চাঁদ মামা', emoji: '🌙', category: 'nature' },
  { id: 'moonstars', label: 'চাঁদ ও তারা', emoji: '🌟', category: 'nature' },
  { id: 'cloud', label: 'মেঘ', emoji: '☁️', category: 'nature' },
  { id: 'rainbow', label: 'রংধনু', emoji: '🌈', category: 'nature' },
  { id: 'raindrop', label: 'বৃষ্টির ফোঁটা', emoji: '💧', category: 'nature' },
  { id: 'umbrella', label: 'ছাতা', emoji: '☂️', category: 'nature' },
  { id: 'tree', label: 'আম গাছ', emoji: '🌳', category: 'nature' },
  { id: 'pine', label: 'পাইন গাছ', emoji: '🌲', category: 'nature' },
  { id: 'flower', label: 'ফুল', emoji: '🌸', category: 'nature' },
  { id: 'sunflower', label: 'সূর্যমুখী', emoji: '🌻', category: 'nature' },
  { id: 'tulip', label: 'টিউলিপ ফুল', emoji: '🌷', category: 'nature' },
  { id: 'lotus', label: 'শাপলা ফুল', emoji: '🪷', category: 'nature' },
  { id: 'leaf', label: 'সবুজ পাতা', emoji: '🍃', category: 'nature' },
  { id: 'mountain', label: 'পাহাড় ও সূর্য', emoji: '⛰️', category: 'nature' },
  { id: 'waves', label: 'নদীর ঢেউ', emoji: '🌊', category: 'nature' },
  { id: 'mushroom', label: 'ব্যাঙের ছাতা', emoji: '🍄', category: 'nature' },
  { id: 'cactus', label: 'ক্যাকটাস', emoji: '🌵', category: 'nature' },

  // 4. Vehicles & Toys (18)
  { id: 'car', label: 'ছোট্ট গাড়ি', emoji: '🚗', category: 'vehicles' },
  { id: 'bus', label: 'স্কুল বাস', emoji: '🚌', category: 'vehicles' },
  { id: 'train', label: 'রেলগাড়ি', emoji: '🚂', category: 'vehicles' },
  { id: 'airplane', label: 'উড়োজাহাজ', emoji: '✈️', category: 'vehicles' },
  { id: 'rocket', label: 'রকেট', emoji: '🚀', category: 'vehicles' },
  { id: 'helicopter', label: 'হেলিকপ্টার', emoji: '🚁', category: 'vehicles' },
  { id: 'bicycle', label: 'সাইকেল', emoji: '🚲', category: 'vehicles' },
  { id: 'boat', label: 'পালতোলা নৌকা', emoji: '⛵', category: 'vehicles' },
  { id: 'ship', label: 'জাহাজ', emoji: '🚢', category: 'vehicles' },
  { id: 'kite', label: 'ঘুড়ি', emoji: '🪁', category: 'vehicles' },
  { id: 'balloon', label: 'বেলুন', emoji: '🎈', category: 'vehicles' },
  { id: 'teddy', label: 'টেডি বিয়ার', emoji: '🧸', category: 'vehicles' },
  { id: 'ball', label: 'ফুটবল', emoji: '⚽', category: 'vehicles' },
  { id: 'drum', label: 'ঢোল', emoji: '🥁', category: 'vehicles' },
  { id: 'robot', label: 'রোবট বন্ধু', emoji: '🤖', category: 'vehicles' },
  { id: 'crown', label: 'রাজার মুকুট', emoji: '👑', category: 'vehicles' },
  { id: 'trophy', label: 'ট্রফি', emoji: '🏆', category: 'vehicles' },
  { id: 'castle', label: 'রাজপ্রাসাদ', emoji: '🏰', category: 'vehicles' },

  // 5. Home, Shapes & Everyday (16)
  { id: 'house', label: 'ছোট্ট ঘর', emoji: '🏠', category: 'shapes' },
  { id: 'tent', label: 'তাঁবু', emoji: '⛺', category: 'shapes' },
  { id: 'lamp', label: 'টেবিল বাতি', emoji: '💡', category: 'shapes' },
  { id: 'clock', label: 'ঘড়ি', emoji: '⏰', category: 'shapes' },
  { id: 'book', label: 'বই', emoji: '📖', category: 'shapes' },
  { id: 'pencil', label: 'পেন্সিল', emoji: '✏️', category: 'shapes' },
  { id: 'glasses', label: 'চশমা', emoji: '👓', category: 'shapes' },
  { id: 'hat', label: 'টুপি', emoji: '🎩', category: 'shapes' },
  { id: 'gift', label: 'উপহার বাক্স', emoji: '🎁', category: 'shapes' },
  { id: 'heart', label: 'ভালোবাসা', emoji: '❤️', category: 'shapes' },
  { id: 'star', label: 'বড় তারা', emoji: '⭐', category: 'shapes' },
  { id: 'diamond', label: 'হীরক', emoji: '💎', category: 'shapes' },
  { id: 'triangle', label: 'ত্রিভুজ', emoji: '🔺', category: 'shapes' },
  { id: 'hexagon', label: 'ষড়ভুজ', emoji: '⬡', category: 'shapes' },
  { id: 'smiley', label: 'হাসি মুখ', emoji: '😊', category: 'shapes' },
  { id: 'snowman', label: 'তুষার বন্ধু', emoji: '⛄', category: 'shapes' },

  // 6. Letters & Numbers (20)
  { id: 'glyph-অ', label: 'বর্ণ অ', emoji: 'অ', category: 'letters' },
  { id: 'glyph-আ', label: 'বর্ণ আ', emoji: 'আ', category: 'letters' },
  { id: 'glyph-ই', label: 'বর্ণ ই', emoji: 'ই', category: 'letters' },
  { id: 'glyph-ক', label: 'বর্ণ ক', emoji: 'ক', category: 'letters' },
  { id: 'glyph-খ', label: 'বর্ণ খ', emoji: 'খ', category: 'letters' },
  { id: 'glyph-গ', label: 'বর্ণ গ', emoji: 'গ', category: 'letters' },
  { id: 'glyph-A', label: 'Letter A', emoji: 'A', category: 'letters' },
  { id: 'glyph-B', label: 'Letter B', emoji: 'B', category: 'letters' },
  { id: 'glyph-C', label: 'Letter C', emoji: 'C', category: 'letters' },
  { id: 'glyph-D', label: 'Letter D', emoji: 'D', category: 'letters' },
  { id: 'glyph-E', label: 'Letter E', emoji: 'E', category: 'letters' },
  { id: 'glyph-F', label: 'Letter F', emoji: 'F', category: 'letters' },
  { id: 'glyph-১', label: 'সংখ্যা ১', emoji: '১', category: 'letters' },
  { id: 'glyph-২', label: 'সংখ্যা ২', emoji: '২', category: 'letters' },
  { id: 'glyph-৩', label: 'সংখ্যা ৩', emoji: '৩', category: 'letters' },
  { id: 'glyph-৪', label: 'সংখ্যা ৪', emoji: '৪', category: 'letters' },
  { id: 'glyph-1', label: 'Number 1', emoji: '1', category: 'letters' },
  { id: 'glyph-2', label: 'Number 2', emoji: '2', category: 'letters' },
  { id: 'glyph-3', label: 'Number 3', emoji: '3', category: 'letters' },
  { id: 'glyph-4', label: 'Number 4', emoji: '4', category: 'letters' },
];

export const CANVAS_W = 960;
export const CANVAS_H = 540;

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = 0
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.stroke();
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function poly(ctx: CanvasRenderingContext2D, pts: [number, number][], close = true) {
  if (pts.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  if (close) ctx.closePath();
  ctx.stroke();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points = 5
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.85);
  ctx.bezierCurveTo(cx - s * 1.4, cy + s * 0.1, cx - s * 1.15, cy - s * 0.95, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 1.15, cy - s * 0.95, cx + s * 1.4, cy + s * 0.1, cx, cy + s * 0.85);
  ctx.closePath();
  ctx.stroke();
}

function cuteEyesAndSmile(ctx: CanvasRenderingContext2D, cx: number, cy: number, spread = 42) {
  circle(ctx, cx - spread, cy - 15, 13);
  circle(ctx, cx + spread, cy - 15, 13);
  ctx.beginPath();
  ctx.arc(cx, cy + 20, 26, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

export function drawTemplateOutline(
  ctx: CanvasRenderingContext2D,
  templateId: string
) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (templateId === 'blank') return;

  ctx.save();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 9]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  if (templateId.startsWith('glyph-')) {
    const ch = templateId.slice('glyph-'.length);
    ctx.font = '900 320px "Noto Sans Bengali", "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.strokeText(ch, cx, cy + 12);
    ctx.restore();
    return;
  }

  switch (templateId) {
    // --- ANIMALS ---
    case 'cat': {
      circle(ctx, cx, cy + 20, 125);
      poly(ctx, [[cx - 105, cy - 45], [cx - 125, cy - 165], [cx - 30, cy - 95]]);
      poly(ctx, [[cx + 105, cy - 45], [cx + 125, cy - 165], [cx + 30, cy - 95]]);
      cuteEyesAndSmile(ctx, cx, cy + 15, 45);
      poly(ctx, [[cx - 14, cy + 10], [cx + 14, cy + 10], [cx, cy + 26]]);
      line(ctx, cx - 150, cy + 12, cx - 65, cy + 22);
      line(ctx, cx - 155, cy + 40, cx - 65, cy + 36);
      line(ctx, cx + 150, cy + 12, cx + 65, cy + 22);
      line(ctx, cx + 155, cy + 40, cx + 65, cy + 36);
      break;
    }
    case 'dog': {
      circle(ctx, cx, cy + 15, 120);
      ellipse(ctx, cx - 135, cy + 15, 38, 88, 0.25);
      ellipse(ctx, cx + 135, cy + 15, 38, 88, -0.25);
      cuteEyesAndSmile(ctx, cx, cy + 5, 42);
      ellipse(ctx, cx, cy + 25, 22, 14);
      break;
    }
    case 'bunny': {
      circle(ctx, cx, cy + 55, 115);
      ellipse(ctx, cx - 48, cy - 115, 34, 92, -0.1);
      ellipse(ctx, cx + 48, cy - 115, 34, 92, 0.1);
      cuteEyesAndSmile(ctx, cx, cy + 48, 40);
      circle(ctx, cx, cy + 58, 12);
      break;
    }
    case 'fish': {
      ellipse(ctx, cx - 25, cy, 160, 96);
      poly(ctx, [[cx + 135, cy], [cx + 228, cy - 78], [cx + 228, cy + 78]]);
      poly(ctx, [[cx - 35, cy - 95], [cx + 10, cy - 150], [cx + 45, cy - 90]]);
      circle(ctx, cx - 115, cy - 20, 17);
      ctx.beginPath();
      ctx.arc(cx - 50, cy, 75, -0.7, 0.7);
      ctx.stroke();
      break;
    }
    case 'butterfly': {
      ellipse(ctx, cx, cy, 20, 115);
      ellipse(ctx, cx - 95, cy - 55, 85, 65, -0.3);
      ellipse(ctx, cx + 95, cy - 55, 85, 65, 0.3);
      ellipse(ctx, cx - 78, cy + 62, 65, 50, 0.3);
      ellipse(ctx, cx + 78, cy + 62, 65, 50, -0.3);
      line(ctx, cx - 8, cy - 110, cx - 42, cy - 170);
      line(ctx, cx + 8, cy - 110, cx + 42, cy - 170);
      circle(ctx, cx - 46, cy - 176, 8);
      circle(ctx, cx + 46, cy - 176, 8);
      break;
    }
    case 'bird': {
      ellipse(ctx, cx - 15, cy + 30, 115, 82);
      circle(ctx, cx + 75, cy - 55, 58);
      poly(ctx, [[cx + 130, cy - 62], [cx + 185, cy - 45], [cx + 130, cy - 30]]);
      poly(ctx, [[cx - 125, cy + 15], [cx - 210, cy - 30], [cx - 190, cy + 35]]);
      ellipse(ctx, cx - 15, cy + 25, 58, 34, -0.2);
      circle(ctx, cx + 92, cy - 68, 10);
      break;
    }
    case 'duck': {
      ellipse(ctx, cx - 25, cy + 55, 130, 75);
      circle(ctx, cx + 82, cy - 65, 55);
      ellipse(ctx, cx + 152, cy - 58, 36, 16);
      circle(ctx, cx + 96, cy - 78, 10);
      ellipse(ctx, cx - 35, cy + 50, 65, 35, -0.15);
      break;
    }
    case 'chick': {
      circle(ctx, cx, cy + 45, 105);
      circle(ctx, cx, cy - 75, 72);
      poly(ctx, [[cx - 18, cy - 68], [cx + 18, cy - 68], [cx, cy - 42]]);
      circle(ctx, cx - 28, cy - 88, 10);
      circle(ctx, cx + 28, cy - 88, 10);
      ellipse(ctx, cx - 108, cy + 45, 32, 52, 0.35);
      ellipse(ctx, cx + 108, cy + 45, 32, 52, -0.35);
      break;
    }
    case 'elephant': {
      circle(ctx, cx, cy - 10, 115);
      ellipse(ctx, cx - 145, cy - 10, 62, 105, -0.15);
      ellipse(ctx, cx + 145, cy - 10, 62, 105, 0.15);
      circle(ctx, cx - 42, cy - 38, 14);
      circle(ctx, cx + 42, cy - 38, 14);
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 15);
      ctx.quadraticCurveTo(cx - 28, cy + 165, cx + 38, cy + 160);
      ctx.quadraticCurveTo(cx + 62, cy + 155, cx + 52, cy + 130);
      ctx.quadraticCurveTo(cx + 16, cy + 130, cx + 22, cy + 15);
      ctx.stroke();
      break;
    }
    case 'lion': {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        circle(ctx, cx + Math.cos(a) * 128, cy + Math.sin(a) * 128, 42);
      }
      circle(ctx, cx, cy, 106);
      cuteEyesAndSmile(ctx, cx, cy - 5, 38);
      poly(ctx, [[cx - 16, cy + 5], [cx + 16, cy + 5], [cx, cy + 24]]);
      break;
    }
    case 'panda': {
      circle(ctx, cx, cy + 20, 125);
      circle(ctx, cx - 102, cy - 88, 42);
      circle(ctx, cx + 102, cy - 88, 42);
      ellipse(ctx, cx - 48, cy + 2, 34, 42, 0.3);
      ellipse(ctx, cx + 48, cy + 2, 34, 42, -0.3);
      circle(ctx, cx - 44, cy, 12);
      circle(ctx, cx + 44, cy, 12);
      ellipse(ctx, cx, cy + 38, 18, 12);
      break;
    }
    case 'owl': {
      ellipse(ctx, cx, cy + 20, 118, 142);
      circle(ctx, cx - 44, cy - 42, 38);
      circle(ctx, cx + 44, cy - 42, 38);
      circle(ctx, cx - 44, cy - 42, 12);
      circle(ctx, cx + 44, cy - 42, 12);
      poly(ctx, [[cx - 16, cy - 12], [cx + 16, cy - 12], [cx, cy + 20]]);
      ellipse(ctx, cx - 120, cy + 35, 30, 80, 0.2);
      ellipse(ctx, cx + 120, cy + 35, 30, 80, -0.2);
      break;
    }
    case 'frog': {
      ellipse(ctx, cx, cy + 35, 138, 98);
      circle(ctx, cx - 68, cy - 68, 44);
      circle(ctx, cx + 68, cy - 68, 44);
      circle(ctx, cx - 68, cy - 68, 16);
      circle(ctx, cx + 68, cy - 68, 16);
      ctx.beginPath();
      ctx.arc(cx, cy + 20, 74, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }
    case 'turtle': {
      ctx.beginPath();
      ctx.arc(cx - 20, cy + 35, 140, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
      circle(ctx, cx + 150, cy - 10, 48);
      circle(ctx, cx + 165, cy - 22, 9);
      ellipse(ctx, cx - 100, cy + 68, 30, 42);
      ellipse(ctx, cx + 55, cy + 68, 30, 42);
      break;
    }
    case 'snail': {
      ellipse(ctx, cx + 15, cy + 85, 185, 36);
      circle(ctx, cx - 25, cy - 10, 102);
      circle(ctx, cx - 25, cy - 10, 62);
      circle(ctx, cx - 25, cy - 10, 26);
      line(ctx, cx + 145, cy + 55, cx + 165, cy - 25);
      line(ctx, cx + 170, cy + 55, cx + 198, cy - 18);
      circle(ctx, cx + 166, cy - 32, 10);
      circle(ctx, cx + 200, cy - 24, 10);
      break;
    }
    case 'bee': {
      ellipse(ctx, cx, cy + 20, 125, 82);
      ellipse(ctx, cx - 30, cy - 88, 45, 70, -0.35);
      ellipse(ctx, cx + 30, cy - 88, 45, 70, 0.35);
      line(ctx, cx - 40, cy - 56, cx - 40, cy + 96);
      line(ctx, cx + 10, cy - 62, cx + 10, cy + 102);
      line(ctx, cx + 60, cy - 50, cx + 60, cy + 90);
      circle(ctx, cx - 82, cy + 5, 12);
      break;
    }
    case 'ladybug': {
      circle(ctx, cx, cy + 25, 130);
      ctx.beginPath();
      ctx.arc(cx, cy - 95, 58, Math.PI, 0);
      ctx.stroke();
      line(ctx, cx, cy - 95, cx, cy + 155);
      circle(ctx, cx - 55, cy - 5, 22);
      circle(ctx, cx + 55, cy - 5, 22);
      circle(ctx, cx - 60, cy + 70, 24);
      circle(ctx, cx + 60, cy + 70, 24);
      break;
    }
    case 'whale': {
      ellipse(ctx, cx - 20, cy + 35, 165, 96);
      poly(ctx, [[cx + 140, cy + 35], [cx + 225, cy - 35], [cx + 215, cy + 35], [cx + 225, cy + 95]]);
      circle(ctx, cx - 120, cy + 18, 14);
      line(ctx, cx - 45, cy - 60, cx - 45, cy - 130);
      circle(ctx, cx - 75, cy - 145, 22);
      circle(ctx, cx - 15, cy - 145, 22);
      break;
    }
    case 'octopus': {
      circle(ctx, cx, cy - 45, 95);
      cuteEyesAndSmile(ctx, cx, cy - 45, 34);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 38, cy + 45);
        ctx.quadraticCurveTo(cx + i * 52, cy + 130, cx + i * 32, cy + 180);
        ctx.stroke();
      }
      break;
    }
    case 'crab': {
      ellipse(ctx, cx, cy + 40, 125, 78);
      circle(ctx, cx - 40, cy - 55, 20);
      circle(ctx, cx + 40, cy - 55, 20);
      line(ctx, cx - 35, cy - 25, cx - 40, cy - 35);
      line(ctx, cx + 35, cy - 25, cx + 40, cy - 35);
      circle(ctx, cx - 155, cy - 65, 42);
      circle(ctx, cx + 155, cy - 65, 42);
      line(ctx, cx - 110, cy + 15, cx - 145, cy - 28);
      line(ctx, cx + 110, cy + 15, cx + 145, cy - 28);
      break;
    }
    case 'penguin': {
      ellipse(ctx, cx, cy + 35, 108, 138);
      circle(ctx, cx, cy - 105, 68);
      ellipse(ctx, cx, cy + 50, 74, 100);
      poly(ctx, [[cx - 18, cy - 95], [cx + 18, cy - 95], [cx, cy - 68]]);
      circle(ctx, cx - 24, cy - 118, 10);
      circle(ctx, cx + 24, cy - 118, 10);
      break;
    }
    case 'giraffe': {
      ctx.strokeRect(cx - 32, cy - 45, 64, 220);
      ellipse(ctx, cx, cy - 95, 62, 52);
      ellipse(ctx, cx - 64, cy - 118, 28, 16, -0.4);
      ellipse(ctx, cx + 64, cy - 118, 28, 16, 0.4);
      line(ctx, cx - 22, cy - 142, cx - 28, cy - 185);
      line(ctx, cx + 22, cy - 142, cx + 28, cy - 185);
      circle(ctx, cx - 28, cy - 192, 10);
      circle(ctx, cx + 28, cy - 192, 10);
      circle(ctx, cx - 22, cy - 105, 10);
      circle(ctx, cx + 22, cy - 105, 10);
      break;
    }
    case 'cow': {
      ellipse(ctx, cx, cy + 15, 118, 105);
      ellipse(ctx, cx, cy + 75, 84, 52);
      ellipse(ctx, cx - 125, cy - 35, 42, 22, -0.35);
      ellipse(ctx, cx + 125, cy - 35, 42, 22, 0.35);
      circle(ctx, cx - 42, cy - 22, 12);
      circle(ctx, cx + 42, cy - 22, 12);
      circle(ctx, cx - 26, cy + 75, 10);
      circle(ctx, cx + 26, cy + 75, 10);
      break;
    }
    case 'bear': {
      circle(ctx, cx, cy + 20, 122);
      circle(ctx, cx - 98, cy - 82, 46);
      circle(ctx, cx + 98, cy - 82, 46);
      ellipse(ctx, cx, cy + 52, 56, 42);
      cuteEyesAndSmile(ctx, cx, cy + 10, 40);
      ellipse(ctx, cx, cy + 40, 18, 12);
      break;
    }

    // --- FRUITS & TREATS ---
    case 'apple': {
      circle(ctx, cx - 45, cy + 20, 96);
      circle(ctx, cx + 45, cy + 20, 96);
      line(ctx, cx, cy - 68, cx + 12, cy - 145);
      ellipse(ctx, cx + 52, cy - 118, 44, 22, -0.4);
      break;
    }
    case 'mango': {
      ellipse(ctx, cx, cy + 20, 102, 140, 0.25);
      line(ctx, cx + 25, cy - 115, cx + 38, cy - 175);
      ellipse(ctx, cx + 78, cy - 140, 48, 20, -0.3);
      break;
    }
    case 'banana': {
      ctx.beginPath();
      ctx.arc(cx + 30, cy - 35, 175, 0.65, 2.55);
      ctx.arc(cx + 30, cy - 85, 145, 2.4, 0.75, true);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'grapes': {
      const rows = [
        [cx - 60, cy - 65], [cx, cy - 65], [cx + 60, cy - 65],
        [cx - 42, cy - 5], [cx + 18, cy - 5], [cx + 62, cy - 5],
        [cx - 25, cy + 55], [cx + 30, cy + 55],
        [cx, cy + 115],
      ];
      rows.forEach(([gx, gy]) => circle(ctx, gx, gy, 34));
      line(ctx, cx, cy - 102, cx, cy - 165);
      ellipse(ctx, cx + 48, cy - 140, 42, 20, -0.3);
      break;
    }
    case 'watermelon': {
      ctx.beginPath();
      ctx.arc(cx, cy - 35, 178, 0, Math.PI);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 35, 148, 0, Math.PI);
      ctx.stroke();
      [-70, -25, 25, 70].forEach((ox, idx) =>
        ellipse(ctx, cx + ox, cy + 45 + (idx % 2) * 28, 8, 14)
      );
      break;
    }
    case 'strawberry': {
      heartPath(ctx, cx, cy + 30, 130);
      ellipse(ctx, cx - 42, cy - 95, 36, 16, -0.3);
      ellipse(ctx, cx + 42, cy - 95, 36, 16, 0.3);
      ellipse(ctx, cx, cy - 105, 18, 32);
      [[-45, -10], [45, -10], [0, 30], [-30, 72], [30, 72]].forEach(([dx, dy]) =>
        circle(ctx, cx + dx, cy + dy, 6)
      );
      break;
    }
    case 'orange': {
      circle(ctx, cx, cy + 15, 132);
      ellipse(ctx, cx + 38, cy - 130, 44, 20, -0.35);
      circle(ctx, cx - 45, cy - 35, 8);
      circle(ctx, cx - 70, cy + 5, 8);
      circle(ctx, cx + 52, cy + 25, 8);
      break;
    }
    case 'pineapple': {
      ellipse(ctx, cx, cy + 52, 102, 132);
      poly(ctx, [[cx - 55, cy - 75], [cx - 85, cy - 180], [cx - 20, cy - 95], [cx, cy - 205], [cx + 20, cy - 95], [cx + 85, cy - 180], [cx + 55, cy - 75]]);
      line(ctx, cx - 65, cy - 15, cx + 65, cy + 115);
      line(ctx, cx + 65, cy - 15, cx - 65, cy + 115);
      break;
    }
    case 'cherry': {
      circle(ctx, cx - 68, cy + 82, 58);
      circle(ctx, cx + 68, cy + 82, 58);
      ctx.beginPath();
      ctx.moveTo(cx - 68, cy + 24);
      ctx.quadraticCurveTo(cx - 35, cy - 95, cx, cy - 145);
      ctx.quadraticCurveTo(cx + 35, cy - 95, cx + 68, cy + 24);
      ctx.stroke();
      ellipse(ctx, cx + 48, cy - 135, 42, 20, -0.3);
      break;
    }
    case 'pear': {
      circle(ctx, cx, cy + 68, 104);
      circle(ctx, cx, cy - 42, 66);
      line(ctx, cx, cy - 108, cx + 10, cy - 165);
      ellipse(ctx, cx + 48, cy - 140, 38, 18, -0.3);
      break;
    }
    case 'carrot': {
      poly(ctx, [[cx - 62, cy - 75], [cx + 62, cy - 75], [cx, cy + 185]]);
      ellipse(ctx, cx - 32, cy - 132, 20, 56, -0.3);
      ellipse(ctx, cx, cy - 142, 20, 62);
      ellipse(ctx, cx + 32, cy - 132, 20, 56, 0.3);
      break;
    }
    case 'corn': {
      ellipse(ctx, cx, cy - 10, 68, 145);
      ellipse(ctx, cx - 68, cy + 55, 38, 95, -0.45);
      ellipse(ctx, cx + 68, cy + 55, 38, 95, 0.45);
      line(ctx, cx - 45, cy - 75, cx + 45, cy - 75);
      line(ctx, cx - 55, cy - 25, cx + 55, cy - 25);
      line(ctx, cx - 55, cy + 25, cx + 55, cy + 25);
      break;
    }
    case 'coconut': {
      circle(ctx, cx, cy + 25, 130);
      circle(ctx, cx, cy + 25, 96);
      circle(ctx, cx - 22, cy - 8, 14);
      circle(ctx, cx + 22, cy - 8, 14);
      circle(ctx, cx, cy + 28, 14);
      break;
    }
    case 'icecream': {
      poly(ctx, [[cx - 88, cy - 10], [cx + 88, cy - 10], [cx, cy + 195]]);
      circle(ctx, cx - 48, cy - 48, 56);
      circle(ctx, cx + 48, cy - 48, 56);
      circle(ctx, cx, cy - 105, 58);
      circle(ctx, cx, cy - 172, 18);
      break;
    }
    case 'cupcake': {
      poly(ctx, [[cx - 95, cy + 10], [cx + 95, cy + 10], [cx + 68, cy + 165], [cx - 68, cy + 165]]);
      circle(ctx, cx - 58, cy - 20, 52);
      circle(ctx, cx + 58, cy - 20, 52);
      circle(ctx, cx, cy - 65, 62);
      circle(ctx, cx, cy - 138, 20);
      break;
    }
    case 'cake': {
      ctx.strokeRect(cx - 155, cy + 30, 310, 125);
      ctx.strokeRect(cx - 115, cy - 65, 230, 95);
      ctx.strokeRect(cx - 10, cy - 135, 20, 70);
      ellipse(ctx, cx, cy - 155, 14, 22);
      break;
    }
    case 'lollipop': {
      circle(ctx, cx, cy - 55, 118);
      circle(ctx, cx, cy - 55, 76);
      circle(ctx, cx, cy - 55, 36);
      line(ctx, cx, cy + 65, cx, cy + 215);
      break;
    }
    case 'donut': {
      circle(ctx, cx, cy, 148);
      circle(ctx, cx, cy, 56);
      circle(ctx, cx - 85, cy - 45, 10);
      circle(ctx, cx + 82, cy - 48, 10);
      circle(ctx, cx, cy - 98, 10);
      circle(ctx, cx - 72, cy + 75, 10);
      circle(ctx, cx + 78, cy + 68, 10);
      break;
    }
    case 'mug': {
      ctx.strokeRect(cx - 110, cy - 55, 200, 195);
      ctx.beginPath();
      ctx.arc(cx + 90, cy + 40, 52, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 35, cy - 115, 22, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 25, cy - 115, 22, 0, Math.PI);
      ctx.stroke();
      break;
    }
    case 'pizza': {
      poly(ctx, [[cx, cy - 160], [cx - 145, cy + 145], [cx + 145, cy + 145]]);
      circle(ctx, cx, cy + 10, 26);
      circle(ctx, cx - 45, cy + 85, 24);
      circle(ctx, cx + 48, cy + 85, 24);
      break;
    }

    // --- NATURE & SKY ---
    case 'sun': {
      circle(ctx, cx, cy, 102);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        line(ctx, cx + Math.cos(a) * 124, cy + Math.sin(a) * 124, cx + Math.cos(a) * 172, cy + Math.sin(a) * 172);
      }
      break;
    }
    case 'crescent': {
      ctx.beginPath();
      ctx.arc(cx, cy, 148, 0.55, Math.PI * 2 - 0.55);
      ctx.arc(cx + 68, cy, 118, Math.PI * 2 - 0.9, 0.9, true);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'moonstars': {
      circle(ctx, cx - 75, cy, 98);
      starPath(ctx, cx + 105, cy - 68, 52, 24);
      starPath(ctx, cx + 125, cy + 68, 36, 16);
      break;
    }
    case 'cloud': {
      circle(ctx, cx - 95, cy + 35, 65);
      circle(ctx, cx - 25, cy - 25, 82);
      circle(ctx, cx + 65, cy - 5, 72);
      circle(ctx, cx + 120, cy + 45, 55);
      line(ctx, cx - 105, cy + 100, cx + 125, cy + 100);
      break;
    }
    case 'rainbow': {
      [195, 160, 125, 90].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy + 85, r, Math.PI, 0);
        ctx.stroke();
      });
      circle(ctx, cx - 185, cy + 95, 42);
      circle(ctx, cx + 185, cy + 95, 42);
      break;
    }
    case 'raindrop': {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 165);
      ctx.quadraticCurveTo(cx + 135, cy + 25, cx, cy + 165);
      ctx.quadraticCurveTo(cx - 135, cy + 25, cx, cy - 165);
      ctx.stroke();
      break;
    }
    case 'umbrella': {
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 165, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
      line(ctx, cx, cy + 10, cx, cy + 170);
      ctx.beginPath();
      ctx.arc(cx + 26, cy + 170, 26, 0, Math.PI);
      ctx.stroke();
      break;
    }
    case 'tree': {
      ctx.strokeRect(cx - 32, cy + 35, 64, 155);
      circle(ctx, cx, cy - 65, 95);
      circle(ctx, cx - 80, cy - 15, 72);
      circle(ctx, cx + 80, cy - 15, 72);
      break;
    }
    case 'pine': {
      ctx.strokeRect(cx - 28, cy + 115, 56, 85);
      poly(ctx, [[cx, cy - 185], [cx - 115, cy - 35], [cx + 115, cy - 35]]);
      poly(ctx, [[cx, cy - 95], [cx - 145, cy + 45], [cx + 145, cy + 45]]);
      poly(ctx, [[cx, cy - 15], [cx - 175, cy + 115], [cx + 175, cy + 115]]);
      break;
    }
    case 'flower': {
      line(ctx, cx, cy + 45, cx, cy + 210);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        circle(ctx, cx + Math.cos(a) * 84, cy - 45 + Math.sin(a) * 84, 50);
      }
      circle(ctx, cx, cy - 45, 46);
      break;
    }
    case 'sunflower': {
      line(ctx, cx, cy + 75, cx, cy + 215);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ellipse(ctx, cx + Math.cos(a) * 98, cy - 30 + Math.sin(a) * 98, 26, 46, a + Math.PI / 2);
      }
      circle(ctx, cx, cy - 30, 62);
      break;
    }
    case 'tulip': {
      line(ctx, cx, cy + 45, cx, cy + 210);
      ellipse(ctx, cx - 55, cy + 135, 45, 22, -0.5);
      ellipse(ctx, cx + 55, cy + 135, 45, 22, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy - 25, 85, 0, Math.PI);
      ctx.lineTo(cx - 85, cy - 125);
      ctx.lineTo(cx - 35, cy - 75);
      ctx.lineTo(cx, cy - 135);
      ctx.lineTo(cx + 35, cy - 75);
      ctx.lineTo(cx + 85, cy - 125);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'lotus': {
      ellipse(ctx, cx, cy - 35, 45, 115);
      ellipse(ctx, cx - 68, cy - 15, 40, 95, -0.45);
      ellipse(ctx, cx + 68, cy - 15, 40, 95, 0.45);
      ellipse(ctx, cx - 115, cy + 25, 34, 78, -0.9);
      ellipse(ctx, cx + 115, cy + 25, 34, 78, 0.9);
      ellipse(ctx, cx, cy + 110, 175, 28);
      break;
    }
    case 'leaf': {
      ellipse(ctx, cx, cy, 92, 165, 0.35);
      line(ctx, cx - 55, cy + 135, cx + 55, cy - 135);
      break;
    }
    case 'mountain': {
      poly(ctx, [[cx - 230, cy + 140], [cx - 60, cy - 110], [cx + 110, cy + 140]]);
      poly(ctx, [[cx - 10, cy + 140], [cx + 125, cy - 75], [cx + 250, cy + 140]]);
      circle(ctx, cx + 135, cy - 145, 46);
      break;
    }
    case 'waves': {
      [-70, 0, 70].forEach((dy) => {
        ctx.beginPath();
        for (let x = -220; x <= 220; x += 110) {
          ctx.arc(cx + x, cy + dy, 55, Math.PI, 0, false);
        }
        ctx.stroke();
      });
      break;
    }
    case 'mushroom': {
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 148, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeRect(cx - 46, cy - 10, 92, 170);
      circle(ctx, cx - 58, cy - 68, 22);
      circle(ctx, cx + 52, cy - 72, 24);
      circle(ctx, cx, cy - 112, 18);
      break;
    }
    case 'cactus': {
      ctx.strokeRect(cx - 38, cy - 135, 76, 300);
      ctx.strokeRect(cx - 138, cy - 55, 100, 54);
      ctx.strokeRect(cx - 138, cy - 115, 52, 60);
      ctx.strokeRect(cx + 38, cy - 25, 100, 54);
      ctx.strokeRect(cx + 86, cy - 95, 52, 70);
      break;
    }

    // --- VEHICLES & TOYS ---
    case 'car': {
      ctx.strokeRect(cx - 190, cy + 10, 380, 95);
      poly(ctx, [[cx - 125, cy + 10], [cx - 75, cy - 85], [cx + 85, cy - 85], [cx + 135, cy + 10]]);
      circle(ctx, cx - 105, cy + 115, 44);
      circle(ctx, cx + 105, cy + 115, 44);
      break;
    }
    case 'bus': {
      ctx.strokeRect(cx - 210, cy - 85, 420, 185);
      [-155, -55, 45, 145].forEach((wx) => ctx.strokeRect(cx + wx - 34, cy - 55, 68, 65));
      circle(ctx, cx - 125, cy + 115, 44);
      circle(ctx, cx + 125, cy + 115, 44);
      break;
    }
    case 'train': {
      ctx.strokeRect(cx - 165, cy - 45, 220, 145);
      ctx.strokeRect(cx + 55, cy - 105, 115, 205);
      ctx.strokeRect(cx - 125, cy - 115, 46, 70);
      circle(ctx, cx - 105, cy + 125, 42);
      circle(ctx, cx, cy + 125, 42);
      circle(ctx, cx + 112, cy + 125, 42);
      break;
    }
    case 'airplane': {
      ellipse(ctx, cx, cy, 195, 45);
      poly(ctx, [[cx - 45, cy - 25], [cx + 25, cy - 155], [cx + 65, cy - 155], [cx + 35, cy - 25]]);
      poly(ctx, [[cx - 45, cy + 25], [cx + 25, cy + 155], [cx + 65, cy + 155], [cx + 35, cy + 25]]);
      poly(ctx, [[cx - 175, cy - 15], [cx - 215, cy - 95], [cx - 165, cy - 95], [cx - 135, cy - 15]]);
      break;
    }
    case 'rocket': {
      ellipse(ctx, cx, cy - 10, 68, 155);
      poly(ctx, [[cx - 65, cy + 65], [cx - 125, cy + 165], [cx - 45, cy + 135]]);
      poly(ctx, [[cx + 65, cy + 65], [cx + 125, cy + 165], [cx + 45, cy + 135]]);
      circle(ctx, cx, cy - 42, 34);
      break;
    }
    case 'helicopter': {
      ellipse(ctx, cx - 25, cy + 25, 130, 72);
      line(ctx, cx + 105, cy + 18, cx + 225, cy + 18);
      line(ctx, cx - 25, cy - 48, cx - 25, cy - 95);
      line(ctx, cx - 190, cy - 95, cx + 145, cy - 95);
      line(ctx, cx - 110, cy + 125, cx + 70, cy + 125);
      break;
    }
    case 'bicycle': {
      circle(ctx, cx - 135, cy + 65, 68);
      circle(ctx, cx + 135, cy + 65, 68);
      poly(ctx, [[cx - 135, cy + 65], [cx - 20, cy + 65], [cx + 65, cy - 45], [cx - 55, cy - 45]]);
      line(ctx, cx + 135, cy + 65, cx + 52, cy - 85);
      break;
    }
    case 'boat': {
      poly(ctx, [[cx - 175, cy + 65], [cx + 175, cy + 65], [cx + 125, cy + 155], [cx - 125, cy + 155]]);
      line(ctx, cx, cy + 65, cx, cy - 165);
      poly(ctx, [[cx + 8, cy - 155], [cx + 145, cy + 35], [cx + 8, cy + 35]]);
      break;
    }
    case 'ship': {
      poly(ctx, [[cx - 210, cy + 35], [cx + 210, cy + 35], [cx + 160, cy + 145], [cx - 160, cy + 145]]);
      ctx.strokeRect(cx - 125, cy - 45, 250, 80);
      ctx.strokeRect(cx - 45, cy - 125, 42, 80);
      ctx.strokeRect(cx + 25, cy - 125, 42, 80);
      break;
    }
    case 'kite': {
      poly(ctx, [[cx, cy - 175], [cx + 125, cy - 35], [cx, cy + 125], [cx - 125, cy - 35]]);
      line(ctx, cx, cy - 175, cx, cy + 125);
      line(ctx, cx - 125, cy - 35, cx + 125, cy - 35);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 125);
      ctx.quadraticCurveTo(cx - 55, cy + 175, cx + 25, cy + 215);
      ctx.stroke();
      break;
    }
    case 'balloon': {
      ellipse(ctx, cx, cy - 45, 108, 134);
      poly(ctx, [[cx - 18, cy + 88], [cx + 18, cy + 88], [cx, cy + 108]]);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 108);
      ctx.quadraticCurveTo(cx + 35, cy + 165, cx - 15, cy + 215);
      ctx.stroke();
      break;
    }
    case 'teddy': {
      circle(ctx, cx, cy - 55, 78);
      circle(ctx, cx - 68, cy - 118, 30);
      circle(ctx, cx + 68, cy - 118, 30);
      ellipse(ctx, cx, cy + 85, 92, 98);
      ellipse(ctx, cx - 105, cy + 45, 34, 52, 0.4);
      ellipse(ctx, cx + 105, cy + 45, 34, 52, -0.4);
      cuteEyesAndSmile(ctx, cx, cy - 55, 28);
      break;
    }
    case 'ball': {
      circle(ctx, cx, cy, 148);
      poly(ctx, [[cx, cy - 46], [cx + 44, cy - 14], [cx + 28, cy + 38], [cx - 28, cy + 38], [cx - 44, cy - 14]]);
      line(ctx, cx, cy - 46, cx, cy - 148);
      line(ctx, cx + 44, cy - 14, cx + 140, cy - 45);
      line(ctx, cx - 44, cy - 14, cx - 140, cy - 45);
      break;
    }
    case 'drum': {
      ellipse(ctx, cx, cy - 75, 145, 45);
      ellipse(ctx, cx, cy + 85, 145, 45);
      line(ctx, cx - 145, cy - 75, cx - 145, cy + 85);
      line(ctx, cx + 145, cy - 75, cx + 145, cy + 85);
      line(ctx, cx - 95, cy - 40, cx, cy + 125);
      line(ctx, cx + 95, cy - 40, cx, cy + 125);
      break;
    }
    case 'robot': {
      ctx.strokeRect(cx - 85, cy - 145, 170, 115);
      ctx.strokeRect(cx - 105, cy - 15, 210, 165);
      line(ctx, cx, cy - 145, cx, cy - 195);
      circle(ctx, cx, cy - 208, 16);
      circle(ctx, cx - 38, cy - 95, 18);
      circle(ctx, cx + 38, cy - 95, 18);
      ctx.strokeRect(cx - 42, cy - 62, 84, 18);
      break;
    }
    case 'crown': {
      poly(ctx, [
        [cx - 165, cy + 105],
        [cx - 195, cy - 75],
        [cx - 85, cy + 10],
        [cx, cy - 125],
        [cx + 85, cy + 10],
        [cx + 195, cy - 75],
        [cx + 165, cy + 105],
      ]);
      circle(ctx, cx, cy + 45, 22);
      circle(ctx, cx - 95, cy + 52, 16);
      circle(ctx, cx + 95, cy + 52, 16);
      break;
    }
    case 'trophy': {
      ctx.beginPath();
      ctx.arc(cx, cy - 45, 108, 0, Math.PI);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeRect(cx - 22, cy + 63, 44, 72);
      ctx.strokeRect(cx - 88, cy + 135, 176, 42);
      break;
    }
    case 'castle': {
      ctx.strokeRect(cx - 165, cy - 25, 330, 190);
      ctx.strokeRect(cx - 195, cy - 115, 70, 280);
      ctx.strokeRect(cx + 125, cy - 115, 70, 280);
      poly(ctx, [[cx - 205, cy - 115], [cx - 160, cy - 195], [cx - 115, cy - 115]]);
      poly(ctx, [[cx + 115, cy - 115], [cx + 160, cy - 195], [cx + 205, cy - 115]]);
      ctx.beginPath();
      ctx.arc(cx, cy + 165, 52, Math.PI, 0);
      ctx.stroke();
      break;
    }

    // --- HOME, SHAPES & EVERYDAY ---
    case 'house': {
      poly(ctx, [[cx, cy - 175], [cx - 175, cy - 35], [cx + 175, cy - 35]]);
      ctx.strokeRect(cx - 140, cy - 35, 280, 200);
      ctx.strokeRect(cx - 35, cy + 55, 70, 110);
      ctx.strokeRect(cx - 110, cy + 5, 50, 50);
      ctx.strokeRect(cx + 60, cy + 5, 50, 50);
      break;
    }
    case 'tent': {
      poly(ctx, [[cx, cy - 155], [cx - 195, cy + 145], [cx + 195, cy + 145]]);
      poly(ctx, [[cx, cy - 25], [cx - 58, cy + 145], [cx + 58, cy + 145]]);
      break;
    }
    case 'lamp': {
      poly(ctx, [[cx - 85, cy - 150], [cx + 85, cy - 150], [cx + 135, cy - 10], [cx - 135, cy - 10]]);
      line(ctx, cx, cy - 10, cx, cy + 145);
      ctx.strokeRect(cx - 75, cy + 145, 150, 34);
      break;
    }
    case 'clock': {
      circle(ctx, cx, cy + 10, 145);
      circle(ctx, cx - 118, cy - 118, 42);
      circle(ctx, cx + 118, cy - 118, 42);
      line(ctx, cx, cy + 10, cx, cy - 82);
      line(ctx, cx, cy + 10, cx + 68, cy + 45);
      break;
    }
    case 'book': {
      ctx.strokeRect(cx - 185, cy - 125, 185, 250);
      ctx.strokeRect(cx, cy - 125, 185, 250);
      [-65, -20, 25, 70].forEach((dy) => {
        line(ctx, cx - 145, cy + dy, cx - 35, cy + dy);
        line(ctx, cx + 35, cy + dy, cx + 145, cy + dy);
      });
      break;
    }
    case 'pencil': {
      ctx.strokeRect(cx - 48, cy - 115, 96, 225);
      poly(ctx, [[cx - 48, cy + 110], [cx + 48, cy + 110], [cx, cy + 205]]);
      ctx.strokeRect(cx - 48, cy - 175, 96, 60);
      break;
    }
    case 'glasses': {
      circle(ctx, cx - 115, cy, 85);
      circle(ctx, cx + 115, cy, 85);
      line(ctx, cx - 30, cy, cx + 30, cy);
      break;
    }
    case 'hat': {
      ellipse(ctx, cx, cy + 85, 185, 36);
      ctx.strokeRect(cx - 98, cy - 125, 196, 200);
      line(ctx, cx - 98, cy + 35, cx + 98, cy + 35);
      break;
    }
    case 'gift': {
      ctx.strokeRect(cx - 135, cy - 45, 270, 210);
      ctx.strokeRect(cx - 155, cy - 105, 310, 60);
      line(ctx, cx, cy - 105, cx, cy + 165);
      ellipse(ctx, cx - 55, cy - 145, 48, 28, -0.3);
      ellipse(ctx, cx + 55, cy - 145, 48, 28, 0.3);
      break;
    }
    case 'heart': {
      heartPath(ctx, cx, cy, 165);
      break;
    }
    case 'star': {
      starPath(ctx, cx, cy, 175, 78);
      break;
    }
    case 'diamond': {
      poly(ctx, [[cx - 105, cy - 115], [cx + 105, cy - 115], [cx + 175, cy - 25], [cx, cy + 175], [cx - 175, cy - 25]]);
      line(ctx, cx - 175, cy - 25, cx + 175, cy - 25);
      break;
    }
    case 'triangle': {
      poly(ctx, [[cx, cy - 175], [cx - 190, cy + 145], [cx + 190, cy + 145]]);
      break;
    }
    case 'hexagon': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        pts.push([cx + Math.cos(a) * 165, cy + Math.sin(a) * 165]);
      }
      poly(ctx, pts);
      break;
    }
    case 'smiley': {
      circle(ctx, cx, cy, 162);
      cuteEyesAndSmile(ctx, cx, cy, 55);
      break;
    }
    case 'snowman': {
      circle(ctx, cx, cy + 95, 98);
      circle(ctx, cx, cy - 58, 72);
      circle(ctx, cx - 24, cy - 75, 9);
      circle(ctx, cx + 24, cy - 75, 9);
      poly(ctx, [[cx, cy - 55], [cx + 55, cy - 45], [cx, cy - 35]]);
      circle(ctx, cx, cy + 65, 10);
      circle(ctx, cx, cy + 108, 10);
      break;
    }
    default: {
      circle(ctx, cx, cy, 140);
      break;
    }
  }

  ctx.restore();
}
