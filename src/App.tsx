import { useCallback, useEffect, useMemo, useState } from "react";
import { getMarsOneWayDelaySeconds, MISSION_PROFILES } from "@/config/missions";
import { startAlarmRepeater, stopAlarmRepeater } from "@/alerts/audio";
import { useAppStore } from "@/store";
import { FLIGHT_DOCTOR } from "@/data/crew";
import { AuraPanel } from "@/components/AuraPanel";
import { CompanionOverview } from "@/components/CompanionOverview";
import { CrewRoster } from "@/components/CrewRoster";
import { MissionHeader } from "@/components/MissionHeader";
import { OperationsPanel } from "@/components/OperationsPanel";
import { SettingsDialog } from "@/components/SettingsDialog";
import { MissionOverview } from "@/components/MissionOverview";
import { Starfield } from "@/components/ui/Starfield";
import { VitalsPanel } from "@/components/VitalsPanel";

type MobileView = "crew" | "dashboard" | "systems";

function formatElapsed(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remaining = seconds % 60;
  return `D+${String(days).padStart(3, "0")} · ${[hours, minutes, remaining]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")} UTC`;
}

export default function App() {
  const tick = useAppStore((state) => state.tick);
  const simulation = useAppStore((state) => state.simulation);
  const mode = useAppStore((state) => state.mode);
  const selectedCrewId = useAppStore((state) => state.selectedCrewId);
  const solarConjunction = useAppStore((state) => state.solarConjunction);
  const simulationSpeed = useAppStore((state) => state.simulationSpeed);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const alarmVolume = useAppStore((state) => state.alarmVolume);
  const alerts = useAppStore((state) => state.alerts);
  const launchScenario = useAppStore((state) => state.launchScenario);
  const resetScenario = useAppStore((state) => state.resetScenario);
  const [astronautId, setAstronautId] = useState("");
  const isDoctor = astronautId === "";
  const [auraOpen, setAuraOpen] = useState(false);
  const [auraStarter, setAuraStarter] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("dashboard");
  const [online, setOnline] = useState(() => navigator.onLine);
  const [clockPulse, setClockPulse] = useState(0);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  useEffect(() => {
    const timer = window.setInterval(tick, 2_000);
    return () => window.clearInterval(timer);
  }, [tick]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockPulse((value) => value + 1), 1_000);
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const activeEmergency =
    isDoctor &&
    alerts.some((alert) => alert.active && alert.level === "emergency" && !alert.acknowledged);
  const activeAlerts = alerts.filter((alert) => alert.active);
  const visualLevel = activeAlerts.some((alert) => alert.level === "emergency")
    ? "emergency"
    : activeAlerts.some((alert) => alert.level === "warning")
      ? "warning"
      : activeAlerts.some((alert) => alert.level === "caution")
        ? "caution"
        : "nominal";
  useEffect(() => {
    if (soundEnabled && activeEmergency) startAlarmRepeater(alarmVolume);
    else stopAlarmRepeater();
    return stopAlarmRepeater;
  }, [activeEmergency, alarmVolume, soundEnabled]);

  const selectedCrew =
    simulation.crew.find((member) => member.id === (isDoctor ? selectedCrewId : astronautId)) ??
    simulation.crew[0];
  const missionProfile = MISSION_PROFILES[mode];
  const delaySeconds = useMemo(
    () => getMarsOneWayDelaySeconds(simulation.elapsedSeconds / 86_400, solarConjunction),
    [simulation.elapsedSeconds, solarConjunction],
  );
  const linkLabel =
    mode === "lunar"
      ? "Near-real-time"
      : delaySeconds === null
        ? "Solar conjunction · link unavailable"
        : `One-way delay · ${Math.round(delaySeconds)}s`;

  const connectionAvailable = online && delaySeconds !== null;

  return (
    <>
      <Starfield />
      <div
        className={`app-shell ${activeEmergency ? "has-emergency" : ""}`}
        data-level={visualLevel}
      >
        <MissionHeader
          isDoctor={isDoctor}
          elapsed={formatElapsed(simulation.elapsedSeconds + (clockPulse % 2) * simulationSpeed)}
          missionName={missionProfile.missionName}
          mode={mode}
          linkLabel={linkLabel}
          online={online}
          emergencyActive={activeEmergency}
          scenarioActive={Boolean(simulation.scenario)}
          onEmergency={() => launchScenario("cardiac-event")}
          onReset={resetScenario}
          onSettings={() => setSettingsOpen(true)}
        />

        <div className="workspace-toolbar">
          <label>
            Demo profile
            <select
              value={astronautId}
              onChange={(event) => {
                setAstronautId(event.target.value);
                setMobileView("dashboard");
                setSettingsOpen(false);
              }}
            >
              <option value="">{FLIGHT_DOCTOR.name} · Doctor Mode</option>
              {simulation.crew.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · Astronaut Mode
                </option>
              ))}
            </select>
          </label>
          <button
            className="button aura-toggle"
            onClick={() => setAuraOpen(!auraOpen)}
            aria-expanded={auraOpen}
            aria-controls={auraOpen ? "aura-panel" : undefined}
          >
            {auraOpen ? "Hide AURA" : "Open AURA"}
          </button>
        </div>

        <MissionOverview
          connectionAvailable={connectionAvailable}
          elapsed={formatElapsed(simulation.elapsedSeconds + (clockPulse % 2) * simulationSpeed)}
          level={visualLevel}
          linkLabel={linkLabel}
          missionName={missionProfile.missionName}
          mode={mode}
          selected={selectedCrew}
        />

        {isDoctor && (
          <nav className="mobile-nav" aria-label="Dashboard sections">
            {(
              [
                ["crew", "Crew"],
                ["dashboard", "Vitals"],
                ["systems", "Operations"],
              ] as const
            ).map(([view, label]) => (
              <button
                className={mobileView === view ? "mobile-nav__item is-active" : "mobile-nav__item"}
                key={view}
                onClick={() => setMobileView(view)}
                aria-current={mobileView === view ? "page" : undefined}
              >
                {label}
              </button>
            ))}
          </nav>
        )}

        <CompanionOverview
          isDoctor={isDoctor}
          selected={selectedCrew}
          crew={simulation.crew}
          alerts={alerts}
          connectionAvailable={connectionAvailable}
          onTalk={(message) => {
            setAuraStarter(message ?? "");
            setAuraOpen(true);
          }}
          onInvestigate={(crewId) => {
            if (isDoctor) useAppStore.getState().selectCrew(crewId);
            setMobileView("dashboard");
            window.requestAnimationFrame(() =>
              document.getElementById("crew-vitals")?.scrollIntoView?.({ block: "start" }),
            );
          }}
        />

        <div className={auraOpen ? "workspace-layout workspace-layout--aura" : "workspace-layout"}>
          <main
            className={`dashboard-grid mobile-${mobileView} ${isDoctor ? "" : "dashboard-grid--personal"}`}
          >
            {isDoctor && (
              <aside className="crew-column">
                <CrewRoster />
              </aside>
            )}
            <section id="crew-vitals" className="vitals-column" aria-label="Crew health telemetry">
              <VitalsPanel crew={selectedCrew} linkLabel={linkLabel} />
            </section>
            {isDoctor && (
              <aside className="operations-column" id="operations-panel">
                <OperationsPanel crew={selectedCrew} />
              </aside>
            )}
          </main>
          <div hidden={!auraOpen} className="aura-slot">
            <AuraPanel
              key={astronautId}
              isDoctor={isDoctor}
              connectionAvailable={connectionAvailable}
              starter={auraStarter}
              crew={simulation.crew}
              selected={selectedCrew}
              onClose={() => setAuraOpen(false)}
              onShowChart={(crewId) => {
                if (isDoctor) useAppStore.getState().selectCrew(crewId);
                setMobileView("dashboard");
                if (window.matchMedia?.("(max-width: 999px)").matches) setAuraOpen(false);
                window.requestAnimationFrame(() =>
                  document.getElementById("crew-vitals")?.scrollIntoView?.({ block: "start" }),
                );
              }}
            />
          </div>
        </div>

        <footer className="app-footer">
          <span>ASTROPULSE · SIMULATED MISSION SUPPORT</span>
          <span>Not a medical device · Follow approved flight procedures</span>
          <span>LUNAR IMAGERY: NASA / LRO / GSFC · SIMULATED DATA ONLY</span>
        </footer>

        <SettingsDialog open={isDoctor && settingsOpen} onClose={closeSettings} />
      </div>
    </>
  );
}
