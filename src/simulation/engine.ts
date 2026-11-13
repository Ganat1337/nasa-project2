import type {
  ActivityState,
  CabinState,
  CrewMember,
  MissionMode,
  ScenarioId,
  ScenarioInstance,
  SimulationState,
  SourceNote,
  Vitals,
} from "@/domain/types";
import { CREW_PROFILES } from "@/data/crew";
import { SCENARIOS } from "@/config/scenarios";
import { MISSION_PROFILES } from "@/config/missions";
import { ACTIVITY_PROFILES, getActivityProfile, getActivityState } from "./activityStates";
import { CABIN_BASELINE, createCabinBaseline } from "./cabin";
import { coupleCabinToCrew } from "./coupling";

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  diagnosisText: string;
  protocolId: string;
  affected: "selected" | "all" | "none";
  crewDelta: Partial<Vitals>;
  cabinDelta: Partial<CabinState>;
  rampTicks: number;
  source: SourceNote;
  modes?: MissionMode[];
}

// UNVERIFIED: 2-second tick, demo drift rates, and seeded random walk are simulation choices.
export const SIMULATION_TICK_SECONDS = 2;
const DEFAULT_SEED = 1_209_031;
const RESET_DURATION_SECONDS = 16;

function nextRandom(seed: number): { value: number; seed: number } {
  let nextSeed = seed | 0;
  nextSeed ^= nextSeed << 13;
  nextSeed ^= nextSeed >>> 17;
  nextSeed ^= nextSeed << 5;
  return { value: (nextSeed >>> 0) / 4_294_967_296, seed: nextSeed >>> 0 };
}

function approach(current: number, target: number, amount: number): number {
  return current + Math.max(-amount, Math.min(amount, target - current));
}

function drift(
  current: number,
  target: number,
  maxStep: number,
  noise: number,
  random: number,
): number {
  return approach(current, target, maxStep) + (random * 2 - 1) * noise;
}

function cloneCrew(crew: CrewMember[]): CrewMember[] {
  return crew.map((member) => ({
    ...member,
    baseline: { ...member.baseline },
    vitals: { ...member.vitals },
    heartRateHistory: member.heartRateHistory.map((point) => ({ ...point })),
  }));
}

export function createInitialSimulation(seed = DEFAULT_SEED): SimulationState {
  return {
    crew: cloneCrew(CREW_PROFILES),
    cabin: createCabinBaseline(),
    scenario: null,
    resettingSeconds: 0,
    elapsedSeconds: 0,
    randomSeed: seed,
  };
}

function simulateCrewMember(
  member: CrewMember,
  elapsedSeconds: number,
  seed: number,
  tickSeconds: number,
): { member: CrewMember; seed: number } {
  const activityState = getActivityState(elapsedSeconds, member.activityCycleOffsetSeconds);
  const activity = getActivityProfile(activityState);
  const timeFactor = tickSeconds / SIMULATION_TICK_SECONDS;
  const noiseFactor = Math.sqrt(timeFactor);
  let random = nextRandom(seed);
  const hrRange = activity.heartRateOffsetBpm;
  const heartRateTarget = member.baseline.restingHeartRateBpm + (hrRange[0] + hrRange[1]) / 2;
  const stressTarget = Math.max(
    0,
    Math.min(100, member.baseline.stressIndex + activity.stressOffset),
  );
  const vitals: Vitals = {
    ...member.vitals,
    heartRateBpm: Math.round(
      drift(
        member.vitals.heartRateBpm,
        heartRateTarget,
        1.4 * timeFactor,
        0.55 * noiseFactor,
        random.value,
      ),
    ),
  };
  random = nextRandom(random.seed);
  vitals.spo2Percent = Number(
    drift(
      member.vitals.spo2Percent,
      member.baseline.spo2Percent,
      0.12 * timeFactor,
      0.03 * noiseFactor,
      random.value,
    ).toFixed(1),
  );
  random = nextRandom(random.seed);
  vitals.temperatureC = Number(
    drift(
      member.vitals.temperatureC,
      member.baseline.temperatureC,
      0.012 * timeFactor,
      0.003 * noiseFactor,
      random.value,
    ).toFixed(2),
  );
  random = nextRandom(random.seed);
  vitals.stressIndex = Number(
    drift(
      member.vitals.stressIndex,
      stressTarget,
      1.2 * timeFactor,
      0.45 * noiseFactor,
      random.value,
    ).toFixed(1),
  );
  vitals.radiationDoseMsv = Number(
    (
      member.vitals.radiationDoseMsv +
      (member.vitals.radiationRateMsvPerDay * tickSeconds) / 86_400
    ).toFixed(5),
  );
  vitals.boneHealthIndex = Number(
    approach(member.vitals.boneHealthIndex, 90, 0.002 * timeFactor).toFixed(2),
  );
  vitals.muscleHealthIndex = Number(
    approach(member.vitals.muscleHealthIndex, 93, 0.002 * timeFactor).toFixed(2),
  );
  vitals.fluidShiftIndex = Number(
    approach(member.vitals.fluidShiftIndex, 25, 0.04 * timeFactor).toFixed(1),
  );
  const history = [
    ...member.heartRateHistory,
    { elapsedSeconds, value: vitals.heartRateBpm },
  ].slice(-60);
  return {
    member: {
      ...member,
      vitals,
      activityState,
      activityElapsedSeconds: member.activityElapsedSeconds + tickSeconds,
      heartRateHistory: history,
      workoutMinutes: member.workoutMinutes + (activityState === "exercise" ? tickSeconds / 60 : 0),
    },
    seed: random.seed,
  };
}

