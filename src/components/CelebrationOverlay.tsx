import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Gift, Sparkles } from 'lucide-react';
import { AnimalSticker } from '../data/curriculum';

interface CelebrationOverlayProps {
  confettiTrigger: number;
  starRainTrigger?: number;
  milestoneTitle?: string;
  unlockedSticker: AnimalSticker | null;
  onDismissSticker: () => void;
}

type ParticleShape = 'star' | 'sparkle' | 'circle' | 'ribbon';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  vRot: number;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  twinklePhase: number;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

interface StarRainDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  maxVy: number;
  gravity: number;
  size: number;
  depth: number; // 0.35 (distant) -> 1.35 (foreground)
  color: string;
  rimColor: string;
  glowColor: string;
  rotZ: number;
  vRotZ: number;
  flipPhase: number;
  vFlip: number;
  swayPhase: number;
  swaySpeed: number;
  twinklePhase: number;
  alpha: number;
  isSparkle: boolean;
}

const MAGICAL_PALETTE = [
  '#F59E0B', // warm gold
  '#FBBF24', // sunny amber
  '#FDE047', // bright star yellow
  '#10B981', // emerald
  '#38BDF8', // sky blue
  '#FB7185', // rose pink
  '#A78BFA', // soft lavender
  '#FB923C', // tangerine
];

const STAR_RAIN_THEMES = [
  { color: '#FDE047', rim: '#D97706', glow: '#FBBF24' }, // Radiant Gold
  { color: '#FBBF24', rim: '#B45309', glow: '#F59E0B' }, // Warm Amber Gold
  { color: '#FEF08A', rim: '#CA8A04', glow: '#FDE047' }, // Sunbeam Yellow
  { color: '#7DD3FC', rim: '#0284C7', glow: '#38BDF8' }, // Celestial Sky
  { color: '#F9A8D4', rim: '#DB2777', glow: '#F472B6' }, // Starlight Rose
  { color: '#C4B5FD', rim: '#7C3AED', glow: '#A78BFA' }, // Nebula Violet
  { color: '#6EE7B7', rim: '#059669', glow: '#34D399' }, // Mint Stardust
];

function drawFivePointStar(ctx: CanvasRenderingContext2D, r: number) {
  const spikes = 5;
  const innerRadius = r * 0.46;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const px = Math.cos(angle) * rad;
    const py = Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawFourPointSparkle(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r);
  ctx.closePath();
  ctx.fill();
}

