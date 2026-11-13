import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import type { CrewMember } from "@/domain/types";
import { useAppStore } from "@/store";
import { ScenarioControls } from "./ScenarioControls";
import { GlassCard, KpiNumber } from "./ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface VitalsPanelProps {
  crew: CrewMember;
  linkLabel: string;
}

function formatTemperature(value: number, unit: "C" | "F"): string {
  return unit === "C" ? `${value.toFixed(1)}°C` : `${((value * 9) / 5 + 32).toFixed(1)}°F`;
}

function stressLabel(value: number): string {
  if (value >= 70) return "HIGH";
  if (value >= 40) return "MODERATE";
  return "LOW";
}

function VitalsChart({ crew, critical }: { crew: CrewMember; critical: boolean }) {
  const accentRgb =
    getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() ||
    "168, 85, 247";
  const data = useMemo(
    () => ({
      labels: crew.heartRateHistory.map((_, index) => `${index * 2}s`),
      datasets: [
        {
          label: "Heart rate",
          data: crew.heartRateHistory.map((point) => point.value),
          borderColor: critical ? "#EF4444" : `rgb(${accentRgb})`,
          backgroundColor: critical ? "rgba(239, 68, 68, .12)" : `rgba(${accentRgb}, .12)`,
          borderWidth: 2,
          fill: true,
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    }),
    [crew.heartRateHistory, critical, accentRgb],
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#140c26",
        borderColor: "rgba(168, 85, 247, .35)",
        borderWidth: 1,
        titleColor: "rgba(245, 240, 255, .6)",
        bodyColor: "#F5F0FF",
        displayColors: false,
        callbacks: { label: (context) => `${context.parsed.y} BPM` },
      },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: {
        min: 40,
        max: 180,
        ticks: {
          color: "rgba(245, 240, 255, .38)",
          maxTicksLimit: 4,
          font: { family: "JetBrains Mono", size: 10 },
        },
        grid: { color: "rgba(168, 85, 247, .12)" },
        border: { display: false },
      },
    },
  };

  return (
    <Line
      id="heartRateChart"
      data={data}
      options={options}
      aria-label={`${crew.name} heart-rate history`}
    />
  );
}

