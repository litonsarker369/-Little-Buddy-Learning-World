import { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Puzzle,
  RotateCcw,
  Volume2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  Lightbulb,
} from 'lucide-react';
import {
  JIGSAW_PUZZLES,
  JigsawPuzzleItem,
  IMAGE_ASSETS,
  toBanglaDigits,
} from '../data/curriculum';
import {
  playPop,
  playBubblePop,
  playSuccessChime,
  playSoftTryAgain,
  speakText,
  stopSpeaking,
} from '../utils/audioEngine';
import { MascotStage } from './MascotStage';

type CategoryFilter = 'all' | 'animal' | 'fruit';
type GridSize = 2 | 3;

interface PuzzlePieceDef {
  id: number;
  row: number;
  col: number;
  top: -1 | 0 | 1;
  right: -1 | 0 | 1;
  bottom: -1 | 0 | 1;
  left: -1 | 0 | 1;
  path: string;
}

interface DragState {
  pieceId: number;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  isDragging: boolean;
}

interface JigsawPuzzlePlaygroundProps {
  deviceMode: 'laptop' | 'mobile';
  voiceEnabled: boolean;
  isSpeaking: boolean;
  masteredIds: string[];
  onExplorePuzzle: (puzzle: JigsawPuzzleItem) => void;
  onCompletePuzzle: (puzzle: JigsawPuzzleItem, starsEarned: number) => void;
}

function buildPiecePath(
  top: -1 | 0 | 1,
  right: -1 | 0 | 1,
  bottom: -1 | 0 | 1,
  left: -1 | 0 | 1
): string {
  const parts: string[] = ['M 0 0'];

  // Top edge: (0,0) -> (100,0)
  if (top === 0) {
    parts.push('L 100 0');
  } else {
    const d = -top * 18;
    const n = -top * 8;
    parts.push(
      `L 35 0 C 35 ${n}, 27 ${d}, 50 ${d} C 73 ${d}, 65 ${n}, 65 0 L 100 0`
    );
  }

  // Right edge: (100,0) -> (100,100)
  if (right === 0) {
    parts.push('L 100 100');
  } else {
    const d = right * 18;
    const n = right * 8;
    parts.push(
      `L 100 35 C ${100 + n} 35, ${100 + d} 27, ${100 + d} 50 C ${100 + d} 73, ${
        100 + n
      } 65, 100 65 L 100 100`
    );
  }

  // Bottom edge: (100,100) -> (0,100)
  if (bottom === 0) {
    parts.push('L 0 100');
  } else {
    const d = bottom * 18;
    const n = bottom * 8;
    parts.push(
      `L 65 100 C 65 ${100 + n}, 73 ${100 + d}, 50 ${100 + d} C 27 ${
        100 + d
      }, 35 ${100 + n}, 35 100 L 0 100`
    );
  }

  // Left edge: (0,100) -> (0,0)
  if (left === 0) {
    parts.push('L 0 0');
  } else {
    const d = -left * 18;
    const n = -left * 8;
    parts.push(
      `L 0 65 C ${n} 65, ${d} 73, ${d} 50 C ${d} 27, ${n} 35, 0 35 L 0 0`
    );
  }

  parts.push('Z');
  return parts.join(' ');
}

function generatePieces(gridSize: GridSize): PuzzlePieceDef[] {
  const pieces: PuzzlePieceDef[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const top: -1 | 0 | 1 =
        r === 0 ? 0 : (((r - 1 + c) % 2 === 0 ? -1 : 1) as -1 | 1);
      const bottom: -1 | 0 | 1 =
        r === gridSize - 1 ? 0 : (((r + c) % 2 === 0 ? 1 : -1) as -1 | 1);
      const left: -1 | 0 | 1 =
        c === 0 ? 0 : (((r + c - 1) % 2 === 0 ? -1 : 1) as -1 | 1);
      const right: -1 | 0 | 1 =
        c === gridSize - 1 ? 0 : (((r + c) % 2 === 0 ? 1 : -1) as -1 | 1);

      pieces.push({
        id: r * gridSize + c,
        row: r,
        col: c,
        top,
        right,
        bottom,
        left,
        path: buildPiecePath(top, right, bottom, left),
      });
    }
  }
  return pieces;
}

