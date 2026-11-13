import type { MissionMode, MissionModeProfile, SourceNote } from "@/domain/types";

const source = (
  label: string,
  url?: string,
  verified = false,
  note = "Illustrative mission-profile value.",
) =>
  ({
    label,
    url,
    verified,
    note,
  }) satisfies SourceNote;

export const MISSION_PROFILES: Record<MissionMode, MissionModeProfile> = {
  lunar: {
    id: "lunar",
    label: "Lunar",
    missionName: "Artemis IV / Gateway",
    groundSupport: "near-real-time",
    radiationContext: "Lunar transit and Gateway radiation context",
    gravityContext: "Gateway microgravity · lunar surface about 1/6 g",
    missionLengthDays: {
      value: 14,
      source: source("UNVERIFIED — fictional mission duration"),
    },
    modeOnlyCard: "lunar-dust",
    startAt: "2026-06-24T00:00:00.000Z",
    source: source(
      "NASA Moon Facts",
      "https://science.nasa.gov/moon/facts/",
      true,
      "NASA states lunar surface gravity is one-sixth of Earth's; the Gateway microgravity context and fictional mission schedule are illustrative.",
    ),
  },
  mars: {
    id: "mars",
    label: "Mars",
    missionName: "Mars Transit / Surface",
    groundSupport: "delayed",
    radiationContext: "Deep-space cruise exposure and surface context",
    gravityContext: "Microgravity in transit · Mars surface gravity is lower than Earth's",
    missionLengthDays: {
      value: 540,
      source: source("UNVERIFIED — fictional mission duration"),
    },
    modeOnlyCard: "isolation",
    startAt: "2026-06-24T00:00:00.000Z",
    source: source(
      "NASA Mars Facts",
      "https://science.nasa.gov/mars/facts/",
      true,
      "NASA describes Mars' distance and day length; the mission profile and delay model remain illustrative.",
    ),
  },
};

export const LIGHT_SPEED_KM_PER_SECOND = {
  value: 299_792.458,
  source: source(
    "NIST speed of light in vacuum",
    "https://physics.nist.gov/cgi-bin/cuu/Value?c",
    true,
    "NIST gives the exact value 299,792,458 m/s; converted here to km/s.",
  ),
};

// UNVERIFIED: this sinusoidal distance approximation is illustrative, not an ephemeris.
export function getMarsOneWayDelaySeconds(
  elapsedDays: number,
  solarConjunction: boolean,
): number | null {
  if (solarConjunction) return null;
  const cycle = (2 * Math.PI * elapsedDays) / 780;
  const earthMarsDistanceKm = 54_000_000 + ((401_000_000 - 54_000_000) * (1 - Math.cos(cycle))) / 2;
  return earthMarsDistanceKm / LIGHT_SPEED_KM_PER_SECOND.value;
}
