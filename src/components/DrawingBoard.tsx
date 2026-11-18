import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Palette,
  Eraser,
  Undo2,
  Trash2,
  Download,
  Sparkles,
  Star,
  Brush,
  Rainbow,
} from 'lucide-react';
import { playPop, playSuccessChime, speakText } from '../utils/audioEngine';
import { MascotStage } from './MascotStage';
import { IMAGE_ASSETS, toBanglaDigits } from '../data/curriculum';
import {
  DRAWING_CATEGORIES,
  DRAWING_TEMPLATES,
  DrawingCategory,
  CANVAS_W,
  CANVAS_H,
  drawTemplateOutline,
} from '../data/drawingTemplates';

interface DrawingBoardProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  onCompleteDrawing: (drawingId: string) => void;
}

type BrushMode = 'solid' | 'rainbow' | 'sparkle' | 'eraser';

interface ColorOption {
  hex: string;
  nameBn: string;
  ringClass: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { hex: '#EF4444', nameBn: 'লাল', ringClass: 'ring-red-300' },
  { hex: '#F97316', nameBn: 'কমলা', ringClass: 'ring-orange-300' },
  { hex: '#EAB308', nameBn: 'হলুদ', ringClass: 'ring-yellow-300' },
  { hex: '#10B981', nameBn: 'সবুজ', ringClass: 'ring-emerald-300' },
  { hex: '#0EA5E9', nameBn: 'নীল', ringClass: 'ring-sky-300' },
  { hex: '#8B5CF6', nameBn: 'বেগুনি', ringClass: 'ring-violet-300' },
  { hex: '#EC4899', nameBn: 'গোলাপি', ringClass: 'ring-pink-300' },
  { hex: '#1E293B', nameBn: 'কালো', ringClass: 'ring-slate-300' },
];

const RAINBOW_HEXES = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#10B981',
  '#0EA5E9',
  '#8B5CF6',
  '#EC4899',
];

const BRUSH_SIZES = [
  { id: 'sm', label: 'ছোট', size: 8, dotClass: 'w-2.5 h-2.5' },
  { id: 'md', label: 'মাঝারি', size: 16, dotClass: 'w-4 h-4' },
  { id: 'lg', label: 'বড়', size: 28, dotClass: 'w-6 h-6' },
] as const;

const MAX_UNDO = 20;

function drawCanvasStarStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function DrawingBoard({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  onCompleteDrawing,
}: DrawingBoardProps) {
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const rainbowStepRef = useRef(0);
  const historyRef = useRef<ImageData[]>([]);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const [brushMode, setBrushMode] = useState<BrushMode>('solid');
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_OPTIONS[0]);
  const [brushSizeIdx, setBrushSizeIdx] = useState<number>(1);
  const [templateCategory, setTemplateCategory] = useState<DrawingCategory>('all');
  const [templateId, setTemplateId] = useState<string>('sun');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [drawingsCompleted, setDrawingsCompleted] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const visibleTemplates =
    templateCategory === 'all'
      ? DRAWING_TEMPLATES
      : DRAWING_TEMPLATES.filter((t) => t.category === templateCategory);
  const activeTemplate =
    DRAWING_TEMPLATES.find((t) => t.id === templateId) ?? DRAWING_TEMPLATES[0];

  const currentBrushSize = BRUSH_SIZES[brushSizeIdx]?.size ?? 16;

  // Render guide template cleanly on background guide canvas
  useEffect(() => {
    const guide = guideCanvasRef.current;
    if (!guide) return;
    const ctx = guide.getContext('2d');
    if (!ctx) return;
    drawTemplateOutline(ctx, templateId);
  }, [templateId]);

  const pushHistorySnapshot = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    historyRef.current.push(snap);
    if (historyRef.current.length > MAX_UNDO) {
      historyRef.current.shift();
    }
    setUndoCount(historyRef.current.length);
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    playPop();
    const prevSnap = historyRef.current.pop();
    if (prevSnap) {
      ctx.putImageData(prevSnap, 0, 0);
    }
    setUndoCount(historyRef.current.length);
    if (historyRef.current.length === 0) {
      setHasDrawn(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    playPop();
    pushHistorySnapshot();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    setHasDrawn(false);
  }, [pushHistorySnapshot]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? CANVAS_W / rect.width : 1;
    const scaleY = rect.height > 0 ? CANVAS_H / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    pushHistorySnapshot();
    const pt = getCanvasPoint(e);
    drawingRef.current = true;
    lastPosRef.current = pt;
    setHasDrawn(true);

    if (brushMode === 'sparkle') {
      const color =
        RAINBOW_HEXES[rainbowStepRef.current % RAINBOW_HEXES.length];
      rainbowStepRef.current += 1;
      drawCanvasStarStamp(ctx, pt.x, pt.y, currentBrushSize * 0.95, color);
      return;
    }

    ctx.save();
    if (brushMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else if (brushMode === 'rainbow') {
      ctx.fillStyle =
        RAINBOW_HEXES[Math.floor(rainbowStepRef.current / 5) % RAINBOW_HEXES.length];
    } else {
      ctx.fillStyle = selectedColor.hex;
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, currentBrushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasPoint(e);
    const prev = lastPosRef.current ?? pt;

    if (brushMode === 'sparkle') {
      const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      if (dist >= currentBrushSize * 1.45) {
        const color =
          RAINBOW_HEXES[rainbowStepRef.current % RAINBOW_HEXES.length];
        rainbowStepRef.current += 1;
        drawCanvasStarStamp(
          ctx,
          pt.x,
          pt.y,
          currentBrushSize * (0.75 + (rainbowStepRef.current % 3) * 0.18),
          color
        );
        lastPosRef.current = pt;
      }
      return;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = currentBrushSize;

    if (brushMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (brushMode === 'rainbow') {
      rainbowStepRef.current += 1;
      ctx.strokeStyle =
        RAINBOW_HEXES[Math.floor(rainbowStepRef.current / 5) % RAINBOW_HEXES.length];
    } else {
      ctx.strokeStyle = selectedColor.hex;
    }

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    lastPosRef.current = pt;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleSavePng = () => {
    const drawCanvas = drawCanvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    if (!drawCanvas) return;

    const out = document.createElement('canvas');
    out.width = CANVAS_W;
    out.height = CANVAS_H;
    const outCtx = out.getContext('2d');
    if (!outCtx) return;

    outCtx.fillStyle = '#FFFDF7';
    outCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (guideCanvas) outCtx.drawImage(guideCanvas, 0, 0);
    outCtx.drawImage(drawCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = `chotto-bondhu-art-${Date.now()}.png`;
    link.href = out.toDataURL('image/png');
    link.click();

    playSuccessChime();
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  };

  const handleFinishReward = () => {
    if (!hasDrawn) return;
    playSuccessChime();
    const nextNum = drawingsCompleted + 1;
    setDrawingsCompleted(nextNum);
    setCelebrating(true);
    onCompleteDrawing(`drawing-${Date.now()}`);
    void speakText(
      'ওয়াও! তুমি খুব সুন্দর ছবি এঁকেছ! তোমার জন্য একটি তারা!',
      'bn',
      voiceEnabledRef.current
    );
    window.setTimeout(() => setCelebrating(false), 1100);
  };

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
      if (/^[1-8]$/.test(e.key)) {
        const picked = COLOR_OPTIONS[Number(e.key) - 1];
        if (picked) {
          e.preventDefault();
          playPop();
          setSelectedColor(picked);
          setBrushMode('solid');
        }
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        playPop();
        setBrushMode('rainbow');
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        playPop();
        setBrushMode('eraser');
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        playPop();
        setBrushMode('solid');
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deviceMode, handleUndo]);

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={IMAGE_ASSETS.tigerMascot}
        fallbackEmoji="🐯"
        name="রং ও তুলির খাতা"
        speechBubble={
          brushMode === 'rainbow'
            ? 'রংধনু তুলি! হাত ঘোরালেই রঙিন জাদু হবে!'
            : brushMode === 'sparkle'
            ? 'তারা ব্রাশ! ক্লিক বা টানলেই ঝিকিমিকি তারা আঁকা হবে!'
            : brushMode === 'eraser'
            ? 'ইরেজার দিয়ে ভুল অংশ মুছে ফেলো!'
            : `রং: ${selectedColor.nameBn} · মনের আনন্দে সুন্দর ছবি আঁকো!`
        }
        isSpeaking={isSpeaking}
        celebrating={celebrating}
        onTap={() =>
          void speakText(
            'চলো রঙিন তুলি দিয়ে তোমার পছন্দের ছবি আঁকো!',
            'bn',
            voiceEnabledRef.current
          )
        }
      />

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
          <span>
            💻 ল্যাপটপ শর্টকাট: 1–8 রং বদলাবে · B ব্রাশ · R রংধনু · E ইরেজার · Z এক ধাপ পেছনে
          </span>
          <span className="text-amber-300 font-bold tabular-nums">
            আজ আঁকা ছবি: {toBanglaDigits(drawingsCompleted)} ★
          </span>
        </div>
      )}

      {/* Main Creative Drawing Studio */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 sm:p-6 shadow-sm space-y-4">
        {/* Top Tool Strip: Brushes + Sizes + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brush Modes */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                playPop();
                setBrushMode('solid');
              }}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                brushMode === 'solid'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Brush className="w-4 h-4" />
              <span>রঙিন তুলি</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPop();
                setBrushMode('rainbow');
              }}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                brushMode === 'rainbow'
                  ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-sky-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Rainbow className="w-4 h-4" />
              <span>রংধনু</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPop();
                setBrushMode('sparkle');
              }}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                brushMode === 'sparkle'
                  ? 'bg-violet-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>তারা স্টিকার</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPop();
                setBrushMode('eraser');
              }}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                brushMode === 'eraser'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>ইরেজার</span>
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
            {BRUSH_SIZES.map((sz, idx) => {
              const active = brushSizeIdx === idx;
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => {
                    playPop();
                    setBrushSizeIdx(idx);
                  }}
                  aria-label={`ব্রাশের আকার ${sz.label}`}
                  className={`min-h-[42px] px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:bg-white/70'
                  }`}
                >
                  <span
                    className={`rounded-full ${sz.dotClass}`}
                    style={{
                      backgroundColor:
                        brushMode === 'eraser' ? '#64748B' : selectedColor.hex,
                    }}
                  />
                  <span>{sz.label}</span>
                </button>
              );
            })}
          </div>

          {/* Undo / Clear / Save */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={undoCount === 0}
              onClick={handleUndo}
              className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                undoCount > 0
                  ? 'bg-white border-slate-200 hover:border-amber-300 text-slate-800 cursor-pointer'
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <span>পেছনে</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="min-h-[42px] px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>মুছো</span>
            </button>

            <button
              type="button"
              onClick={handleSavePng}
              className="min-h-[42px] px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{savedToast ? 'সেভ হয়েছে!' : 'ছবি সেভ'}</span>
            </button>
          </div>
        </div>

        {/* Color Swatches Row */}
        <div className="flex flex-wrap items-center gap-2.5 py-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-1">
            <Palette className="w-4 h-4 text-amber-500" />
            <span>রং বাছো:</span>
          </div>

          {COLOR_OPTIONS.map((c, idx) => {
            const isSelected =
              brushMode === 'solid' && selectedColor.hex === c.hex;
            return (
              <motion.button
                key={c.hex}
                type="button"
                whileTap={{ scale: 0.86 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => {
                  playPop();
                  setSelectedColor(c);
                  setBrushMode('solid');
                  void speakText(c.nameBn, 'bn', voiceEnabledRef.current);
                }}
                aria-label={`রং ${c.nameBn}`}
                className={`relative w-11 h-11 rounded-full border-4 cursor-pointer transition-transform flex items-center justify-center ${
                  isSelected
                    ? `border-slate-900 ring-4 ${c.ringClass} scale-110`
                    : 'border-white shadow-sm'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {deviceMode === 'laptop' && (
                  <span className="text-[10px] font-bold text-white drop-shadow-xs">
                    {idx + 1}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Dual-Layer Drawing Surface (Guide Underlay + Interactive Stroke Canvas) */}
        <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl border-4 border-dashed border-sky-200 bg-[#FFFDF7] overflow-hidden shadow-inner">
          <canvas
            ref={guideCanvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <canvas
            ref={drawCanvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative z-10 w-full h-full touch-none cursor-crosshair"
          />
        </div>

        {/* Collect Star & 100+ Coloring Templates Gallery */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span>🎨 রং করার ছবি বাছো ({toBanglaDigits(DRAWING_TEMPLATES.length)}টি ছবি):</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {activeTemplate.emoji} {activeTemplate.label}
              </span>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              disabled={!hasDrawn}
              onClick={handleFinishReward}
              className={`min-h-[48px] px-6 rounded-2xl font-bold text-base inline-flex items-center gap-2 transition-colors ${
                hasDrawn
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Star className="w-5 h-5 fill-current" />
              <span>আঁকা শেষ! ★ নাও</span>
            </motion.button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DRAWING_CATEGORIES.map((cat) => {
              const active = templateCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? DRAWING_TEMPLATES.length
                  : DRAWING_TEMPLATES.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playPop();
                    setTemplateCategory(cat.id);
                  }}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700'
                  }`}
                >
                  {cat.label} ({toBanglaDigits(count)})
                </button>
              );
            })}
          </div>

          {/* Scrollable 100+ Template Picker Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto pr-1 py-1">
            {visibleTemplates.map((tpl) => {
              const active = templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    playPop();
                    setTemplateId(tpl.id);
                    void speakText(tpl.label, 'bn', voiceEnabledRef.current);
                  }}
                  className={`min-h-[64px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors ${
                    active
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-800'
                  }`}
                >
                  <span className="text-2xl leading-none">{tpl.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight line-clamp-1">
                    {tpl.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
