import { SCENARIOS } from "@/config/scenarios";
import type { ScenarioId } from "@/domain/types";
import { useAppStore } from "@/store";

const SCENARIO_ORDER: ScenarioId[] = [
  "cardiac-event",
  "cabin-decompression",
  "co2-buildup",
  "radiation-spike",
  "thermal-failure",
  "ground-link-loss",
];

export function ScenarioControls({ activeScenario }: { activeScenario: ScenarioId | null }) {
  const mode = useAppStore((state) => state.mode);
  const launchScenario = useAppStore((state) => state.launchScenario);

  return (
    <section className="panel scenario-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRAINING / SIMULATION</p>
          <h3>Mission scenarios</h3>
        </div>
        <span className="micro-label">DEMO ONLY</span>
      </div>
      <div className="scenario-list">
        {SCENARIO_ORDER.filter(
          (id) => !SCENARIOS[id].modes || SCENARIOS[id].modes?.includes(mode),
        ).map((id) => {
          const scenario = SCENARIOS[id];
          return (
            <button
              key={id}
              className={`scenario-button ${activeScenario === id ? "is-active" : ""}`}
              disabled={Boolean(activeScenario)}
              onClick={() => launchScenario(id)}
              title={scenario.diagnosisText}
            >
              <span>{scenario.label}</span>
              <span aria-hidden="true">↗</span>
            </button>
          );
        })}
      </div>
      <p className="fine-print">
        Synthetic events are for interface demonstration only and do not represent validated
        clinical scenarios.
      </p>
    </section>
  );
}
