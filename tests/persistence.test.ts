import { describe, expect, it, vi } from "vitest";
import {
  createSafeStorage,
  migratePersistedState,
  PERSISTENCE_KEY,
  PERSISTENCE_VERSION,
} from "@/store/persistence";

describe("local persistence", () => {
  it("removes corrupt data and reports the failure", () => {
    localStorage.setItem(PERSISTENCE_KEY, "{not-json");
    const onError = vi.fn();
    const storage = createSafeStorage(localStorage, onError);

    expect(storage.getItem(PERSISTENCE_KEY)).toBeNull();
    expect(localStorage.getItem(PERSISTENCE_KEY)).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it("migrates valid mission settings while rejecting unknown crew identifiers", () => {
    const migrated = migratePersistedState(
      {
        mission: { mode: "mars", selectedCrewId: "unknown", temperatureUnit: "F" },
        medicalLog: [],
      },
      0,
    );
    expect(migrated).toMatchObject({
      mission: { mode: "mars", selectedCrewId: "aur-01", temperatureUnit: "F" },
    });
    expect(PERSISTENCE_VERSION).toBe(1);
  });
});
