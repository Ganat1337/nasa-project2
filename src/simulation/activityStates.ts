import type { ActivityState, SourceNote } from "@/domain/types";
import { ACTIVITY_HEART_RATE_RANGES } from "@/config/thresholds";

export interface ActivityProfile {
  id: ActivityState;
  label: string;
  durationSeconds: number;
  heartRateOffsetBpm: [number, number];
  stressOffset: number;
  source: SourceNote;
}

// UNVERIFIED: schedule and activity ranges are illustrative simulation parameters.
export const ACTIVITY_PROFILES: ActivityProfile[] = [
  {
    id: "rest",
    label: "Rest",
    durationSeconds: 43_200,
    heartRateOffsetBpm: [
      ACTIVITY_HEART_RATE_RANGES.rest.minOffsetFromRestBpm,
      ACTIVITY_HEART_RATE_RANGES.rest.maxOffsetFromRestBpm,
    ],
    stressOffset: 0,
    source: ACTIVITY_HEART_RATE_RANGES.rest.source,
  },
  {
    id: "exercise",
    label: "Exercise",
    durationSeconds: 3_600,
    heartRateOffsetBpm: [
      ACTIVITY_HEART_RATE_RANGES.exercise.minOffsetFromRestBpm,
      ACTIVITY_HEART_RATE_RANGES.exercise.maxOffsetFromRestBpm,
    ],
    stressOffset: 18,
    source: ACTIVITY_HEART_RATE_RANGES.exercise.source,
  },
  {
    id: "eva",
    label: "EVA",
    durationSeconds: 7_200,
    heartRateOffsetBpm: [
      ACTIVITY_HEART_RATE_RANGES.eva.minOffsetFromRestBpm,
      ACTIVITY_HEART_RATE_RANGES.eva.maxOffsetFromRestBpm,
    ],
    stressOffset: 15,
    source: ACTIVITY_HEART_RATE_RANGES.eva.source,
  },
  {
    id: "sleep",
    label: "Sleep",
    durationSeconds: 32_400,
    heartRateOffsetBpm: [
      ACTIVITY_HEART_RATE_RANGES.sleep.minOffsetFromRestBpm,
      ACTIVITY_HEART_RATE_RANGES.sleep.maxOffsetFromRestBpm,
    ],
    stressOffset: -8,
    source: ACTIVITY_HEART_RATE_RANGES.sleep.source,
  },
];

export function getActivityState(elapsedSeconds: number, phaseOffsetSeconds = 0): ActivityState {
  const cycleDuration = ACTIVITY_PROFILES.reduce(
    (total, profile) => total + profile.durationSeconds,
    0,
  );
  let position =
    (((elapsedSeconds + phaseOffsetSeconds) % cycleDuration) + cycleDuration) % cycleDuration;
  for (const profile of ACTIVITY_PROFILES) {
    if (position < profile.durationSeconds) return profile.id;
    position -= profile.durationSeconds;
  }
  return "rest";
}

export function getActivityProfile(state: ActivityState): ActivityProfile {
  return ACTIVITY_PROFILES.find((profile) => profile.id === state) ?? ACTIVITY_PROFILES[0];
}
