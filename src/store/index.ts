import { create } from "zustand";
import type { StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CREW_PROFILES } from "@/data/crew";
import { MISSION_PROFILES } from "@/config/missions";
import { THRESHOLDS } from "@/config/thresholds";
import { evaluateAlerts } from "@/alerts/evaluate";
import { createHysteresisState, advanceHysteresis } from "@/alerts/hysteresis";
import { enableAlarmAudio, stopAlarmRepeater } from "@/alerts/audio";
import {
  createInitialSimulation,
  resetSimulation,
  startScenario,
  tickSimulation,
} from "@/simulation/engine";
import type { Alert, AlertHysteresisState, AlertSignal, PersistedAppState } from "@/domain/types";
import type { AppStore, SliceCreator } from "./types";
import {
  createSafeStorage,
  migratePersistedState,
  PERSISTENCE_KEY,
  PERSISTENCE_VERSION,
} from "./persistence";

const missionDefaults = {
  mode: "lunar" as const,
  selectedCrewId: CREW_PROFILES[0].id,
  solarConjunction: false,
  simulationSpeed: 1,
  temperatureUnit: "C" as const,
};
const persistenceStorage = createJSONStorage(() => createSafeStorage(window.localStorage));

function resolveAlerts(
  existing: Alert[],
  history: Record<string, AlertHysteresisState>,
  signals: AlertSignal[],
  mode: AppStore["mode"],
  elapsedSeconds: number,
): { alerts: Alert[]; alertHysteresis: Record<string, AlertHysteresisState> } {
  const signalMap = new Map<string, AlertSignal>();
  for (const candidate of signals) {
    const previous = signalMap.get(candidate.id);
    if (!previous || levelRank(candidate.level) > levelRank(previous.level))
      signalMap.set(candidate.id, candidate);
  }
  const nextHistory = { ...history };
  const oldAlerts = new Map(existing.map((alert) => [alert.id, alert]));
  const nextAlerts = new Map(oldAlerts);
  const allIds = new Set([...Object.keys(history), ...signalMap.keys()]);
  const debounce = THRESHOLDS.hysteresis.debounceTicks.value;
  const clearAfter = THRESHOLDS.hysteresis.clearAfterTicks.value;
  const missionDate = Date.parse(MISSION_PROFILES[mode].startAt) + elapsedSeconds * 1_000;

  for (const id of allIds) {
    const candidate = signalMap.get(id);
    const priorHistory = history[id] ?? createHysteresisState();
    const current = advanceHysteresis(
      priorHistory,
      candidate?.level ?? "nominal",
      debounce,
      clearAfter,
    );
    nextHistory[id] = current;
    const old = oldAlerts.get(id);
    if (current.currentLevel === "nominal") {
      if (old) nextAlerts.set(id, { ...old, active: false });
      continue;
    }

    const activeSignal = candidate ?? old;
    if (!activeSignal || activeSignal.level === "nominal") continue;
    nextAlerts.set(id, {
      id,
      level: current.currentLevel,
      title: activeSignal.title,
      reason: activeSignal.reason,
      crewId: activeSignal.crewId,
      protocolId: activeSignal.protocolId,
      acknowledged: old?.active ? old.acknowledged : false,
      active: true,
      createdAt: old?.active ? old.createdAt : new Date(missionDate).toISOString(),
      source: activeSignal.source,
    });
  }
  return {
    alerts: [...nextAlerts.values()]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 100),
    alertHysteresis: nextHistory,
  };
}

function levelRank(level: AlertSignal["level"]): number {
  return ["nominal", "caution", "warning", "emergency"].indexOf(level);
}

function getSignals(
  store: Pick<AppStore, "simulation" | "mode" | "selectedCrewId">,
): AlertSignal[] {
  const { simulation } = store;
  const signals = simulation.crew.flatMap((member) =>
    evaluateAlerts(
      member.vitals,
      member.baseline,
      member.activityState,
      THRESHOLDS,
      simulation.cabin,
      {
        crewId: member.id,
        crewName: member.name,
        missionMode: store.mode,
        scenarioId: simulation.scenario?.id,
        scenarioCrewId: simulation.scenario?.selectedCrewId,
      },
    ),
  );
  return signals;
}

function refreshAlerts(set: StoreApi<AppStore>["setState"], get: () => AppStore): void {
  const current = get();
  const resolved = resolveAlerts(
    current.alerts,
    current.alertHysteresis,
    getSignals(current),
    current.mode,
    current.simulation.elapsedSeconds,
  );
  set(resolved);
}

const createMissionSlice: SliceCreator<
  Pick<
    AppStore,
    | "mode"
    | "selectedCrewId"
    | "solarConjunction"
    | "simulationSpeed"
    | "temperatureUnit"
    | "setMissionMode"
    | "selectCrew"
    | "setSolarConjunction"
    | "setSimulationSpeed"
    | "setTemperatureUnit"
  >