export function VitalsPanel({ crew, linkLabel }: VitalsPanelProps) {
  const simulation = useAppStore((state) => state.simulation);
  const alerts = useAppStore((state) => state.alerts);
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const activeCritical = alerts.some(
    (alert) =>
      alert.active && alert.level === "emergency" && (!alert.crewId || alert.crewId === crew.id),
  );
  const dailyExerciseTarget = 60;
  const exerciseProgress = Math.min(100, (crew.workoutMinutes / dailyExerciseTarget) * 100);
  const radiationFraction = Math.min(
    100,
    (crew.vitals.radiationDoseMsv / crew.baseline.radiationDemoReferenceMsv) * 100,
  );

  return (
    <div className="vitals-stack">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">BIOMETRIC TELEMETRY / {crew.id.toUpperCase()}</p>
          <h2>
            {crew.name}
            <span className="section-title-row__role">{crew.role}</span>
          </h2>
        </div>
        <div className="selected-state">
          <span
            className={`crew-status ${activeCritical ? "crew-status--critical" : "crew-status--nominal"}`}
          />
          {activeCritical ? "ATTENTION" : "NOMINAL"}
        </div>
      </div>

      <GlassCard className={`panel heart-panel ${activeCritical ? "panel--critical" : ""}`}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CARDIOVASCULAR</p>
            <h3>Heart rate</h3>
          </div>
          <span className="unit-label">
            BPM <span>· LIVE</span>
          </span>
        </div>
        <div className="heart-panel__body">
          <div className="heart-reading">
            <span className={activeCritical ? "reading--critical" : ""}>
              {crew.vitals.heartRateBpm}
            </span>
            <small>BPM</small>
            <div className="reading-caption">
              <i className="pulse-line" /> {crew.activityState.toUpperCase()} STATE
            </div>
          </div>
          <div className="heart-chart">
            <VitalsChart crew={crew} critical={activeCritical} />
          </div>
        </div>
        <div className="chart-footnote">
          <span>60-POINT HISTORY</span>
          <span>{linkLabel}</span>
        </div>
      </GlassCard>

      <div className="metric-grid">
        <GlassCard className="panel metric-card">
          <div className="metric-card__heading">
            <span className="metric-icon metric-icon--cyan">O₂</span>
            <span className="eyebrow">OXYGEN SATURATION</span>
          </div>
          <KpiNumber className="metric-value">
            {crew.vitals.spo2Percent.toFixed(1)}
            <small>%</small>
          </KpiNumber>
          <div className="progress-track">
            <span
              className="progress-fill progress-fill--cyan"
              style={{ width: `${Math.min(100, crew.vitals.spo2Percent)}%` }}
            />
          </div>
          <div className="metric-foot">
            <span>Pulse oximetry</span>
            <span>Illustrative</span>
          </div>
        </GlassCard>
        <GlassCard className="panel metric-card">
          <div className="metric-card__heading">
            <span className="metric-icon metric-icon--blue">°</span>
            <span className="eyebrow">BODY TEMP</span>
          </div>
          <KpiNumber className="metric-value">
            {formatTemperature(crew.vitals.temperatureC, temperatureUnit)}
          </KpiNumber>
          <div className="metric-foot">
            <span>Core estimate</span>
            <span>Telemetry</span>
          </div>
        </GlassCard>
        <GlassCard className="panel metric-card">
          <div className="metric-card__heading">
            <span className="metric-icon metric-icon--amber">◌</span>
            <span className="eyebrow">STRESS INDEX</span>
          </div>
          <KpiNumber className="metric-value">
            {stressLabel(crew.vitals.stressIndex)}
            <small> {Math.round(crew.vitals.stressIndex)}</small>
          </KpiNumber>
          <div className="progress-track">
            <span
              className="progress-fill progress-fill--amber"
              style={{ width: `${crew.vitals.stressIndex}%` }}
            />
          </div>
          <div className="metric-foot">
            <span>Relative demo index</span>
            <span>0–100</span>
          </div>
        </GlassCard>
      </div>

      <div className="space-metrics">
        <GlassCard className="panel space-card radiation-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DEEP-SPACE EXPOSURE</p>
              <h3>Radiation dose</h3>
            </div>
            <span className="metric-icon metric-icon--violet">☼</span>
          </div>
          <KpiNumber className="space-card__value">
            {crew.vitals.radiationDoseMsv.toFixed(2)} <small>mSv</small>
          </KpiNumber>
          <div className="progress-track progress-track--large">
            <span
              className="progress-fill progress-fill--violet"
              style={{ width: `${radiationFraction}%` }}
            />
          </div>
          <div className="metric-foot">
            <span>Illustrative cumulative estimate</span>
            <span>{radiationFraction.toFixed(1)}% of demo reference</span>
          </div>
        </GlassCard>
        <GlassCard className="panel space-card workout-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MICROGRAVITY COUNTERMEASURE</p>
              <h3>Daily workout</h3>
            </div>
            <span className="metric-icon metric-icon--green">↗</span>
          </div>
          <KpiNumber className="space-card__value">
            {crew.workoutMinutes.toFixed(0)} <small>/ 60 min</small>
          </KpiNumber>
          <div className="progress-track progress-track--large">
            <span
              className="progress-fill progress-fill--green"
              style={{ width: `${exerciseProgress}%` }}
            />
          </div>
          <div className="metric-foot">
            <span>
              Cardio {crew.cardioMinutes}m · Resistance {crew.resistanceMinutes}m
            </span>
            <span>Illustrative target</span>
          </div>
        </GlassCard>
        <GlassCard className="panel space-card sleep-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CIRCADIAN HEALTH</p>
              <h3>Sleep quality</h3>
            </div>
            <span className="metric-icon metric-icon--blue">☾</span>
          </div>
          <KpiNumber className="space-card__value">
            {crew.sleepHours24h.toFixed(1)} <small>h / 24h</small>
          </KpiNumber>
          <div className="progress-track progress-track--large">
            <span
              className="progress-fill progress-fill--blue"
              style={{ width: `${crew.sleepQuality}%` }}
            />
          </div>
          <div className="metric-foot">
            <span>Quality estimate</span>
            <span>{crew.sleepQuality}%</span>
          </div>
        </GlassCard>
      </div>

      <ScenarioControls activeScenario={simulation.scenario?.id ?? null} />
    </div>
  );
}
