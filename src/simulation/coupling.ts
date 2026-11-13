import type { CabinState, CrewMember } from "@/domain/types";
import { THRESHOLDS } from "@/config/thresholds";

export interface CabinEffect {
  oxygenDeficit: boolean;
  carbonDioxideExcess: boolean;
  affectsCrew: boolean;
}

// UNVERIFIED: the simulated saturation and stress response rates are illustrative coupling coefficients.
export function getCabinEffect(cabin: CabinState): CabinEffect {
  const oxygenDeficit = cabin.oxygenPercent < THRESHOLDS.cabin.lowOxygenPercent.value;
  const carbonDioxideExcess =
    cabin.carbonDioxidePercent > THRESHOLDS.cabin.highCarbonDioxidePercent.value;
  return {
    oxygenDeficit,
    carbonDioxideExcess,
    affectsCrew: oxygenDeficit || carbonDioxideExcess,
  };
}

export function coupleCabinToCrew(crew: CrewMember[], cabin: CabinState): CrewMember[] {
  const effect = getCabinEffect(cabin);
  if (!effect.affectsCrew) return crew;

  return crew.map((member) => ({
    ...member,
    vitals: {
      ...member.vitals,
      spo2Percent: Math.max(70, member.vitals.spo2Percent - (effect.oxygenDeficit ? 0.12 : 0.06)),
      stressIndex: Math.min(
        100,
        member.vitals.stressIndex + (effect.carbonDioxideExcess ? 0.8 : 0.4),
      ),
    },
  }));
}
