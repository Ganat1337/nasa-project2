import type { StateCreator } from "zustand";
import type {
  Alert,
  AlertHysteresisState,
  LogCategory,
  MedicalLogEntry,
  MissionMode,
  MissionState,
  ScenarioId,
  SimulationState,
  TemperatureUnit,
} from "@/domain/types";

export type SliceCreator<T> = StateCreator<AppStore, [], [], T>;

export interface MissionSlice extends MissionState {
  setMissionMode: (mode: MissionMode) => void;
  selectCrew: (crewId: string) => void;
  setSolarConjunction: (active: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
}

export interface SimulationSlice {
  simulation: SimulationState;
  tick: () => void;
  launchScenario: (scenarioId: ScenarioId) => void;
  resetScenario: () => void;
}

export interface AlertsSlice {
  alerts: Alert[];
  alertHysteresis: Record<string, AlertHysteresisState>;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAll: () => void;
}

export interface FeaturesSlice {
  medicalLog: MedicalLogEntry[];
  soundEnabled: boolean;
  alarmVolume: number;
  addMedicalNote: (crewId: string, category: LogCategory, note: string) => void;
  deleteMedicalNote: (entryId: string) => void;
  clearMedicalNotes: (crewId?: string) => void;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  setAlarmVolume: (volume: number) => void;
}

export type AppStore = MissionSlice & SimulationSlice & AlertsSlice & FeaturesSlice;