function applyScenario(
  instance: ScenarioInstance,
  crew: CrewMember[],
  cabin: CabinState,
  tickFraction: number,
): { crew: CrewMember[]; cabin: CabinState } {
  const progress = Math.min(1, (instance.elapsedTicks + tickFraction) / instance.rampTicks);
  const updatedCrew = crew.map((member) => {
    const target = instance.crewTargets.find((item) => item.crewId === member.id);
    if (!target) return member;
    const vitals = { ...member.vitals };
    for (const [key, endValue] of Object.entries(target.target) as [keyof Vitals, number][]) {
      const startValue = target.start[key];
      vitals[key] = startValue + (endValue - startValue) * progress;
    }
    return { ...member, vitals };
  });
  const nextCabin = { ...cabin };
  for (const [key, endValue] of Object.entries(instance.cabinTarget) as [
    keyof CabinState,
    number,
  ][]) {
    const startValue = instance.startCabin[key];
    nextCabin[key] = startValue + (endValue - startValue) * progress;
  }
  return { crew: updatedCrew, cabin: nextCabin };
}

function rampTowardBaseline(state: SimulationState, tickSeconds: number): SimulationState {
  const remaining = state.resettingSeconds;
  const progress = Math.min(1, tickSeconds / remaining);
  const elapsedSeconds = state.elapsedSeconds + tickSeconds;
  const crew = state.crew.map((member) => {
    const vitals = { ...member.vitals };
    const baseline: Vitals = {
      heartRateBpm: member.baseline.restingHeartRateBpm,
      spo2Percent: member.baseline.spo2Percent,
      temperatureC: member.baseline.temperatureC,
      stressIndex: member.baseline.stressIndex,
      radiationDoseMsv: member.baseline.radiationDoseMsv,
      radiationRateMsvPerDay: 0.2,
      boneHealthIndex: 92,
      muscleHealthIndex: 95,
      fluidShiftIndex: 18,
    };
    for (const key of Object.keys(baseline) as (keyof Vitals)[]) {
      const target = baseline[key];
      vitals[key] = approach(vitals[key], target, Math.abs(vitals[key] - target) * progress);
    }
    const activityState = getActivityState(elapsedSeconds, member.activityCycleOffsetSeconds);
    return {
      ...member,
      vitals,
      activityState,
      activityElapsedSeconds: member.activityElapsedSeconds + tickSeconds,
      workoutMinutes: member.workoutMinutes + (activityState === "exercise" ? tickSeconds / 60 : 0),
      heartRateHistory: [
        ...member.heartRateHistory,
        { elapsedSeconds, value: vitals.heartRateBpm },
      ].slice(-60),
    };
  });
  const cabin: CabinState = {
    temperatureC: approach(
      state.cabin.temperatureC,
      CABIN_BASELINE.temperatureC,
      Math.abs(state.cabin.temperatureC - CABIN_BASELINE.temperatureC) * progress,
    ),
    oxygenPercent: approach(
      state.cabin.oxygenPercent,
      CABIN_BASELINE.oxygenPercent,
      Math.abs(state.cabin.oxygenPercent - CABIN_BASELINE.oxygenPercent) * progress,
    ),
    carbonDioxidePercent: approach(
      state.cabin.carbonDioxidePercent,
      CABIN_BASELINE.carbonDioxidePercent,
      Math.abs(state.cabin.carbonDioxidePercent - CABIN_BASELINE.carbonDioxidePercent) * progress,
    ),
    pressureKpa: approach(
      state.cabin.pressureKpa,
      CABIN_BASELINE.pressureKpa,
      Math.abs(state.cabin.pressureKpa - CABIN_BASELINE.pressureKpa) * progress,
    ),
    humidityPercent: approach(
      state.cabin.humidityPercent,
      CABIN_BASELINE.humidityPercent,
      Math.abs(state.cabin.humidityPercent - CABIN_BASELINE.humidityPercent) * progress,
    ),
  };
  return {
    ...state,
    crew,
    cabin,
    resettingSeconds: Math.max(0, remaining - tickSeconds),
    elapsedSeconds,
    randomSeed: state.randomSeed,
  };
}