function spawnExplosion(
  particles: Particle[],
  rings: ShockwaveRing[],
  originX: number,
  originY: number,
  count: number,
  powerScale = 1
) {
  const shapes: ParticleShape[] = ['star', 'sparkle', 'circle', 'ribbon'];

  rings.push({
    x: originX,
    y: originY,
    radius: 10,
    maxRadius: 190 * powerScale,
    alpha: 0.85,
    color: '#FBBF24',
    lineWidth: 5,
  });
  rings.push({
    x: originX,
    y: originY,
    radius: 4,
    maxRadius: 130 * powerScale,
    alpha: 0.7,
    color: '#38BDF8',
    lineWidth: 3,
  });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const speed = (3.5 + Math.random() * 9.5) * powerScale;
    const shape =
      i % 3 === 0 ? 'star' : shapes[Math.floor(Math.random() * shapes.length)];
    particles.push({
      x: originX + (Math.random() - 0.5) * 14,
      y: originY + (Math.random() - 0.5) * 14,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.4 * powerScale,
      size:
        shape === 'star'
          ? 7 + Math.random() * 8
          : shape === 'sparkle'
          ? 6 + Math.random() * 7
          : 4 + Math.random() * 5,
      color: MAGICAL_PALETTE[Math.floor(Math.random() * MAGICAL_PALETTE.length)],
      shape,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.22,
      alpha: 1,
      decay: 0.011 + Math.random() * 0.008,
      gravity: 0.14 + Math.random() * 0.08,
      drag: 0.965,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
}

function spawnStarRainWave(
  rainStars: StarRainDrop[],
  width: number,
  count: number,
  waveIndex: number
) {
  for (let i = 0; i < count; i++) {
    // Bias slightly toward gold/amber stars for classic magical star rain
    const themeRoll = Math.random();
    const theme =
      themeRoll < 0.62
        ? STAR_RAIN_THEMES[Math.floor(Math.random() * 3)]
        : STAR_RAIN_THEMES[3 + Math.floor(Math.random() * (STAR_RAIN_THEMES.length - 3))];

    const depth = 0.38 + Math.random() * 0.97; // 0.38 (far) .. 1.35 (near)
    const isSparkle = Math.random() < 0.16;

    // Distribute horizontally with gentle cascade stagger across waves
    const laneProgress = (i + Math.random() * 0.85) / count;
    const cascadeBias = (waveIndex % 2 === 0 ? 0.03 : -0.03) * width;
    const x = Math.max(
      12,
      Math.min(width - 12, laneProgress * width + cascadeBias)
    );

    const baseSize = isSparkle ? 7 + Math.random() * 6 : 11 + Math.random() * 11;
    const size = baseSize * (0.55 + depth * 0.65);

    rainStars.push({
      x,
      y: -25 - Math.random() * 110,
      vx: (Math.random() - 0.5) * 0.9 * depth,
      vy: (2.6 + Math.random() * 2.8) * (0.55 + depth * 0.7),
      maxVy: (6.4 + Math.random() * 3.4) * (0.6 + depth * 0.65),
      gravity: (0.045 + Math.random() * 0.035) * depth,
      size,
      depth,
      color: theme.color,
      rimColor: theme.rim,
      glowColor: theme.glow,
      rotZ: Math.random() * Math.PI * 2,
      vRotZ: (Math.random() - 0.5) * 0.055,
      flipPhase: Math.random() * Math.PI * 2,
      vFlip: 0.045 + Math.random() * 0.065,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.035 + Math.random() * 0.035,
      twinklePhase: Math.random() * Math.PI * 2,
      alpha: Math.min(1, 0.58 + depth * 0.42),
      isSparkle,
    });
  }

  // Sort back-to-front by depth so foreground stars cleanly overlap distant stars
  rainStars.sort((a, b) => a.depth - b.depth);
}

export function CelebrationOverlay({
  confettiTrigger,
  starRainTrigger = 0,
  milestoneTitle,
  unlockedSticker,
  onDismissSticker,
}: CelebrationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ringsRef = useRef<ShockwaveRing[]>([]);
  const rainStarsRef = useRef<StarRainDrop[]>([]);
  const rafIdRef = useRef<number>(0);
  const sizeRef = useRef<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [burstVisible, setBurstVisible] = useState(false);
  const [rainCanvasVisible, setRainCanvasVisible] = useState(false);
  const [rainBannerVisible, setRainBannerVisible] = useState(false);

  const burstHideTimerRef = useRef<number | null>(null);
  const rainHideTimerRef = useRef<number | null>(null);
  const rainBannerTimerRef = useRef<number | null>(null);
  const extraTimersRef = useRef<number[]>([]);

  const ensureCanvasReady = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeRef.current = { width, height };
    return ctx;
  }, []);

  const ensureRenderLoop = useCallback(() => {
    if (rafIdRef.current !== 0) return;

    const render = () => {
      const ctx = ensureCanvasReady();
      if (!ctx) {
        rafIdRef.current = 0;
        return;
      }

      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);

      const rainStars = rainStarsRef.current;
      const rings = ringsRef.current;
      const particles = particlesRef.current;

      // 1. 3D-like Cascading Star Rain (drawn back-to-front by depth)
      for (let i = rainStars.length - 1; i >= 0; i--) {
        const star = rainStars[i];
        star.vy = Math.min(star.maxVy, star.vy + star.gravity);
        star.swayPhase += star.swaySpeed;
        star.x += star.vx + Math.sin(star.swayPhase) * 0.72 * star.depth;
        star.y += star.vy;
        star.rotZ += star.vRotZ;
        star.flipPhase += star.vFlip;
        star.twinklePhase += 0.16;

        // Smooth fade out as stars reach the bottom edge
        if (star.y > height * 0.84) {
          star.alpha -= 0.035;
        }

        if (star.y > height + star.size * 3 || star.alpha <= 0.01) {
          rainStars.splice(i, 1);
          continue;
        }

        const cosFlip = Math.cos(star.flipPhase);
        const sinFlip = Math.sin(star.flipPhase);
        // Clamp horizontal foreshortening so stars retain crisp 3D volume edge-on
        const scaleX = Math.max(0.16, Math.abs(cosFlip));
        const scaleY = 0.86 + 0.14 * Math.abs(Math.sin(star.flipPhase * 0.5));
        const twinkle = 0.84 + 0.16 * Math.sin(star.twinklePhase);
        const effectiveAlpha = Math.max(0, Math.min(1, star.alpha * twinkle));

        // Subtle luminous comet trail behind midground & foreground stars
        if (!star.isSparkle && star.depth >= 0.72 && star.y > -10) {
          const trailLen = (14 + star.vy * 3.4) * star.depth;
          const speedMag = Math.hypot(star.vx, star.vy) || 1;
          const tailX = star.x - (star.vx / speedMag) * trailLen * 0.45;
          const tailY = star.y - (star.vy / speedMag) * trailLen;

          const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
          grad.addColorStop(0, star.glowColor);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.save();
          ctx.globalAlpha = effectiveAlpha * 0.34;
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(1.5, star.size * 0.28);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(star.rotZ);
        ctx.globalAlpha = effectiveAlpha;

        if (star.isSparkle) {
          ctx.scale(scaleX, 1);
          ctx.fillStyle = star.color;
          if (star.depth > 0.85) {
            ctx.shadowColor = star.glowColor;
            ctx.shadowBlur = 10 * star.depth;
          }
          drawFourPointSparkle(ctx, star.size);
        } else {
          // 3D Extruded Back Rim (gives tactile coin/medallion thickness during tumble)
          const rimOffsetX =
            (cosFlip >= 0 ? 1 : -1) * 3.2 * star.depth * (1.2 - scaleX);
          const rimOffsetY = 2.1 * star.depth;

          ctx.save();
          ctx.translate(rimOffsetX, rimOffsetY);
          ctx.scale(scaleX, scaleY);
          ctx.fillStyle = star.rimColor;
          drawFivePointStar(ctx, star.size);
          ctx.restore();

          // Main 3D Star Face
          ctx.scale(scaleX, scaleY);
          if (star.depth >= 0.8) {
            ctx.shadowColor = star.glowColor;
            ctx.shadowBlur = 12 * star.depth;
          }
          ctx.fillStyle = star.color;
          drawFivePointStar(ctx, star.size);

          // Inner Facet Specular Highlight (shifts intensity as star flips in 3D)
          ctx.shadowBlur = 0;
          ctx.globalAlpha = effectiveAlpha * (0.28 + 0.42 * Math.abs(sinFlip));
          ctx.fillStyle = '#FFFFFF';
          ctx.translate(-star.size * 0.08, -star.size * 0.08);
          drawFivePointStar(ctx, star.size * 0.5);
        }

        ctx.restore();
      }

      // 2. Shockwave rings (burst celebration)
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += (ring.maxRadius - ring.radius) * 0.14;
        ring.alpha -= 0.032;
        if (ring.alpha <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ring.alpha);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Burst Particles (burst celebration)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= p.decay;
        p.twinklePhase += 0.22;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const twinkle = 0.78 + 0.22 * Math.sin(p.twinklePhase);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha * twinkle);
        ctx.fillStyle = p.color;

        if (p.shape === 'star' || p.shape === 'sparkle') {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
        }

        if (p.shape === 'star') {
          drawFivePointStar(ctx, p.size);
        } else if (p.shape === 'sparkle') {
          drawFourPointSparkle(ctx, p.size * 1.15);
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(
            -p.size * 0.75,
            -p.size * 0.35,
            p.size * 1.5,
            p.size * 0.7
          );
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.length > 0 || rings.length > 0 || rainStars.length > 0) {
        rafIdRef.current = window.requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        rafIdRef.current = 0;
      }
    };

    rafIdRef.current = window.requestAnimationFrame(render);
  }, [ensureCanvasReady]);

  // Trigger Star Particle Explosion Burst
  useEffect(() => {
    if (confettiTrigger === 0) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    setBurstVisible(true);
    if (burstHideTimerRef.current) {
      window.clearTimeout(burstHideTimerRef.current);
    }
    burstHideTimerRef.current = window.setTimeout(() => {
      setBurstVisible(false);
    }, 1850);

    if (prefersReduced) return;

    const ctx = ensureCanvasReady();
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    const cx = width / 2;
    const cy = height * 0.45;

    spawnExplosion(particlesRef.current, ringsRef.current, cx, cy, 72, 1.08);
    ensureRenderLoop();

    const t1 = window.setTimeout(() => {
      const { width: w, height: h } = sizeRef.current;
      spawnExplosion(
        particlesRef.current,
        ringsRef.current,
        w / 2 - Math.min(180, w * 0.22),
        h * 0.45 - 40,
        28,
        0.78
      );
      ensureRenderLoop();
    }, 160);

    const t2 = window.setTimeout(() => {
      const { width: w, height: h } = sizeRef.current;
      spawnExplosion(
        particlesRef.current,
        ringsRef.current,
        w / 2 + Math.min(180, w * 0.22),
        h * 0.45 - 55,
        28,
        0.78
      );
      ensureRenderLoop();
    }, 280);

    extraTimersRef.current.push(t1, t2);
  }, [confettiTrigger, ensureCanvasReady, ensureRenderLoop]);

  // Trigger 3D-like Cascading Star Rain on Milestones
  useEffect(() => {
    if (starRainTrigger === 0) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    setRainBannerVisible(true);
    if (rainBannerTimerRef.current) {
      window.clearTimeout(rainBannerTimerRef.current);
    }
    rainBannerTimerRef.current = window.setTimeout(() => {
      setRainBannerVisible(false);
    }, 3300);

    if (prefersReduced) return;

    setRainCanvasVisible(true);
    if (rainHideTimerRef.current) {
      window.clearTimeout(rainHideTimerRef.current);
    }
    rainHideTimerRef.current = window.setTimeout(() => {
      setRainCanvasVisible(false);
    }, 4500);

    const ctx = ensureCanvasReady();
    if (!ctx) return;

    // Cascade 5 staggered waves across ~1.9 seconds for an immersive 3D star shower
    const waveDelays = [0, 340, 720, 1140, 1600];
    const waveCounts = [30, 28, 28, 24, 22];

    waveDelays.forEach((delay, waveIdx) => {
      const spawnWave = () => {
        ensureCanvasReady();
        spawnStarRainWave(
          rainStarsRef.current,
          sizeRef.current.width,
          waveCounts[waveIdx],
          waveIdx
        );
        ensureRenderLoop();
      };

      if (delay === 0) {
        spawnWave();
      } else {
        const timerId = window.setTimeout(spawnWave, delay);
        extraTimersRef.current.push(timerId);
      }
    });
  }, [starRainTrigger, ensureCanvasReady, ensureRenderLoop]);

  // Clean up animation frame and pending timers on unmount
  useEffect(() => {
    return () => {
      if (burstHideTimerRef.current) window.clearTimeout(burstHideTimerRef.current);
      if (rainHideTimerRef.current) window.clearTimeout(rainHideTimerRef.current);
      if (rainBannerTimerRef.current)
        window.clearTimeout(rainBannerTimerRef.current);
      extraTimersRef.current.forEach((id) => window.clearTimeout(id));
      extraTimersRef.current = [];
      if (rafIdRef.current) window.cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const canvasOverlayActive = burstVisible || rainCanvasVisible;

  return (
    <>
      {/* 60fps Unified Canvas: Star Particle Explosion + 3D Cascading Star Rain */}
      <div
        className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-300 ${
          canvasOverlayActive ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Milestone Star Rain Floating Ribbon */}
        <AnimatePresence>
          {rainBannerVisible && starRainTrigger > 0 && !unlockedSticker && (
            <motion.div
              key={`star-rain-banner-${starRainTrigger}`}
              initial={{ opacity: 0, y: -32, scale: 0.82 }}
              animate={{ opacity: 1, y: 0, scale: [0.82, 1.06, 1] }}
              exit={{ opacity: 0, y: -24, scale: 0.9 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 border-2 border-white shadow-2xl flex items-center gap-2.5 max-w-[92vw]"
            >
              <motion.span
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-amber-500 shadow-xs shrink-0"
              >
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </motion.span>
              <span className="font-display font-bold text-sm sm:text-base text-slate-900 whitespace-nowrap drop-shadow-2xs">
                {milestoneTitle || 'দারুণ মাইলফলক! তারা বৃষ্টি!'}
              </span>
              <Sparkles className="w-5 h-5 text-white shrink-0 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Hero Star Burst Flare */}
        <AnimatePresence>
          {burstVisible && confettiTrigger > 0 && (
            <motion.div
              key={`star-hero-${confettiTrigger}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingBottom: '10vh' }}
            >
              {/* Warm Golden Radial Flash */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: [0.2, 2.4, 3.1], opacity: [0.9, 0.35, 0] }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                className="absolute w-32 h-32 rounded-full bg-amber-300/60 blur-xl"
              />

              {/* Center Radiant Collectible Star */}
              <motion.div
                initial={{ scale: 0.2, rotate: -30, y: 20, opacity: 0 }}
                animate={{
                  scale: [0.2, 1.38, 1.1, 0.72],
                  rotate: [-30, 12, -6, 15],
                  y: [20, -24, -46, -210],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 border-4 border-white shadow-2xl flex items-center justify-center">
                  <Star className="w-11 h-11 fill-white text-white drop-shadow-xs" />
                </div>

                <motion.div
                  initial={{ scale: 0.6, opacity: 0, y: 4 }}
                  animate={{ scale: 1, opacity: [0, 1, 1, 0], y: -2 }}
                  transition={{ duration: 1.2, delay: 0.1 }}
                  className="mt-2 px-3.5 py-1 rounded-2xl bg-slate-900/90 text-amber-300 font-display font-bold text-sm shadow-lg inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>+১ ★ দারুণ!</span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gift-Box Sticker Unlock Modal */}
      <AnimatePresence>
        {unlockedSticker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sticker-unlock-title"
          >
            <motion.div
              initial={{ scale: 0.72, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="w-full max-w-sm bg-white rounded-3xl border-4 border-amber-300 p-6 text-center shadow-xl"
            >
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: [0, -8, 8, -4, 0], scale: [0.85, 1.12, 1] }}
                transition={{ duration: 0.7 }}
                className="mx-auto w-24 h-24 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-6xl mb-4"
              >
                <span role="img" aria-label={unlockedSticker.nameBn}>
                  {unlockedSticker.emoji}
                </span>
              </motion.div>

              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 mb-1">
                <Gift className="w-4 h-4" />
                <span>নতুন স্টিকার আনলক হয়েছে!</span>
              </div>

              <h3
                id="sticker-unlock-title"
                className="text-2xl font-bold text-slate-900 mb-1"
              >
                {unlockedSticker.nameBn}
              </h3>
              <p className="text-sm font-medium text-slate-600 mb-4">
                {unlockedSticker.nameEn} · &quot;{unlockedSticker.soundText}&quot;
              </p>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onDismissSticker}
                className="w-full min-h-[52px] rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-sm cursor-pointer transition-colors"
              >
                দারুণ! খেলতে থাকি
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
