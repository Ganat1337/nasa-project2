import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  layer: 0 | 1 | 2;
  color: string;
  halo: boolean;
}

const STAR_COLORS = [
  { rgb: "255,255,255", weight: 0.56 },
  { rgb: "242,245,255", weight: 0.18 },
  { rgb: "255,247,235", weight: 0.13 },
  { rgb: "202,223,255", weight: 0.07 },
  { rgb: "255,240,204", weight: 0.045 },
  { rgb: "255,212,178", weight: 0.015 },
];

function randomStarColor(): string {
  let weight = Math.random();
  for (const entry of STAR_COLORS) {
    weight -= entry.weight;
    if (weight <= 0) return entry.rgb;
  }
  return "255,255,255";
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.CanvasRenderingContext2D === "undefined") return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stars: Star[] = [];
    const drift = [0.8, 1.8, 3.2];
    const mouseShift = [2.5, 5.5, 9];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let lastTime = performance.now();
    let animationFrame: number | null = null;
    let visible = !document.hidden;

    const buildStars = () => {
      stars.length = 0;
      const mobile = window.innerWidth < 768;
      const areaScale = Math.max(0.6, Math.min(1.3, (width * height) / (1600 * 900)));
      const count = Math.round((mobile ? 650 : 2100) * areaScale);
      for (let index = 0; index < count; index += 1) {
        let x: number;
        let y: number;
        if (index < count * 0.28) {
          const position = Math.random();
          const spread = (Math.random() + Math.random() - 1) * 0.16;
          x = position * width;
          y = (0.85 - position * 0.65 + spread) * height;
          if (y < 0) y += height;
          if (y > height) y -= height;
        } else {
          x = Math.random() * width;
          y = Math.random() * height;
        }

        const tail = Math.random();
        let radius: number;
        let alpha: number;
        let layer: Star["layer"];
        let halo = false;
        if (tail < 0.8) {
          radius = 0.35 + Math.random() * 0.45;
          alpha = 0.2 + Math.random() * 0.4;
          layer = 0;
        } else if (tail < 0.97) {
          radius = 0.75 + Math.random() * 0.55;
          alpha = 0.5 + Math.random() * 0.35;
          layer = 1;
        } else {
          radius = 1.25 + Math.random() * 0.85;
          alpha = 0.78 + Math.random() * 0.22;
          layer = 2;
          halo = tail > 0.988;
        }
        stars.push({ x, y, radius, alpha, layer, color: randomStarColor(), halo });
      }
    };

    const draw = (now: number, animate: boolean) => {
      if (!visible) return;
      const delta = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      context.fillStyle = "#05020C";
      context.fillRect(0, 0, width, height);

      if (animate) {
        pointerX += (targetX - pointerX) * 0.04;
        pointerY += (targetY - pointerY) * 0.04;
      }
      stars.forEach((star) => {
        if (animate) {
          const offset = drift[star.layer] * delta;
          star.x -= offset;
          star.y += offset * 0.22;
          if (star.x < -4) star.x = width + 4;
          if (star.y > height + 4) star.y = -4;
        }

        const x = star.x - pointerX * mouseShift[star.layer];
        const y = star.y - pointerY * mouseShift[star.layer];
        if (star.halo) {
          const halo = context.createRadialGradient(x, y, 0, x, y, star.radius * 4.5);
          halo.addColorStop(0, `rgba(${star.color}, ${star.alpha * 0.32})`);
          halo.addColorStop(1, `rgba(${star.color}, 0)`);
          context.fillStyle = halo;
          context.beginPath();
          context.arc(x, y, star.radius * 4.5, 0, Math.PI * 2);
          context.fill();
        }
        context.fillStyle = `rgba(${star.color}, ${star.alpha})`;
        context.beginPath();
        context.arc(x, y, star.radius, 0, Math.PI * 2);
        context.fill();
      });
    };

    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    const frame = (now: number) => {
      animationFrame = null;
      if (!visible) return;
      draw(now, !motionQuery.matches);
      if (!motionQuery.matches) animationFrame = requestAnimationFrame(frame);
    };
    const start = () => {
      if (visible && !motionQuery.matches && animationFrame === null)
        animationFrame = requestAnimationFrame(frame);
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      lastTime = performance.now();
      draw(lastTime, false);
      start();
    };
    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / Math.max(1, width) - 0.5) * 2;
      targetY = (event.clientY / Math.max(1, height) - 0.5) * 2;
    };
    const onVisibilityChange = () => {
      visible = !document.hidden;
      if (visible) {
        lastTime = performance.now();
        if (motionQuery.matches) draw(lastTime, false);
        else start();
      } else {
        stop();
      }
    };
    const onMotionChange = () => {
      stop();
      lastTime = performance.now();
      draw(lastTime, false);
      start();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);
    resize();
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="mission-starfield" aria-hidden="true" />;
}
