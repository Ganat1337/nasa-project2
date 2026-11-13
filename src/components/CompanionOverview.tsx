import { useMemo, useState } from "react";
import { personalInsights, sharedCrewInsights, createCrewReport } from "@/aura/companion";
import type { Alert, CrewMember } from "@/domain/types";

interface Props {
  isDoctor: boolean;
  selected: CrewMember;
  crew: CrewMember[];
  alerts: Alert[];
  connectionAvailable: boolean;
  onTalk: (message?: string) => void;
  onInvestigate: (crewId: string) => void;
}
export function CompanionOverview({isDoctor, selected, crew, alerts, connectionAvailable, onTalk, onInvestigate}: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const insights = useMemo(() => isDoctor
    ? [...crew.flatMap((m) => personalInsights(m, alerts)), ...sharedCrewInsights(crew)]
    : personalInsights(selected, alerts), [isDoctor, selected, crew, alerts]);
  const visible = insights.filter((i) => !dismissed.includes(i.id));
  const urgent = visible.filter((i) => i.level !== "info");
  function exportReport() {
    const text = isDoctor ? crew.map(createCrewReport).join("\n\n---\n\n") : createCrewReport(selected);
    const url = URL.createObjectURL(new Blob([text], {type: "text/plain;charset=utf-8"}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AURA-${isDoctor ? "crew" : selected.id}-report.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return <section className="companion-card" aria-label={isDoctor ? "Crew intelligence" : "Personal health companion"}>
    <div className="companion-card__head">
      <div>
        <span className="companion-card__eyebrow">✦ AURA · {isDoctor ? "Crew intelligence" : "Personal companion"}</span>
        <h2>{isDoctor ? "Autonomous crew watch" : `Hello, ${selected.name.split(" ")[0]} 👋`}</h2>
        <p>{isDoctor ? "Monitoring simulated telemetry across the entire crew." : "I'm watching your simulated health readings. You can talk to me whenever you need support."}</p>
      </div>
      <span className={connectionAvailable ? "companion-badge" : "companion-badge companion-badge--offline"}>{connectionAvailable ? "AI connected*" : "Local support"}</span>
    </div>
    {!connectionAvailable && <p className="companion-card__offline" role="status">Ground/AI connection unavailable. Local health watch and preset guidance remain available. AI conversation cannot work without an API connection.</p>}
    {visible.length === 0 ? <p className="companion-card__clear" role="status">✓ No active personalized concerns detected in the current simulated snapshot.</p> : <div className="companion-card__insights" aria-live="polite">
      {visible.slice(0, 6).map((insight) => <article className={`companion-insight companion-insight--${insight.level}`} key={insight.id}>
        <div><strong>{insight.level === "emergency" ? "🚨 " : insight.level === "warning" ? "⚠️ " : "✧ "}{insight.title}</strong><p>{insight.description}</p></div>
        <div className="companion-insight__actions">
          {insight.crewId && <button className="button" onClick={() => onInvestigate(insight.crewId!)}>Investigate</button>}
          <button className="button" onClick={() => setDismissed((prev) => [...prev, insight.id])}>Dismiss</button>
        </div>
      </article>)}
      {visible.length > 6 && <p>{visible.length - 6} more observations. Open the operations panel to view all alerts.</p>}
    </div>}
    <div className="companion-card__actions">
      <button className="button companion-card__primary" onClick={() => onTalk(isDoctor ? "How is the crew doing today?" : "I'd like to talk about how I'm feeling.")}>{isDoctor ? "Ask AURA about crew" : "Talk to AURA"}</button>
      <button className="button" onClick={exportReport}>Export {isDoctor ? "crew" : "my"} report</button>
      {!isDoctor && urgent.length > 0 && <span className="companion-card__urgent">{urgent.length} active alert(s)</span>}
    </div>
    <small>* AI chat requires the Gemini API service. Demo data only · Not a medical device.</small>
  </section>;
}
