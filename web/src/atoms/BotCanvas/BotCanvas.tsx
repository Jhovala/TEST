import { useEffect, useRef, useState } from 'react';
import './BotCanvas.css';

/* ============================================================
   BotCanvas — átomo de Atomic Design
   Renderiza una secuencia pre-renderizada de fotogramas del bot
   de IA sobre un <canvas>, guiada por la posición del cursor.
   Técnica inspirada en Scrolltide (Scowlby), sin WebGL.
   Mejoras sobre la guía base:
   - Detección automática de frames disponibles (evita 404 si hay menos)
   - Soporte táctil + giroscopio (DeviceOrientationEvent)
   - prefers-reduced-motion respeta accesibilidad
   - Cleanup correcto de listeners y rAF
   ============================================================ */

export interface BotCanvasProps {
  /** Número máximo de fotogramas esperados (se ajustará al inventario real) */
  totalFrames?: number;
  /** Columnas de la rejilla de ángulos (filas = ceil(total/columns)) */
  columns?: number;
  /** Ruta base de los frames */
  basePath?: string;
  /** Ancho/alto lógico del canvas */
  size?: number;
  /** Inercia del frame (0..1). Menor = más suave */
  easing?: number;
}

const loadFrameImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // frame inexistente → se ignora
    img.src = src;
  });

export default function BotCanvas({
  totalFrames = 90,
  columns = 10,
  basePath = '/bot-sequence',
  size = 800,
  easing = 0.2,
}: BotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const mousePos = useRef({ x: 0, y: 0 });
  const currentFrame = useRef(0);
  const idleTimer = useRef<number | undefined>(undefined);
  const isIdle = useRef(true); // arranca en idle hasta primer movimiento

  // 1. Precarga de la secuencia (tolerante a falta de frames)
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const available: (HTMLImageElement | null)[] = [];

    const preload = async () => {
      const tasks: Promise<void>[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const frameIndex = String(i).padStart(2, '0');
        tasks.push(
          loadFrameImage(`${basePath}/frame-${frameIndex}.svg`).then((img) => {
            if (cancelled) return;
            available[i] = img;
            loadedCount++;
            setLoadProgress(Math.floor((loadedCount / totalFrames) * 100));
          })
        );
      }
      await Promise.all(tasks);
      if (cancelled) return;
      imagesRef.current = available;
      setIsLoaded(true);
    };

    preload();
    return () => {
      cancelled = true;
    };
  }, [totalFrames, basePath]);

  // 2. Mapeo de coordenadas normalizadas → índice de fotograma
  const calculateFrameIndex = (x: number, y: number): number => {
    const n = imagesRef.current.length || 1;
    const rows = Math.max(1, Math.ceil(n / columns));
    const normX = Math.max(0, Math.min(1, x / window.innerWidth));
    const normY = Math.max(0, Math.min(1, y / window.innerHeight));
    const col = Math.round(normX * (columns - 1));
    const row = Math.round(normY * (rows - 1));
    const index = row * columns + col;
    return Math.min(n - 1, Math.max(0, index));
  };

  // 3. Listeners (puntero + táctil + giroscopio) y bucle de render
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const wakeUp = (x: number, y: number) => {
      mousePos.current = { x, y };
      isIdle.current = false;
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        isIdle.current = true;
      }, 3000);
    };

    const handlePointerMove = (e: PointerEvent) => wakeUp(e.clientX, e.clientY);

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) wakeUp(t.clientX, t.clientY);
    };

    // Giroscopio para móvil: beta (-90..90 vertical), gamma (-90..90 horizontal)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const x = ((e.gamma + 90) / 180) * window.innerWidth;
      const y = ((e.beta + 90) / 180) * window.innerHeight;
      wakeUp(x, y);
    };

    let rafId = 0;
    const render = () => {
      const n = imagesRef.current.length;
      if (n > 0) {
        let targetFrame: number;
        if (isIdle.current || reduceMotion) {
          if (reduceMotion) {
            targetFrame = Math.floor(n / 2); // mirada al frente fija
          } else {
            // Idle: barrido senoidal sutil alrededor del último frame
            const time = Date.now() * 0.002;
            const idleOffset = Math.floor(Math.sin(time) * 3);
            targetFrame = (currentFrame.current + idleOffset + n) % n;
          }
        } else {
          targetFrame = calculateFrameIndex(mousePos.current.x, mousePos.current.y);
        }

        currentFrame.current += (targetFrame - currentFrame.current) * easing;
        const frameToDraw = Math.round(currentFrame.current);
        const img = imagesRef.current[frameToDraw];

        if (img) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    // Posición inicial = centro
    wakeUp(window.innerWidth / 2, window.innerHeight / 2);
    isIdle.current = true;
    render();

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(rafId);
      window.clearTimeout(idleTimer.current);
    };
  }, [isLoaded, columns, easing]);

  return (
    <div className="bot-canvas-wrapper">
      {!isLoaded && (
        <div className="bot-loader" role="status" aria-live="polite">
          <p className="bot-loader__text">Iniciando Sparky… {loadProgress}%</p>
          <div className="bot-loader__track">
            <div className="bot-loader__bar" style={{ width: `${loadProgress}%` }} />
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="bot-canvas"
        aria-label="Bot de IA animado que sigue el cursor"
        role="img"
      />
    </div>
  );
}