function advanceSimulationStep(state: SimulationState, tickSeconds: number): SimulationState {
  let seed = state.randomSeed;
  const elapsedSeconds = state.elapsedSeconds + tickSeconds;
  const timeFactor = tickSeconds / SIMULATION_TICK_SECONDS;
  let crew = state.crew.map((member) => {
    const result = simulateCrewMember(member, elapsedSeconds, seed, tickSeconds);
    seed = result.seed;
    return result.member;
  });
  let cabin: CabinState = {
    ...state.cabin,
    temperatureC: approach(
      state.cabin.temperatureC,
      CABIN_BASELINE.temperatureC,
      0.03 * timeFactor,
    ),
    oxygenPercent: approach(
      state.cabin.oxygenPercent,
      CABIN_BASELINE.oxygenPercent,
      0.02 * timeFactor,
    ),
    carbonDioxidePercent: approach(
      state.cabin.carbonDioxidePercent,
      CABIN_BASELINE.carbonDioxidePercent,
      0.01 * timeFactor,
    ),
    pressureKpa: approach(state.cabin.pressureKpa, CABIN_BASELINE.pressureKpa, 0.03 * timeFactor),
    humidityPercent: approach(
      state.cabin.humidityPercent,
      CABIN_BASELINE.humidityPercent,
      0.1 * timeFactor,
    ),
  };
  const tickFraction = tickSeconds / SIMULATION_TICK_SECONDS;
  if (state.scenario) {
    const applied = applyScenario(state.scenario, crew, cabin, tickFraction);
    crew = applied.crew;
    cabin = applied.cabin;
  }
  crew = coupleCabinToCrew(crew, cabin);

  const nextScenario = state.scenario
    ? {
        ...state.scenario,
        elapsedTicks: Math.min(
          state.scenario.rampTicks,
          state.scenario.elapsedTicks + tickFraction,
        ),
      }
    : null;
  return {
    ...state,
    crew,
    cabin,
    scenario: nextScenario,
    elapsedSeconds,
    randomSeed: seed,
  };
}

export function tickSimulation(state: SimulationState, speed = 1): SimulationState {
  if (!Number.isFinite(speed) || speed < 0.5 || speed > 4) {
    throw new Error("Simulation speed must be between 0.5x and 4x.");
  }

  let next = state;
  let remainingSeconds = SIMULATION_TICK_SECONDS * speed;
  while (remainingSeconds > 0) {
    const stepSeconds = Math.min(SIMULATION_TICK_SECONDS, remainingSeconds);
    if (next.resettingSeconds > 0) {
      const resetStep = Math.min(stepSeconds, next.resettingSeconds);
      next = rampTowardBaseline(next, resetStep);
      remainingSeconds -= resetStep;
    } else {
      next = advanceSimulationStep(next, stepSeconds);
      remainingSeconds -= stepSeconds;
    }
  }
  return next;
}

export function startScenario(
  state: SimulationState,
  id: ScenarioId,
  selectedCrewId: string,
  mode: MissionMode,
): SimulationState {
  const definition = SCENARIOS[id];
  if (definition.modes && !definition.modes.includes(mode)) {
    throw new Error(`${definition.label} is not available in ${mode} mode.`);
  }
  const targets =
    definition.affected === "none"
      ? []
      : state.crew
          .filter((member) => definition.affected === "all" || member.id === selectedCrewId)
          .map((member) => ({
            crewId: member.id,
            start: { ...member.vitals },
            target: Object.fromEntries(
              Object.entries(definition.crewDelta).map(([key, delta]) => [
                key,
                member.vitals[key as keyof Vitals] + (delta as number),
              ]),
            ) as Partial<Vitals>,
          }));
  const instance: ScenarioInstance = {
    id,
    selectedCrewId,
    elapsedTicks: 0,
    rampTicks: definition.rampTicks,
    crewTargets: targets,
    startCabin: { ...state.cabin },
    cabinTarget: { ...definition.cabinDelta },
    startAt: new Date(
      Date.parse(MISSION_PROFILES[mode].startAt) + state.elapsedSeconds * 1_000,
    ).toISOString(),
  };
  return { ...state, scenario: instance, resettingSeconds: 0 };
}

export function resetSimulation(state: SimulationState): SimulationState {
  return { ...state, scenario: null, resettingSeconds: RESET_DURATION_SECONDS };
}

export function activityStateLabel(state: ActivityState): string {
  return ACTIVITY_PROFILES.find((profile) => profile.id === state)?.label ?? "Rest";
}
