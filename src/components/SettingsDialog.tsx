import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import type { TemperatureUnit } from "@/domain/types";
import { CapsuleButton, GlassSheet } from "./ui";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const simulationSpeed = useAppStore((state) => state.simulationSpeed);
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const alarmVolume = useAppStore((state) => state.alarmVolume);
  const setSimulationSpeed = useAppStore((state) => state.setSimulationSpeed);
  const setTemperatureUnit = useAppStore((state) => state.setTemperatureUnit);
  const setSoundEnabled = useAppStore((state) => state.setSoundEnabled);
  const setAlarmVolume = useAppStore((state) => state.setAlarmVolume);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <GlassSheet
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">MISSION CONTROL</p>
            <h2 id="settings-title">Dashboard settings</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>
        <label className="setting-row">
          <span>
            <strong>Simulation rate</strong>
            <small>Mission clock and telemetry progression</small>
          </span>
          <select
            value={simulationSpeed}
            onChange={(event) => setSimulationSpeed(Number(event.target.value))}
          >
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            <strong>Temperature display</strong>
            <small>Shown for crew and cabin readings</small>
          </span>
          <select
            value={temperatureUnit}
            onChange={(event) => setTemperatureUnit(event.target.value as TemperatureUnit)}
          >
            <option value="C">Celsius</option>
            <option value="F">Fahrenheit</option>
          </select>
        </label>
        <div className="setting-row">
          <span>
            <strong>Audible alert</strong>
            <small>Two-tone browser-generated alarm</small>
          </span>
          <button
            className={`toggle-button ${soundEnabled ? "is-on" : ""}`}
            onClick={() => void setSoundEnabled(!soundEnabled)}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? "Enabled" : "Enable sound"}
          </button>
        </div>
        <label className="setting-row setting-row--volume">
          <span>
            <strong>Alarm volume</strong>
            <small>{Math.round(alarmVolume * 100)}%</small>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={alarmVolume}
            onChange={(event) => setAlarmVolume(Number(event.target.value))}
          />
        </label>
        <div className="settings-note">
          Local settings and medical notes stay in this browser. Do not enter real patient
          information.
        </div>
        <CapsuleButton
          className="button button--primary dialog-close"
          onClick={onClose}
          variant="primary"
        >
          Done
        </CapsuleButton>
      </GlassSheet>
    </div>
  );
}