function shuffleOrder(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function PuzzlePieceSvg({
  piece,
  gridSize,
  imageUrl,
  uidPrefix,
  strokeColor = 'rgba(255,255,255,0.9)',
  strokeWidth = 2.6,
  className = '',
}: {
  piece: PuzzlePieceDef;
  gridSize: GridSize;
  imageUrl: string;
  uidPrefix: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const clipId = `${uidPrefix}-piece-${gridSize}-${piece.id}`;
  return (
    <svg
      viewBox="-20 -20 140 140"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={piece.path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="-25" y="-25" width="150" height="150" fill="#FFFDF7" />
        <image
          href={imageUrl}
          x={-piece.col * 100}
          y={-piece.row * 100}
          width={gridSize * 100}
          height={gridSize * 100}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      <path
        d={piece.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function JigsawPuzzlePlayground({
  deviceMode,
  voiceEnabled,
  isSpeaking,
  masteredIds,
  onExplorePuzzle,
  onCompletePuzzle,
}: JigsawPuzzlePlaygroundProps) {
  const uidPrefix = useId().replace(/:/g, '');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [gridSize, setGridSize] = useState<GridSize>(2);
  const [showHintGhost, setShowHintGhost] = useState(true);

  const [placedIds, setPlacedIds] = useState<number[]>([]);
  const [trayOrder, setTrayOrder] = useState<number[]>(() => shuffleOrder(4));
  const [selectedTrayPieceId, setSelectedTrayPieceId] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const [wrongNotice, setWrongNotice] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const filteredPuzzles = useMemo(() => {
    if (filter === 'all') return JIGSAW_PUZZLES;
    return JIGSAW_PUZZLES.filter((p) => p.category === filter);
  }, [filter]);

  const activePuzzle = filteredPuzzles[selectedIndex] ?? filteredPuzzles[0];
  const pieces = useMemo(() => generatePieces(gridSize), [gridSize]);

  const resetPuzzleBoard = useCallback(
    (nextGrid: GridSize = gridSize) => {
      setPlacedIds([]);
      setTrayOrder(shuffleOrder(nextGrid * nextGrid));
      setSelectedTrayPieceId(null);
      setDragState(null);
      setHoveredSlotId(null);
      setWrongNotice(false);
      setCompleted(false);
      setCelebrating(false);
    },
    [gridSize]
  );

  // Reset board whenever puzzle or difficulty changes
  useEffect(() => {
    resetPuzzleBoard(gridSize);
  }, [activePuzzle?.id, gridSize, resetPuzzleBoard]);

  const handleSelectPuzzle = useCallback(
    (idx: number) => {
      playPop();
      stopSpeaking();
      const target = filteredPuzzles[idx];
      if (!target) return;
      setSelectedIndex(idx);
      onExplorePuzzle(target);
      void speakText(
        target.lang === 'bn'
          ? `${target.titleBn}! চলো টুকরোগুলো মিলিয়ে ছবি বানাই!`
          : `Let us build the ${target.titleEn} puzzle!`,
        target.lang,
        voiceEnabledRef.current
      );
    },
    [filteredPuzzles, onExplorePuzzle]
  );

  const placePieceOnBoard = useCallback(
    (pieceId: number) => {
      if (!activePuzzle || placedIds.includes(pieceId)) return;
      playBubblePop();
      const nextPlaced = [...placedIds, pieceId];
      setPlacedIds(nextPlaced);
      setTrayOrder((prev) => prev.filter((id) => id !== pieceId));
      setSelectedTrayPieceId(null);
      setWrongNotice(false);

      if (nextPlaced.length === gridSize * gridSize) {
        setCompleted(true);
        setCelebrating(true);
        playSuccessChime();
        const stars = gridSize === 3 ? 2 : 1;
        onCompletePuzzle(activePuzzle, stars);
        void speakText(
          activePuzzle.completionVoice,
          activePuzzle.lang,
          voiceEnabledRef.current
        );
        window.setTimeout(() => setCelebrating(false), 1200);
      }
    },
    [activePuzzle, gridSize, onCompletePuzzle, placedIds]
  );

  const triggerGentleMismatch = useCallback(() => {
    playSoftTryAgain();
    setWrongNotice(true);
    window.setTimeout(() => setWrongNotice(false), 950);
  }, []);

  const getSlotIdAtPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const board = boardRef.current;
      if (!board) return null;
      const rect = board.getBoundingClientRect();
      // Slightly generous margin (16px) around edges for toddler fingers
      if (
        clientX < rect.left - 16 ||
        clientX > rect.right + 16 ||
        clientY < rect.top - 16 ||
        clientY > rect.bottom + 16
      ) {
        return null;
      }
      const relX = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
      const relY = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));
      const col = Math.min(gridSize - 1, Math.floor((relX / rect.width) * gridSize));
      const row = Math.min(gridSize - 1, Math.floor((relY / rect.height) * gridSize));
      return row * gridSize + col;
    },
    [gridSize]
  );

  // Global pointer drag & drop handlers
  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      const isNowDragging = dragState.isDragging || dist >= 6;
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              isDragging: isNowDragging,
            }
          : null
      );
      if (isNowDragging) {
        setHoveredSlotId(getSlotIdAtPoint(e.clientX, e.clientY));
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const movedDist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      const pieceId = dragState.pieceId;

      if (!dragState.isDragging && movedDist < 6) {
        // Treated as clean tap/click to select tray piece
        playPop();
        setSelectedTrayPieceId((prev) => (prev === pieceId ? null : pieceId));
      } else {
        const dropSlot = getSlotIdAtPoint(e.clientX, e.clientY);
        if (dropSlot === pieceId) {
          placePieceOnBoard(pieceId);
        } else if (dropSlot !== null) {
          triggerGentleMismatch();
        }
      }

      setDragState(null);
      setHoveredSlotId(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [dragState, getSlotIdAtPoint, placePieceOnBoard, triggerGentleMismatch]);

  const handleSlotTap = (slotId: number) => {
    if (selectedTrayPieceId === null || placedIds.includes(slotId)) return;
    if (selectedTrayPieceId === slotId) {
      placePieceOnBoard(slotId);
    } else {
      triggerGentleMismatch();
    }
  };

  const handleSmartHint = () => {
    const remaining = trayOrder.filter((id) => !placedIds.includes(id));
    if (remaining.length === 0) return;
    const nextId = remaining[0];
    placePieceOnBoard(nextId);
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
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSelectPuzzle((selectedIndex + 1) % filteredPuzzles.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSelectPuzzle(
          (selectedIndex - 1 + filteredPuzzles.length) % filteredPuzzles.length
        );
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playPop();
        resetPuzzleBoard(gridSize);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deviceMode, filteredPuzzles.length, gridSize, handleSelectPuzzle, resetPuzzleBoard, selectedIndex]);

  if (!activePuzzle) return null;

  const totalPieces = gridSize * gridSize;
  const remainingPieces = trayOrder
    .filter((id) => !placedIds.includes(id))
    .map((id) => pieces[id])
    .filter(Boolean);
  const draggedPiece = dragState?.isDragging ? pieces[dragState.pieceId] : null;

  return (
    <div className="space-y-5">
      <MascotStage
        imageSrc={
          activePuzzle.category === 'animal'
            ? IMAGE_ASSETS.tigerMascot
            : IMAGE_ASSETS.elephantMath
        }
        fallbackEmoji={activePuzzle.emoji}
        name="মজার জিগস পাজল (Jigsaw Puzzle)"
        speechBubble={
          completed
            ? `বাহ! পুরো ${activePuzzle.titleBn} (${activePuzzle.titleEn}) মিলে গেছে!`
            : wrongNotice
            ? 'আরেকটি ঘরে বসিয়ে দেখো, সোনা! তুমি পারবে!'
            : `টুকরোগুলো টেনে এনে '${activePuzzle.titleBn}' ছবিটি তৈরি করো!`
        }
        isSpeaking={isSpeaking}
        celebrating={celebrating}
        onTap={() =>
          void speakText(
            completed
              ? activePuzzle.completionVoice
              : `${activePuzzle.titleBn}! ${activePuzzle.letterCue}`,
            activePuzzle.lang,
            voiceEnabledRef.current
          )
        }
      />

      {/* Filter & Difficulty Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border-2 border-amber-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              setFilter('all');
              setSelectedIndex(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            সব পাজল ({toBanglaDigits(JIGSAW_PUZZLES.length)})
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              setFilter('animal');
              setSelectedIndex(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'animal'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🐯 পশুপাখি (Animals)
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              setFilter('fruit');
              setSelectedIndex(0);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'fruit'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            🍎 ফলমূল (Fruits)
          </button>
        </div>

        {/* 2x2 vs 3x3 Size Selector */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-sky-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playPop();
              setGridSize(2);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              gridSize === 2
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            সহজ (২×২)
          </button>
          <button
            type="button"
            onClick={() => {
              playPop();
              setGridSize(3);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
              gridSize === 3
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            বড় (৩×৩ · ★২)
          </button>
        </div>
      </div>

      {deviceMode === 'laptop' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-2 text-xs font-semibold">
          💻 মাউস দিয়ে টুকরো টেনে (Drag & Drop) সঠিক ঘরে বসাও অথবা টুকরোয় ক্লিক করে ঘরে ক্লিক করো · ← → পাজল বদলাও
        </div>
      )}

      {/* Main Jigsaw Workspace */}
      <section
        aria-label={activePuzzle.titleBn}
        className={`rounded-3xl border-2 ${activePuzzle.accentBorder} ${activePuzzle.accentBg} p-4 sm:p-7 shadow-sm space-y-5`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white border-2 border-white shadow-xs flex items-center justify-center text-3xl">
              {activePuzzle.emoji}
            </span>
            <div>
              <div className="text-xs font-bold text-slate-600">
                {activePuzzle.letterCue}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {activePuzzle.titleBn} ({activePuzzle.titleEn})
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playPop();
                setShowHintGhost((v) => !v);
              }}
              className={`min-h-[44px] px-3.5 rounded-xl border-2 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                showHintGhost
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {showHintGhost ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span>ছায়া ছবি</span>
            </button>

            {!completed && (
              <button
                type="button"
                onClick={handleSmartHint}
                className="min-h-[44px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lightbulb className="w-4 h-4" />
                <span>সাহায্য</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playPop();
                resetPuzzleBoard(gridSize);
              }}
              className="min-h-[44px] px-3.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>নতুন করে</span>
            </button>
          </div>
        </div>

        {/* Progress Counter */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 px-1">
          <span>
            মেলানো হয়েছে: {toBanglaDigits(placedIds.length)} /{' '}
            {toBanglaDigits(totalPieces)} টুকরো
          </span>
          {selectedTrayPieceId !== null && !completed && (
            <span className="text-indigo-700 animate-pulse">
              এবার বাম দিকের সঠিক খালি ঘরে ট্যাপ করো!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Drop Board */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <motion.div
              ref={boardRef}
              animate={
                completed
                  ? { scale: [1, 1.05, 1.03] }
                  : wrongNotice
                  ? { x: [0, -7, 7, -5, 5, 0] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45 }}
              className={`relative w-full max-w-[340px] sm:max-w-[380px] aspect-square rounded-3xl border-4 bg-white shadow-lg overflow-hidden select-none ${
                completed
                  ? 'border-emerald-400 shadow-2xl'
                  : wrongNotice
                  ? 'border-amber-400'
                  : 'border-white'
              }`}
            >
              {/* Faint Ghost Reference Image */}
              {showHintGhost && !completed && (
                <img
                  src={activePuzzle.imageUrl}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                />
              )}

              {/* Grid Slots */}
              <div
                className="relative w-full h-full grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                }}
              >
                {pieces.map((piece) => {
                  const isPlaced = placedIds.includes(piece.id);
                  const isHovered = hoveredSlotId === piece.id && !isPlaced;
                  return (
                    <div
                      key={piece.id}
                      onClick={() => handleSlotTap(piece.id)}
                      className={`relative border border-dashed transition-colors ${
                        isPlaced
                          ? 'border-transparent'
                          : isHovered
                          ? 'border-amber-500 bg-amber-200/45'
                          : selectedTrayPieceId !== null
                          ? 'border-indigo-300/80 bg-white/25 hover:bg-indigo-100/40 cursor-pointer'
                          : 'border-slate-300/75 bg-white/15'
                      }`}
                    >
                      {!isPlaced && (
                        <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold text-slate-400/70 pointer-events-none select-none tabular-nums">
                          {toBanglaDigits(piece.id + 1)}
                        </span>
                      )}

                      {isPlaced && !completed && (
                        <motion.div
                          initial={{ scale: 1.15, opacity: 0.6 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                          className="absolute inset-0 pointer-events-none z-10"
                        >
                          <PuzzlePieceSvg
                            piece={piece}
                            gridSize={gridSize}
                            imageUrl={activePuzzle.imageUrl}
                            uidPrefix={`${uidPrefix}-board`}
                            className="absolute -inset-[20%] w-[140%] h-[140%] overflow-visible drop-shadow-xs"
                          />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Seamless Full Photo Overlay upon Completion */}
              <AnimatePresence>
                {completed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 cursor-pointer"
                    onClick={() =>
                      void speakText(
                        activePuzzle.completionVoice,
                        activePuzzle.lang,
                        voiceEnabledRef.current
                      )
                    }
                  >
                    <img
                      src={activePuzzle.imageUrl}
                      alt={activePuzzle.titleBn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right: Draggable Puzzle Pieces Tray OR Completion Celebration */}
          <div className="lg:col-span-6">
            {!completed ? (
              <div className="bg-white/90 rounded-3xl border-2 border-white p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <Puzzle className="w-4 h-4 text-amber-600" />
                    <span>টুকরোগুলো টেনে বসাও:</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    বাকি {toBanglaDigits(remainingPieces.length)}টি
                  </span>
                </div>

                <div
                  className={`grid gap-3 justify-items-center ${
                    gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3'
                  }`}
                >
                  {remainingPieces.map((piece) => {
                    const isBeingDragged =
                      dragState?.isDragging && dragState.pieceId === piece.id;
                    const isSelected = selectedTrayPieceId === piece.id;
                    return (
                      <motion.div
                        key={piece.id}
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          setDragState({
                            pieceId: piece.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            clientX: e.clientX,
                            clientY: e.clientY,
                            isDragging: false,
                          });
                        }}
                        className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-all ${
                          isBeingDragged
                            ? 'opacity-25 scale-90'
                            : isSelected
                            ? 'bg-indigo-50 ring-4 ring-indigo-400 shadow-md'
                            : 'bg-slate-50 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-300 shadow-xs'
                        }`}
                      >
                        <PuzzlePieceSvg
                          piece={piece}
                          gridSize={gridSize}
                          imageUrl={activePuzzle.imageUrl}
                          uidPrefix={`${uidPrefix}-tray`}
                          strokeColor="rgba(255,255,255,0.95)"
                          strokeWidth={3}
                          className="w-full h-full drop-shadow-sm pointer-events-none"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border-2 border-emerald-400 p-6 text-center shadow-md space-y-4"
              >
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>পাজল সম্পূর্ণ হয়েছে! +{toBanglaDigits(gridSize === 3 ? 2 : 1)} স্টার ★</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                  {activePuzzle.emoji} বাহ! দারুণ করেছ!
                </h3>
                <p className="text-sm sm:text-base font-bold text-emerald-800 leading-relaxed">
                  {activePuzzle.completionVoice}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      void speakText(
                        activePuzzle.completionVoice,
                        activePuzzle.lang,
                        voiceEnabledRef.current
                      )
                    }
                    className="min-h-[48px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>আবার শোনো</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSelectPuzzle((selectedIndex + 1) % filteredPuzzles.length)
                    }
                    className="min-h-[48px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>পরের পাজল খেলো</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Floating Drag Ghost Layer */}
      {draggedPiece && dragState && (
        <div
          style={{
            left: dragState.clientX,
            top: dragState.clientY,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 z-50 pointer-events-none select-none scale-110"
        >
          <PuzzlePieceSvg
            piece={draggedPiece}
            gridSize={gridSize}
            imageUrl={activePuzzle.imageUrl}
            uidPrefix={`${uidPrefix}-drag`}
            strokeColor="#f59e0b"
            strokeWidth={3.5}
            className="w-full h-full drop-shadow-2xl"
          />
        </div>
      )}

      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            handleSelectPuzzle(
              (selectedIndex - 1 + filteredPuzzles.length) % filteredPuzzles.length
            )
          }
          className="min-h-[48px] px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>আগের পাজল</span>
        </button>

        <div className="text-sm font-bold text-slate-600 tabular-nums">
          {toBanglaDigits(selectedIndex + 1)} / {toBanglaDigits(filteredPuzzles.length)}
        </div>

        <button
          type="button"
          onClick={() =>
            handleSelectPuzzle((selectedIndex + 1) % filteredPuzzles.length)
          }
          className="min-h-[48px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>পরের পাজল</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Puzzle Picker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredPuzzles.map((puzzle, idx) => {
          const isSelected = idx === selectedIndex;
          const isMastered = masteredIds.includes(puzzle.id);
          return (
            <motion.button
              key={puzzle.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
              onClick={() => handleSelectPuzzle(idx)}
              className={`relative rounded-2xl border-2 p-3 text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-300 text-slate-900'
              }`}
            >
              <span className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={puzzle.imageUrl}
                  alt={puzzle.titleBn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold opacity-85 truncate">
                  {puzzle.category === 'animal' ? 'পশুপাখি' : 'ফলমূল'}
                </div>
                <div className="font-bold text-sm leading-tight truncate">
                  {puzzle.titleBn}
                </div>
              </div>
              {isMastered && !isSelected && (
                <CheckCircle2
                  className="w-4 h-4 text-emerald-500 absolute top-1.5 right-1.5"
                  aria-label="সম্পূর্ণ হয়েছে"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
