import type { StateStorage } from "zustand/middleware";
import type { MedicalLogEntry, MissionMode, PersistedAppState } from "@/domain/types";
import { CREW_PROFILES } from "@/data/crew";

export const PERSISTENCE_VERSION = 1;
export const PERSISTENCE_KEY = "astropulse-app-state";

type PersistedEnvelope = {
  state: Record<string, unknown>;
  version: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLogEntry(value: unknown): value is MedicalLogEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.crewId === "string" &&
    CREW_PROFILES.some((member) => member.id === value.crewId) &&
    typeof value.timestamp === "string" &&
    typeof value.note === "string" &&
    ["Observation", "Treatment", "Follow-up"].includes(String(value.category))
  );
}

function isEnvelope(value: unknown): value is PersistedEnvelope {
  return (
    isRecord(value) &&
    isRecord(value.state) &&
    typeof value.version === "number" &&
    value.version >= 0 &&
    value.version <= PERSISTENCE_VERSION
  );
}

export function createSafeStorage(storage: Storage, onError = console.error): StateStorage {
  return {
    getItem: (name) => {
      try {
        const raw = storage.getItem(name);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isEnvelope(parsed)) throw new Error("Unrecognized AstroPulse storage envelope.");
        const state = parsed.state;
        const mission = state.mission;
        if (mission !== undefined && !isRecord(mission))
          throw new Error("Invalid saved mission settings.");
        if (
          state.medicalLog !== undefined &&
          (!Array.isArray(state.medicalLog) || !state.medicalLog.every(isLogEntry))
        ) {
          throw new Error("Invalid saved medical log.");
        }
        return raw;
      } catch (error) {
        onError("Unable to read AstroPulse local data; resetting this saved state.", error);
        try {
          storage.removeItem(name);
        } catch (removeError) {
          onError("Unable to remove invalid AstroPulse local data.", removeError);
        }
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        storage.setItem(name, value);
      } catch (error) {
        onError("Unable to save AstroPulse local data.", error);
      }
    },
    removeItem: (name) => {
      try {
        storage.removeItem(name);
      } catch (error) {
        onError("Unable to remove AstroPulse local data.", error);
      }
    },
  };
}

export function migratePersistedState(
  persisted: unknown,
  version: number,
): Partial<PersistedAppState> {
  if (!isRecord(persisted)) return {};
  if (version === 0) {
    const rawMission = isRecord(persisted.mission) ? persisted.mission : {};
    const crewId = rawMission.selectedCrewId;
    return {
      mission: {
        mode: rawMission.mode === "mars" ? ("mars" satisfies MissionMode) : "lunar",
        selectedCrewId:
          typeof crewId === "string" && CREW_PROFILES.some((member) => member.id === crewId)
            ? crewId
            : CREW_PROFILES[0].id,
        solarConjunction: rawMission.solarConjunction === true,
        temperatureUnit: rawMission.temperatureUnit === "F" ? "F" : "C",
      },
      medicalLog: Array.isArray(persisted.medicalLog)
        ? persisted.medicalLog.filter(isLogEntry)
        : [],
      alarmVolume:
        typeof persisted.alarmVolume === "number"
          ? Math.max(0, Math.min(1, persisted.alarmVolume))
          : 0.35,
      schemaVersion: PERSISTENCE_VERSION,
    } as Partial<PersistedAppState>;
  }
  if (version !== PERSISTENCE_VERSION) {
    console.error(`Unsupported AstroPulse storage version ${version}; using fresh defaults.`);
  }
  return {};
}
