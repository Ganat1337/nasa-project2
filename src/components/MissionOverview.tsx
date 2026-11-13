import { useEffect, useRef } from "react";
import type { CrewMember, MissionMode } from "@/domain/types";
import { GlassCard, Hairline, KpiNumber, StatusPill } from "./ui";

interface MissionOverviewProps {
  connectionAvailable: boolean;
  elapsed: string;
  level: "nominal" | "caution" | "warning" | "emergency";
  linkLabel: string;
  missionName: string;
  mode: MissionMode;
  selected: CrewMember;
}

function renderMoon(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  rgb: string,
) {
  const size = 960;
  const center = size / 2;
  const radius = size * 0.49;
  context.clearRect(0, 0, size, size);
  context.save();
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.clip();

  if (image) {
    const drawSize = size * 1.18;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.filter = "grayscale(100%) contrast(1.1) brightness(.96)";
    context.drawImage(image, (size - drawSize) / 2, (size - drawSize) / 2, drawSize, drawSize);
    context.filter = "none";
  } else {
    const base = context.createRadialGradient(
      center - radius * 0.35,
      center - radius * 0.35,
      radius * 0.08,
      center,
      center,
      radius * 1.1,
    );
    base.addColorStop(0, "#D4D2DC");
    base.addColorStop(0.55, "#8A8794");
    base.addColorStop(1, "#3D3B46");
    context.fillStyle = base;
    context.fillRect(0, 0, size, size);

    let seed = 4219;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < 190; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * radius * 0.92;
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;
      const craterRadius = index < 12 ? 18 + random() * 34 : 3 + random() * 14;
      const crater = context.createLinearGradient(
        x - craterRadius,
        y - craterRadius,
        x + craterRadius,
        y + craterRadius,
      );
      crater.addColorStop(0, "rgba(12, 12, 18, .45)");
      crater.addColorStop(0.55, "rgba(90, 88, 98, .12)");
      crater.addColorStop(1, "rgba(235, 232, 245, .32)");
      context.fillStyle = crater;
      context.beginPath();
      context.arc(x, y, craterRadius, 0, Math.PI * 2);
      context.fill();
    }
  }

  const limb = context.createRadialGradient(center, center, radius * 0.52, center, center, radius);
  limb.addColorStop(0, "rgba(0, 0, 0, 0)");
  limb.addColorStop(0.82, "rgba(4, 2, 12, .25)");
  limb.addColorStop(1, "rgba(4, 2, 12, .68)");
  context.fillStyle = limb;
  context.fillRect(0, 0, size, size);

  const terminator = context.createRadialGradient(
    center - radius * 0.52,
    center - radius * 0.5,
    radius * 0.18,
    center - radius * 0.18,
    center - radius * 0.16,
    radius * 1.18,
  );
  terminator.addColorStop(0, "rgba(255, 255, 255, .08)");
  terminator.addColorStop(0.42, "rgba(10, 6, 20, .05)");
  terminator.addColorStop(0.68, "rgba(5, 2, 12, .68)");
  terminator.addColorStop(0.86, "rgba(4, 2, 10, .94)");
  terminator.addColorStop(1, "rgba(3, 1, 8, .98)");
  context.fillStyle = terminator;
  context.fillRect(0, 0, size, size);

  context.beginPath();
  context.arc(center, center, radius - 2, 0.05, Math.PI * 0.64);
  context.strokeStyle = `rgba(${rgb}, .58)`;
  context.lineWidth = 5;
  context.shadowColor = `rgba(${rgb}, .85)`;
  context.shadowBlur = 16;
  context.stroke();
  context.restore();
}