> = (set, get) => ({
  ...missionDefaults,
  setMissionMode: (mode) => {
    set((state) => ({
      mode,
      solarConjunction: false,
      simulation: { ...state.simulation, scenario: null },
    }));
    refreshAlerts(set, get);
  },
  selectCrew: (crewId) => {
    if (get().simulation.crew.some((member) => member.id === crewId))
      set({ selectedCrewId: crewId });
  },
  setSolarConjunction: (active) => set({ solarConjunction: active }),
  setSimulationSpeed: (speed) => {
    if (Number.isFinite(speed)) set({ simulationSpeed: Math.max(0.5, Math.min(4, speed)) });
  },
  setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
});

const createSimulationSlice: SliceCreator<
  Pick<AppStore, "simulation" | "tick" | "launchScenario" | "resetScenario">
> = (set, get) => ({
  simulation: createInitialSimulation(),
  tick: () => {
    const state = get();
    set({ simulation: tickSimulation(state.simulation, state.simulationSpeed) });
    refreshAlerts(set, get);
  },
  launchScenario: (scenarioId) => {
    const state = get();
    set({
      simulation: startScenario(state.simulation, scenarioId, state.selectedCrewId, state.mode),
    });
    refreshAlerts(set, get);
  },
  resetScenario: () => {
    set({ simulation: resetSimulation(get().simulation) });
    refreshAlerts(set, get);
  },
});

const createAlertsSlice: SliceCreator<
  Pick<AppStore, "alerts" | "alertHysteresis" | "acknowledgeAlert" | "acknowledgeAll">
> = (set) => ({
  alerts: [],
  alertHysteresis: {},
  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    })),
  acknowledgeAll: () =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.active ? { ...alert, acknowledged: true } : alert,
      ),
    })),
});

const createFeaturesSlice: SliceCreator<
  Pick<
    AppStore,
    | "medicalLog"
    | "soundEnabled"
    | "alarmVolume"
    | "addMedicalNote"
    | "deleteMedicalNote"
    | "clearMedicalNotes"
    | "setSoundEnabled"
    | "setAlarmVolume"
  >
> = (set) => ({
  medicalLog: [],
  soundEnabled: false,
  alarmVolume: 0.35,
  addMedicalNote: (crewId, category, note) => {
    const normalized = note.trim();
    if (!normalized || !CREW_PROFILES.some((member) => member.id === crewId)) return;
    const entry = {
      id: crypto.randomUUID(),
      crewId,
      category,
      timestamp: new Date().toISOString(),
      note: normalized,
    };
    set((state) => ({ medicalLog: [entry, ...state.medicalLog] }));
  },
  deleteMedicalNote: (entryId) =>
    set((state) => ({
      medicalLog: state.medicalLog.filter((entry) => entry.id !== entryId),
    })),
  clearMedicalNotes: (crewId) =>
    set((state) => ({
      medicalLog: crewId ? state.medicalLog.filter((entry) => entry.crewId !== crewId) : [],
    })),
  setSoundEnabled: async (enabled) => {
    if (!enabled) {
      stopAlarmRepeater();
      set({ soundEnabled: false });
      return;
    }
    try {
      await enableAlarmAudio();
      set({ soundEnabled: true });
    } catch (error) {
      console.error("Unable to enable alarm audio.", error);
      set({ soundEnabled: false });
    }
  },
  setAlarmVolume: (volume) => {
    if (Number.isFinite(volume)) set({ alarmVolume: Math.max(0, Math.min(1, volume)) });
  },
});

export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createMissionSlice(...args),
      ...createSimulationSlice(...args),
      ...createAlertsSlice(...args),
      ...createFeaturesSlice(...args),
    }),
    {
      name: PERSISTENCE_KEY,
      version: PERSISTENCE_VERSION,
      storage: persistenceStorage,
      migrate: migratePersistedState,
      partialize: (state): PersistedAppState => ({
        schemaVersion: PERSISTENCE_VERSION,
        mission: {
          mode: state.mode,
          selectedCrewId: state.selectedCrewId,
          solarConjunction: state.solarConjunction,
          temperatureUnit: state.temperatureUnit,
        },
        medicalLog: state.medicalLog,
        alarmVolume: state.alarmVolume,
      }),
      merge: (persisted, current) => {
        const state = persisted as Partial<PersistedAppState> | undefined;
        const mission = state?.mission;
        const validCrewId =
          mission?.selectedCrewId &&
          CREW_PROFILES.some((member) => member.id === mission.selectedCrewId)
            ? mission.selectedCrewId
            : current.selectedCrewId;
        return {
          ...current,
          mode: mission?.mode === "mars" ? "mars" : "lunar",
          selectedCrewId: validCrewId,
          solarConjunction: mission?.solarConjunction === true,
          temperatureUnit: mission?.temperatureUnit === "F" ? "F" : "C",
          medicalLog: state?.medicalLog ?? current.medicalLog,
          soundEnabled: false,
          alarmVolume:
            typeof state?.alarmVolume === "number"
              ? Math.max(0, Math.min(1, state.alarmVolume))
              : current.alarmVolume,
        };
      },
    },
  ),
);
