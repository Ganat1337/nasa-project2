import { useState } from "react";
import { useAppStore } from "@/store";
import type { MissionMode } from "@/domain/types";
import { CapsuleButton, SegmentedControl, Switch } from "./ui";

interface MissionHeaderProps {
  isDoctor: boolean;
  elapsed: string;
  missionName: string;
  mode: MissionMode;
  linkLabel: string;
  online: boolean;
  emergencyActive: boolean;
  scenarioActive: boolean;
  onEmergency: () => void;
  onReset: () => void;
  onSettings: () => void;
}

export function MissionHeader({
  isDoctor,
  elapsed,
  missionName,
  mode,
  linkLabel,
  online,
  emergencyActive,
  scenarioActive,
  onEmergency,
  onReset,
  onSettings,
}: MissionHeaderProps) {
  const setMissionMode = useAppStore((state) => state.setMissionMode);
  const setSolarConjunction = useAppStore((state) => state.setSolarConjunction);
  const solarConjunction = useAppStore((state) => state.solarConjunction);
  const alerts = useAppStore((state) => state.alerts);
  const activeAlerts = alerts.filter((alert) => alert.active).length;
  const [confirmReset, setConfirmReset] = useState(false);
  const linkUnavailable = linkLabel.includes("unavailable");

  const reset = () => {
    if (confirmReset) {
      onReset();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 3_000);
    }
  };

  return (
    <header className="mission-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          A
        </div>
        <div>
          <p className="eyebrow">
            ASTROPULSE <span className="brand-divider">/</span> FLIGHT MEDICAL
          </p>
          <h1>
            ARTEMIS IV <span className="title-divider">|</span> CREW HEALTH MONITOR
          </h1>
          <div className="mission-subtitle">
            <span>{missionName}</span>
            <span className="live-indicator">
              <i /> {elapsed}
            </span>
          </div>
        </div>
      </div>

      <div className="header-controls">
        <div
          className="link-status"
          data-online={online}
          data-emergency={emergencyActive}
          data-unavailable={linkUnavailable}
        >
          <span className="status-dot" />
          <span className="link-status__main">
            {!online ? "OFFLINE MODE" : linkUnavailable ? "LINK UNAVAILABLE" : "GROUND LINK"}
          </span>
          <span className="link-status__detail">
            {online ? linkLabel : "Local telemetry active"}
          </span>
          {isDoctor && activeAlerts > 0 && (
            <span className="alert-count">
              {activeAlerts} ALERT{activeAlerts === 1 ? "" : "S"}
            </span>
          )}
        </div>
        {isDoctor && (
          <>
            <SegmentedControl
              aria-label="Mission mode"
              options={[
                { value: "lunar", label: "LUNAR" },
                { value: "mars", label: "MARS" },
              ]}
              value={mode}
              onValueChange={(value) => setMissionMode(value as MissionMode)}
            />
            {mode === "mars" && (
              <Switch
                className="conjunction-toggle"
                checked={solarConjunction}
                label="Conjunction"
                onChange={(event) => setSolarConjunction(event.target.checked)}
              />
            )}
            {scenarioActive ? (
              <CapsuleButton
                className="button button--reset"
                onClick={reset}
                title="Reset simulated scenario"
                variant="danger"
              >
                {confirmReset ? "Confirm reset?" : "Reset normal"}
              </CapsuleButton>
            ) : (
              <CapsuleButton
                className="button button--emergency"
                onClick={onEmergency}
                variant="danger"
              >
                <span aria-hidden="true">!</span> Simulate emergency
              </CapsuleButton>
            )}
            <button
              className="icon-button settings-button"
              aria-label="Open settings"
              onClick={onSettings}
            >
              <span aria-hidden="true">⚙</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
