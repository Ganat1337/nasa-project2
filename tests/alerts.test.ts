import { describe, expect, it } from "vitest";
import { THRESHOLDS } from "@/config/thresholds";
import { evaluateAlerts } from "@/alerts/evaluate";
import { advanceHysteresis, createHysteresisState } from "@/alerts/hysteresis";
import { createInitialSimulation } from "@/simulation/engine";

describe("alert evaluation", () => {
  it("uses activity context to avoid warning on expected exercise heart rate", () => {
    const crew = createInitialSimulation().crew[0];
    const alerts = evaluateAlerts(
      { ...crew.vitals, heartRateBpm: 145 },
      crew.baseline,
      "exercise",
      THRESHOLDS,
      createInitialSimulation().cabin,
      { crewId: crew.id, crewName: crew.name },
    );
    expect(alerts).not.toContainEqual(expect.objectContaining({ id: `${crew.id}:heart-rate` }));
  });

  it("raises an emergency for a severe resting heart-rate excursion", () => {
    const crew = createInitialSimulation().crew[0];
    const alerts = evaluateAlerts(
      { ...crew.vitals, heartRateBpm: 145 },
      crew.baseline,
      "rest",
      THRESHOLDS,
      createInitialSimulation().cabin,
      { crewId: crew.id, crewName: crew.name },
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({
        id: `${crew.id}:heart-rate`,
        level: "emergency",
      }),
    );
  });

  it("raises an environmental alert when cabin oxygen is low", () => {
    const crew = createInitialSimulation().crew[0];
    const cabin = { ...createInitialSimulation().cabin, oxygenPercent: 18 };
    const alerts = evaluateAlerts(
      crew.vitals,
      crew.baseline,
      crew.activityState,
      THRESHOLDS,
      cabin,
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({
        id: "system:cabin",
        level: "emergency",
      }),
    );
  });

  it("debounces alert onset and requires sustained normal values to clear", () => {
    let state = createHysteresisState();
    state = advanceHysteresis(state, "emergency", 2, 3);
    expect(state.currentLevel).toBe("nominal");
    state = advanceHysteresis(state, "emergency", 2, 3);
    expect(state.currentLevel).toBe("emergency");

    state = advanceHysteresis(state, "nominal", 2, 3);
    state = advanceHysteresis(state, "nominal", 2, 3);
    expect(state.currentLevel).toBe("emergency");
    state = advanceHysteresis(state, "nominal", 2, 3);
    expect(state.currentLevel).toBe("nominal");
  });
});
