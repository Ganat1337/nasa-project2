import { useMemo, useState, type FormEvent } from "react";
import { getCabinSeverity } from "@/config/thresholds";
import { MEDICAL_PROTOCOLS } from "@/data/protocols";
import type { Alert, CrewMember, LogCategory } from "@/domain/types";
import { useAppStore } from "@/store";
import { CapsuleButton, GlassCard, StatusPill, Timeline } from "./ui";

const LEVEL_LABEL: Record<Alert["level"], string> = {
  caution: "CAUTION",
  warning: "WARNING",
  emergency: "EMERGENCY",
};

function utcTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function AlertCard({ alert }: { alert: Alert }) {
  const acknowledge = useAppStore((state) => state.acknowledgeAlert);
  const mode = useAppStore((state) => state.mode);
  const protocol = MEDICAL_PROTOCOLS[alert.protocolId];
  const steps =
    mode === "mars" ? (protocol?.marsAutonomousSteps ?? protocol?.steps) : protocol?.steps;

  return (
    <article className={`alert-card alert-card--${alert.level}`}>
      <div className="alert-card__topline">
        <StatusPill
          className={`alert-severity alert-severity--${alert.level}`}
          icon={<i />}
          level={alert.level}
        >
          {LEVEL_LABEL[alert.level]}
        </StatusPill>
        <time dateTime={alert.createdAt}>{utcTime(alert.createdAt)} UTC</time>
      </div>
      <h4>{alert.title}</h4>
      <p className="alert-reason">{alert.reason}</p>
      {protocol && steps && (
        <div className="protocol-block">
          <p className="eyebrow">{protocol.title} · DEMO GUIDE</p>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      <div className="alert-card__footer">
        <span className="source-label" title={alert.source.note}>
          {alert.source.verified ? "SOURCE VERIFIED" : "ILLUSTRATIVE RULE"}
        </span>
        {alert.active && !alert.acknowledged && (
          <CapsuleButton
            className="text-button"
            onClick={() => acknowledge(alert.id)}
            variant="secondary"
          >
            Acknowledge
          </CapsuleButton>
        )}
        {alert.acknowledged && <span className="acknowledged-label">ACKNOWLEDGED</span>}
        {!alert.active && <span className="resolved-label">CLEARED</span>}
      </div>
    </article>
  );
}

function AlertCenter() {
  const alerts = useAppStore((state) => state.alerts);
  const acknowledgeAll = useAppStore((state) => state.acknowledgeAll);
  const active = alerts.filter((alert) => alert.active);
  const history = alerts.filter((alert) => !alert.active).slice(0, 3);

  return (
    <GlassCard
      className={`panel alert-center ${active.some((alert) => alert.level === "emergency") ? "alert-center--critical" : ""}`}
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AI-ASSISTED RULE MONITOR</p>
          <h3>Alert & action center</h3>
        </div>
        <span className={`alert-state ${active.length ? "alert-state--active" : ""}`}>
          <i /> {active.length ? `${active.length} ACTIVE` : "ALL NOMINAL"}
        </span>
      </div>
      {active.length > 0 ? (
        <>
          {active.some((alert) => !alert.acknowledged) && (
            <CapsuleButton
              className="acknowledge-all"
              onClick={acknowledgeAll}
              variant="secondary"
            >
              Acknowledge all active
            </CapsuleButton>
          )}
          <div className="alert-list">
            {active.slice(0, 4).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
          {active.length > 4 && (
            <p className="fine-print">Showing 4 of {active.length} active signals.</p>
          )}
        </>
      ) : (
        <div className="nominal-state">
          <div className="nominal-state__icon" aria-hidden="true">
            ✓
          </div>
          <div>
            <strong>All monitored values nominal</strong>
            <p>Rule-based demo monitor · No diagnosis implied</p>
          </div>
        </div>
      )}
      {history.length > 0 && (
        <details className="alert-history">
          <summary>
            Recent cleared alerts <span>{history.length}</span>
          </summary>
          <div className="alert-list">
            {history.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </details>
      )}
      <p className="medical-disclaimer">
        Automated values are illustrative. Verify sensors and defer to approved medical and vehicle
        procedures.
      </p>
    </GlassCard>
  );
}

function CabinCard() {
  const cabin = useAppStore((state) => state.simulation.cabin);
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const severity = getCabinSeverity(cabin);
  const temperature =
    temperatureUnit === "C"
      ? `${cabin.temperatureC.toFixed(1)}°C`
      : `${((cabin.temperatureC * 9) / 5 + 32).toFixed(1)}°F`;
  return (
    <GlassCard className={`panel cabin-panel ${severity === "emergency" ? "panel--critical" : ""}`}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">LIFE-SUPPORT TELEMETRY</p>
          <h3>Cabin environment</h3>
        </div>
        <StatusPill
          className={`micro-label ${severity !== "nominal" ? "text-warning" : ""}`}
          level={severity}
        >
          {severity === "nominal" ? "NOMINAL" : severity.toUpperCase()}
        </StatusPill>
      </div>
      <div className="cabin-grid">
        <div>
          <span className="cabin-symbol">°</span>
          <strong>{temperature}</strong>
          <span>Temperature</span>
        </div>
        <div>
          <span className="cabin-symbol">O₂</span>
          <strong>
            {cabin.oxygenPercent.toFixed(1)}
            <small>%</small>
          </strong>
          <span>Oxygen</span>
        </div>
        <div>
          <span className="cabin-symbol">CO₂</span>
          <strong>
            {cabin.carbonDioxidePercent.toFixed(2)}
            <small>%</small>
          </strong>
          <span>Carbon dioxide</span>
        </div>
        <div>
          <span className="cabin-symbol">P</span>
          <strong>
            {cabin.pressureKpa.toFixed(1)}
            <small>kPa</small>
          </strong>
          <span>Pressure</span>
        </div>
      </div>
      <div className="cabin-footer">
        <span>Humidity {cabin.humidityPercent.toFixed(0)}%</span>
        <span>SIMULATED BASELINE</span>
      </div>
      <p className="fine-print">
        Environment readings are fictional demo data, not spacecraft operating setpoints.
      </p>
    </GlassCard>
  );
}

function MedicalLog({ crew }: { crew: CrewMember }) {
  const medicalLog = useAppStore((state) => state.medicalLog);
  const logs = useMemo(
    () => medicalLog.filter((entry) => entry.crewId === crew.id),
    [crew.id, medicalLog],
  );
  const addMedicalNote = useAppStore((state) => state.addMedicalNote);
  const deleteMedicalNote = useAppStore((state) => state.deleteMedicalNote);
  const clearMedicalNotes = useAppStore((state) => state.clearMedicalNotes);
  const [category, setCategory] = useState<LogCategory>("Observation");
  const [note, setNote] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!note.trim()) return;
    addMedicalNote(crew.id, category, note);
    setNote("");
  };

  const downloadCsv = () => {
    const header = ["Timestamp UTC", "Crew", "Category", "Note"];
    const lines = logs.map((entry) =>
      [entry.timestamp, crew.name, entry.category, entry.note]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `astropulse-${crew.id}-medical-log.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  return (
    <GlassCard className="panel medical-log-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">FLIGHT SURGEON WORKSPACE</p>
          <h3>Medical log</h3>
        </div>
        <span className="micro-label">{logs.length} ENTRIES</span>
      </div>
      <form className="log-form" onSubmit={submit}>
        <label>
          <span className="sr-only">Medical note category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as LogCategory)}
          >
            <option>Observation</option>
            <option>Treatment</option>
            <option>Follow-up</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Medical note for {crew.name}</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={`Add note for ${crew.name}…`}
            rows={2}
            maxLength={1_000}
          />
        </label>
        <div className="log-form__actions">
          <span>Saved locally · UTC timestamps</span>
          <button className="button button--small" type="submit" disabled={!note.trim()}>
            Add note
          </button>
        </div>
      </form>
      {logs.length > 0 ? (
        <>
          <Timeline className="log-list">
            {logs.slice(0, 5).map((entry) => (
              <li className="log-entry" key={entry.id}>
                <div className="log-entry__meta">
                  <span>{entry.category}</span>
                  <time dateTime={entry.timestamp}>{utcTime(entry.timestamp)} UTC</time>
                </div>
                <p>{entry.note}</p>
                <button
                  className="log-delete"
                  aria-label={`Delete note from ${utcTime(entry.timestamp)} UTC`}
                  onClick={() => deleteMedicalNote(entry.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </Timeline>
          <div className="log-footer">
            <button className="text-button" onClick={downloadCsv}>
              Export CSV
            </button>
            <button
              className="text-button text-button--muted"
              onClick={() => clearMedicalNotes(crew.id)}
            >
              Clear {crew.name.split(" ")[0]}'s log
            </button>
          </div>
        </>
      ) : (
        <div className="empty-log">
          No notes yet for {crew.name}. Entries remain in this browser.
        </div>
      )}
    </GlassCard>
  );
}

export function OperationsPanel({ crew }: { crew: CrewMember }) {
  return (
    <div className="operations-stack">
      <AlertCenter />
      <CabinCard />
      <MedicalLog crew={crew} />
    </div>
  );
}