export function MissionOverview({
  connectionAvailable,
  elapsed,
  level,
  linkLabel,
  missionName,
  mode,
  selected,
}: MissionOverviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const backSatellite = useRef<SVGCircleElement>(null);
  const frontSatellite = useRef<SVGCircleElement>(null);
  const redrawMoon = useRef<() => void>(() => {});

  useEffect(() => {
    redrawMoon.current();
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.CanvasRenderingContext2D === "undefined") return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let image: HTMLImageElement | null = null;
    let disposed = false;
    const draw = () => {
      const rgb =
        getComputedStyle(canvas).getPropertyValue("--accent-rgb").trim() || "168, 85, 247";
      renderMoon(context, image, rgb);
    };
    redrawMoon.current = draw;
    draw();

    const moonImage = new Image();
    moonImage.referrerPolicy = "no-referrer";
    moonImage.onload = () => {
      if (disposed) return;
      image = moonImage;
      draw();
    };
    moonImage.onerror = () => {
      if (disposed) return;
      image = null;
      draw();
    };
    moonImage.src =
      "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000868/GSFC_20171208_Archive_e000868~large.jpg";

    return () => {
      disposed = true;
      moonImage.onload = null;
      moonImage.onerror = null;
      redrawMoon.current = () => {};
    };
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = () => motionQuery?.matches ?? true;
    let phase = 0.65;
    let driftTime = 0;
    let last = performance.now();
    let animationFrame: number | null = null;
    let visible = !document.hidden;

    const updateOrbit = () => {
      const x = 250 * Math.cos(phase);
      const y = 68 * Math.sin(phase);
      const rotation = (-20 * Math.PI) / 180;
      const cx = 260 + x * Math.cos(rotation) - y * Math.sin(rotation);
      const cy = 260 + x * Math.sin(rotation) + y * Math.cos(rotation);
      const front = Math.sin(phase) >= 0;
      if (frontSatellite.current) {
        frontSatellite.current.setAttribute("cx", cx.toFixed(2));
        frontSatellite.current.setAttribute("cy", cy.toFixed(2));
        frontSatellite.current.setAttribute("opacity", front ? "0.95" : "0");
      }
      if (backSatellite.current) {
        backSatellite.current.setAttribute("cx", cx.toFixed(2));
        backSatellite.current.setAttribute("cy", cy.toFixed(2));
        backSatellite.current.setAttribute("opacity", front ? "0" : "0.75");
      }
    };
    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    const frame = (now: number) => {
      animationFrame = null;
      if (!visible) return;
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!prefersReducedMotion()) {
        driftTime += delta;
        if (viewportRef.current) {
          const dx = Math.sin(driftTime * 0.35) * 3.5;
          const dy = Math.cos(driftTime * 0.28) * 2.5;
          viewportRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
        }
        phase = (phase + delta * 0.24) % (Math.PI * 2);
        updateOrbit();
        animationFrame = requestAnimationFrame(frame);
      }
    };
    const start = () => {
      if (visible && !prefersReducedMotion() && animationFrame === null)
        animationFrame = requestAnimationFrame(frame);
      if (prefersReducedMotion()) updateOrbit();
    };
    const onVisibilityChange = () => {
      visible = !document.hidden;
      if (visible) {
        last = performance.now();
        start();
      } else {
        stop();
      }
    };
    const onMotionChange = () => {
      stop();
      last = performance.now();
      if (prefersReducedMotion() && viewportRef.current) viewportRef.current.style.transform = "";
      start();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery?.addEventListener("change", onMotionChange);
    updateOrbit();
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery?.removeEventListener("change", onMotionChange);
    };
  }, []);

  const elapsedParts = elapsed.split("·").map((part) => part.trim());
  const isLunar = mode === "lunar";

  return (
    <section
      className="mission-overview"
      id="mission-overview"
      aria-label="Mission control overview"
    >
      <div className="mission-hero-copy">
        <p className="mission-kicker mono">
          <span aria-hidden="true" />
          HUMAN PERFORMANCE. BEYOND EARTH.
        </p>
        <h2 className="mission-hero-title display">
          <span>MONITOR.</span>
          <span>PROTECT.</span>
          <span>SURVIVE.</span>
        </h2>
        <p className="mission-hero-subtitle">
          Every heartbeat. Every orbit. Every life.
          <br />
          Precision health intelligence for {missionName}.
        </p>
        <div className="mission-hero-actions">
          <a className="mission-hero-cta mission-hero-cta--primary" href="#crew-vitals">
            EXPLORE MISSION <span aria-hidden="true">↗</span>
          </a>
          <a className="mission-hero-cta mission-hero-cta--ghost" href="#crew-vitals">
            LIVE TELEMETRY <span className="mission-live-dot" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="lunar-scene" id="mission-scene">
        <div className="moon-viewport" ref={viewportRef}>
          <div className="orbit-tag mono">{isLunar ? "ARTEMIS IV · GATEWAY" : "LUNAR REFERENCE"}</div>
          <div className="earth-marker" aria-hidden="true" />
          <svg className="orbit-svg orbit-svg--back" viewBox="0 0 520 520" aria-hidden="true">
            <g transform="rotate(-20 260 260)">
              <path d="M 10 260 A 250 68 0 0 1 510 260" />
              <path className="orbit-inner" d="M 34 260 A 226 54 0 0 1 486 260" />
            </g>
            <circle ref={backSatellite} r="3.5" />
          </svg>
          <div className="moon-sphere">
            <canvas
              aria-label="Lunar surface lit from the upper left"
              className="moon-canvas"
              height="960"
              ref={canvasRef}
              width="960"
            />
          </div>
          <svg className="orbit-svg orbit-svg--front" viewBox="0 0 520 520" aria-hidden="true">
            <g transform="rotate(-20 260 260)">
              <path d="M 10 260 A 250 68 0 0 0 510 260" />
              <path className="orbit-inner" d="M 34 260 A 226 54 0 0 0 486 260" />
            </g>
            <circle ref={frontSatellite} r="4" />
          </svg>
          <span className="nrho-marker mono">NRHO</span>
        </div>
        <div className="moon-caption">
          <Hairline />
          <span className="mono">LUNAR ORBIT / 384,400 KM</span>
        </div>
      </div>

      <GlassCard as="aside" className="flight-data-panel" aria-label="Flight data">
        <p className="flight-data-title mono">FLIGHT DATA</p>
        <div className="flight-data-row">
          <span className="mono">MISSION CLOCK</span>
          <KpiNumber className="flight-data-value tabular-nums">{elapsedParts[0]}</KpiNumber>
          <small className="mono">{elapsedParts[1] ?? "UTC"}</small>
        </div>
        <div className="flight-data-row">
          <span className="mono">HEART RATE</span>
          <KpiNumber className="flight-data-value tabular-nums">
            {selected.vitals.heartRateBpm}
          </KpiNumber>
          <small className="mono">BPM · {selected.role}</small>
        </div>
        <div className="flight-data-row">
          <span className="mono">SpO₂</span>
          <KpiNumber className="flight-data-value tabular-nums">
            {selected.vitals.spo2Percent.toFixed(1)}%
          </KpiNumber>
          <small className="mono">CREW TELEMETRY</small>
        </div>
        <StatusPill level={connectionAvailable ? "nominal" : "caution"}>
          {linkLabel}
        </StatusPill>
      </GlassCard>
    </section>
  );
}
