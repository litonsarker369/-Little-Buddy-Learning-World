import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Eraser, Sparkles, Star } from 'lucide-react';
import { playPop, playSuccessChime, speakText } from '../utils/audioEngine';

interface MagicTracingPadProps {
  character: string;
  label: string;
  lang: 'bn' | 'en';
  voiceEnabled: boolean;
  onCompleteTrace: () => void;
}

const RAINBOW_COLORS = [
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#F97316',
];

export function MagicTracingPad({
  character,
  label,
  lang,
  voiceEnabled,
  onCompleteTrace,
}: MagicTracingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const strokesCountRef = useRef(0);
  const colorIdxRef = useRef(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle notebook grid lines
    ctx.save();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, h / 2);
    ctx.lineTo(w - 20, h / 2);
    ctx.stroke();
    ctx.restore();

    // Large faint dotted guide character (scaled for 1-3 chars like "100")
    const fontScale =
      character.length >= 3 ? 0.44 : character.length === 2 ? 0.56 : 0.68;
    ctx.save();
    ctx.font = `700 ${Math.round(h * fontScale)}px "Fredoka", "Hind Siliguri", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(character, w / 2, h / 2 + 6);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeText(character, w / 2, h / 2 + 6);
    ctx.restore();
  }, [character]);

  useEffect(() => {
    strokesCountRef.current = 0;
    setHasDrawn(false);
    setRewarded(false);
    drawGuide();
  }, [character, drawGuide]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    drawingRef.current = true;
    setHasDrawn(true);

    const color =
      RAINBOW_COLORS[Math.floor(colorIdxRef.current / 6) % RAINBOW_COLORS.length];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);

    colorIdxRef.current = (colorIdxRef.current + 1) % (RAINBOW_COLORS.length * 6);
    const color =
      RAINBOW_COLORS[Math.floor(colorIdxRef.current / 6) % RAINBOW_COLORS.length];

    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    strokesCountRef.current += 1;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const handleFinish = () => {
    if (!hasDrawn || rewarded) return;
    playSuccessChime();
    setRewarded(true);
    onCompleteTrace();
    const praise =
      lang === 'bn'
        ? `বাহ! খুব সুন্দর '${character}' লিখেছ!`
        : `Awesome writing! You traced ${character}!`;
    speakText(praise, lang, voiceEnabled);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>রংধনু পেন্সিলে হাত ঘুরিয়ে লেখো: {label}</span>
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            মাউস বা আঙুল দিয়ে দাগের ওপর দাগ টানো!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playPop();
            strokesCountRef.current = 0;
            setHasDrawn(false);
            setRewarded(false);
            drawGuide();
          }}
          className="min-h-[42px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Eraser className="w-4 h-4" />
          <span>মুছে আবার লেখো</span>
        </button>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={250}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full max-w-md h-[220px] sm:h-[250px] rounded-2xl border-2 border-dashed border-sky-300 bg-[#FFFDF7] touch-none cursor-crosshair"
        />
      </div>

      <div className="flex justify-center">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          disabled={!hasDrawn || rewarded}
          onClick={handleFinish}
          className={`min-h-[50px] px-7 rounded-2xl font-bold text-base inline-flex items-center gap-2 transition-colors ${
            rewarded
              ? 'bg-emerald-500 text-white cursor-default'
              : hasDrawn
              ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Star className="w-5 h-5 fill-current" />
          <span>{rewarded ? 'বাহ! তারা পেয়েছ!' : 'লেখা শেষ! তারা নাও'}</span>
        </motion.button>
      </div>
    </div>
  );
}
