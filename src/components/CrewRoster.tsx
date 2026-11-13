import { useAppStore } from "@/store";
import { MISSION_PROFILES } from "@/config/missions";
import { GlassCard, SectionHeader } from "./ui";

function crewStatus(
  crewId: string,
  alerts: ReturnType<typeof useAppStore.getState>["alerts"],
): "nominal" | "watch" | "critical" {
  const active = alerts.filter((alert) => alert.active && alert.crewId === crewId);
  const shared = alerts.filter((alert) => alert.active && !alert.crewId);
  if (shared.some((alert) => alert.level === "emergency")) return "critical";
  if (shared.some((alert) => alert.level === "warning" || alert.level === "caution"))
    return "watch";
  if (active.some((alert) => alert.level === "emergency")) return "critical";
  if (active.some((alert) => alert.level === "warning" || alert.level === "caution"))
    return "watch";
  return "nominal";
}

export function CrewRoster() {
  const crew = useAppStore((state) => state.simulation.crew);
  const selectedCrewId = useAppStore((state) => state.selectedCrewId);
  const alerts = useAppStore((state) => state.alerts);
  const mode = useAppStore((state) => state.mode);
  const selectCrew = useAppStore((state) => state.selectCrew);

  return (
    <GlassCard className="panel crew-panel">
      <SectionHeader
        className="panel-heading"
        kicker="MISSION PERSONNEL"
        title={
          <>
            Crew roster{" "}
            <span className="heading-count">{String(crew.length).padStart(2, "0")}</span>
          </>
        }
        aside={<span className="micro-label">LIVE</span>}
      />
      <div className="crew-list">
        {crew.map((member, index) => {
          const status = crewStatus(member.id, alerts);
          const selected = selectedCrewId === member.id;
          return (
            <button
              className={`crew-card ${selected ? "is-selected" : ""}`}
              key={member.id}
              onClick={() => selectCrew(member.id)}
              aria-pressed={selected}
              aria-label={`Select ${member.name}, ${member.role}`}
            >
              <span className="crew-card__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="crew-avatar" aria-hidden="true">
                {member.avatar}
              </span>
              <span className="crew-card__identity">
                <strong>{member.name}</strong>
                <small>{member.role}</small>
                <span className="crew-card__vitals">
                  <span>
                    {member.vitals.heartRateBpm} <small>BPM</small>
                  </span>
                  <span>
                    {member.vitals.spo2Percent.toFixed(0)}
                    <small>% O₂</small>
                  </span>
                </span>
              </span>
              <span className={`crew-status crew-status--${status}`} title={status} />
            </button>
          );
        })}
      </div>
      <div className="roster-summary">
        <span>
          <i className="crew-status crew-status--nominal" /> Nominal
        </span>
        <span>
          <i className="crew-status crew-status--watch" /> Watch
        </span>
        <span>
          <i className="crew-status crew-status--critical" /> Critical
        </span>
      </div>
      <div className="mission-context-card">
        <p className="eyebrow">MISSION CONTEXT</p>
        <div>
          <span>Ground support</span>
          <strong>
            {MISSION_PROFILES[mode].groundSupport === "delayed"
              ? "Delayed / simulated"
              : "Near-real-time"}
          </strong>
        </div>
        <div>
          <span>Gravity profile</span>
          <strong>{mode === "lunar" ? "Transit / Gateway" : "Deep-space transit"}</strong>
        </div>
      </div>
    </GlassCard>
  );
}
