import type { CabinState, SourceNote } from "@/domain/types";

export const CABIN_BASELINE_SOURCE: SourceNote = {
  label: "UNVERIFIED — illustrative habitat baseline",
  verified: false,
  note: "Not asserted as an Orion, ISS, Gateway, or Mars vehicle operating specification.",
};

// UNVERIFIED: cabin values are illustrative placeholders, not spacecraft setpoints.
export const CABIN_BASELINE: CabinState = {
  temperatureC: 21.4,
  oxygenPercent: 20.9,
  carbonDioxidePercent: 0.1,
  pressureKpa: 101.3,
  humidityPercent: 45,
};

export function createCabinBaseline(): CabinState {
  return { ...CABIN_BASELINE };
}
