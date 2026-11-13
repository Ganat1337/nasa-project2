import type { MissionMode, ScenarioId } from "@/domain/types";
import type { ScenarioDefinition } from "@/simulation/engine";
import { THRESHOLD_SOURCE } from "./thresholds";

const shared = {
  source: THRESHOLD_SOURCE,
  rampTicks: 8,
};

// UNVERIFIED: scenario deltas and ramp durations are synthetic training effects, not medical predictions.
export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  "cardiac-event": {
    id: "cardiac-event",
    label: "Cardiac event — selected crew",
    diagnosisText: "Possible acute cardiac event threshold pattern",
    protocolId: "cardiac-event",
    affected: "selected",
    crewDelta: { heartRateBpm: 75, stressIndex: 45 },
    cabinDelta: {},
    ...shared,
  },
  "cabin-decompression": {
    id: "cabin-decompression",
    label: "Cabin decompression — all crew",
    diagnosisText: "Cabin pressure loss with crew oxygen saturation impact",
    protocolId: "cabin-decompression",
    affected: "all",
    crewDelta: { spo2Percent: -8, stressIndex: 28 },
    cabinDelta: { pressureKpa: 45, oxygenPercent: 16 },
    ...shared,
  },
  "co2-buildup": {
    id: "co2-buildup",
    label: "CO₂ buildup — all crew",
    diagnosisText: "Cabin carbon-dioxide increase with crew stress response",
    protocolId: "co2-buildup",
    affected: "all",
    crewDelta: { heartRateBpm: 24, spo2Percent: -3, stressIndex: 30 },
    cabinDelta: { carbonDioxidePercent: 1.2 },
    ...shared,
  },
  "radiation-spike": {
    id: "radiation-spike",
    label: "Solar particle event — radiation spike",
    diagnosisText: "Simulated elevated radiation rate",
    protocolId: "radiation-spike",
    affected: "all",
    crewDelta: { radiationRateMsvPerDay: 4 },
    cabinDelta: {},
    ...shared,
  },
  "thermal-failure": {
    id: "thermal-failure",
    label: "Thermal regulation failure — all crew",
    diagnosisText: "Cabin thermal-control excursion",
    protocolId: "thermal-failure",
    affected: "all",
    crewDelta: { temperatureC: 1.8, stressIndex: 20 },
    cabinDelta: { temperatureC: 32 },
    ...shared,
  },
  "ground-link-loss": {
    id: "ground-link-loss",
    label: "Ground-link loss during medical event (Mars only)",
    diagnosisText: "Communications unavailable; autonomous protocol mode",
    protocolId: "ground-link-loss",
    affected: "none",
    crewDelta: {},
    cabinDelta: {},
    modes: ["mars"] satisfies MissionMode[],
    ...shared,
  },
};
