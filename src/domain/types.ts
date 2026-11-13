export type MissionMode = "lunar" | "mars";
export type ActivityState = "rest" | "exercise" | "eva" | "sleep";
export type AlertLevel = "nominal" | "caution" | "warning" | "emergency";
export type CrewSex = "Female" | "Male";
export type LogCategory = "Observation" | "Treatment" | "Follow-up";
export type TemperatureUnit = "C" | "F";
export type ScenarioId =
  | "cardiac-event"
  | "cabin-decompression"
  | "co2-buildup"
  | "radiation-spike"
  | "thermal-failure"
  | "ground-link-loss";

export interface SourceNote {
  label: string;
  url?: string;
  verified: boolean;
  note: string;
}

export interface SourcedNumber {
  value: number;
  source: SourceNote;
}

export interface Vitals {
  heartRateBpm: number;
  spo2Percent: number;
  temperatureC: number;
  stressIndex: number;
  radiationDoseMsv: number;
  radiationRateMsvPerDay: number;
  boneHealthIndex: number;
  muscleHealthIndex: number;
  fluidShiftIndex: number;
}

export interface CrewBaseline {
  restingHeartRateBpm: number;
  spo2Percent: number;
  temperatureC: number;
  stressIndex: number;
  radiationDoseMsv: number;
  radiationDemoReferenceMsv: number;
  source: SourceNote;
}

export interface HistoryPoint {
  elapsedSeconds: number;
  value: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  age: number;
  sex: CrewSex;
  avatar: string;
  baseline: CrewBaseline;
  vitals: Vitals;
  activityState: ActivityState;
  activityElapsedSeconds: number;
  workoutMinutes: number;
  cardioMinutes: number;
  resistanceMinutes: number;
  sleepHours24h: number;
  sleepQuality: number;
  heartRateHistory: HistoryPoint[];
  activityCycleOffsetSeconds: number;
}

export interface CabinState {
  temperatureC: number;
  oxygenPercent: number;
  carbonDioxidePercent: number;
  pressureKpa: number;
  humidityPercent: number;
}

export interface MissionModeProfile {
  id: MissionMode;
  label: string;
  missionName: string;
  groundSupport: "near-real-time" | "delayed";
  radiationContext: string;
  gravityContext: string;
  missionLengthDays: SourcedNumber;
  modeOnlyCard: "lunar-dust" | "isolation";
  startAt: string;
  source: SourceNote;
}

export interface MissionState {
  mode: MissionMode;
  selectedCrewId: string;
  solarConjunction: boolean;
  simulationSpeed: number;
  temperatureUnit: "C" | "F";
}

export interface Alert {
  id: string;
  level: Exclude<AlertLevel, "nominal">;
  title: string;
  reason: string;
  crewId?: string;
  protocolId: string;
  acknowledged: boolean;
  active: boolean;
  createdAt: string;
  source: SourceNote;
}

export interface AlertSignal {
  id: string;
  level: AlertLevel;
  title: string;
  reason: string;
  crewId?: string;
  protocolId: string;
  source: SourceNote;
}

export interface AlertHysteresisState {
  currentLevel: AlertLevel;
  pendingLevel: AlertLevel;
  pendingTicks: number;
  clearTicks: number;
}

export interface ScenarioTarget {
  crewId: string;
  start: Vitals;
  target: Partial<Vitals>;
}

export interface ScenarioInstance {
  id: ScenarioId;
  selectedCrewId: string;
  elapsedTicks: number;
  rampTicks: number;
  crewTargets: ScenarioTarget[];
  startCabin: CabinState;
  cabinTarget: Partial<CabinState>;
  startAt: string;
}

export interface SimulationState {
  crew: CrewMember[];
  cabin: CabinState;
  scenario: ScenarioInstance | null;
  resettingSeconds: number;
  elapsedSeconds: number;
  randomSeed: number;
}

export interface Protocol {
  id: string;
  title: string;
  steps: string[];
  marsAutonomousSteps: string[];
}

export interface MedicalLogEntry {
  id: string;
  crewId: string;
  category: LogCategory;
  timestamp: string;
  note: string;
}

export interface PersistedAppState {
  schemaVersion: number;
  mission: Pick<MissionState, "mode" | "selectedCrewId" | "solarConjunction" | "temperatureUnit">;
  medicalLog: MedicalLogEntry[];
  alarmVolume: number;
}
