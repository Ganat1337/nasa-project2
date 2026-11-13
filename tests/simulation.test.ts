import { describe, expect, it } from "vitest";
import { getActivityState } from "@/simulation/activityStates";
import {
  createInitialSimulation,
  resetSimulation,
  startScenario,
  tickSimulation,
} from "@/simulation/engine";
import { coupleCabinToCrew } from "@/simulation/coupling";

describe("simulation engine", () => {
  it("uses a repeatable seeded telemetry sequence", () => {
    const initial = createInitialSimulation(44);
    const first = tickSimulation(initial);
    const second = tickSimulation(initial);
    expect(first).toEqual(second);
  });

  it("scales telemetry progression with simulation speed", () => {
    const initial = createInitialSimulation(44);
    const halfSpeed = tickSimulation(initial, 0.5);
    const doubleSpeed = tickSimulation(initial, 2);

    expect(halfSpeed.elapsedSeconds).toBe(1);
    expect(doubleSpeed.elapsedSeconds).toBe(4);
    expect(halfSpeed.crew[0].activityElapsedSeconds).toBe(1);
    expect(doubleSpeed.crew[0].activityElapsedSeconds).toBe(4);
  });

  it("scales reset progress with simulated time", () => {
    const reset = resetSimulation(createInitialSimulation());
    const first = tickSimulation(reset, 4);
    const second = tickSimulation(first, 4);

    expect(first.resettingSeconds).toBe(8);
    expect(second.resettingSeconds).toBe(0);
    expect(second.elapsedSeconds).toBe(16);
  });

  it("ramps a selected-crew scenario and returns to baseline on reset", () => {
    const initial = createInitialSimulation(5);
    const selected = initial.crew[0];
    let state = startScenario(initial, "cardiac-event", selected.id, "lunar");
    for (let tick = 0; tick < state.scenario!.rampTicks; tick += 1) state = tickSimulation(state);

    expect(state.crew[0].vitals.heartRateBpm).toBe(selected.vitals.heartRateBpm + 75);
    expect(state.crew[1].vitals.heartRateBpm).toBeLessThan(selected.vitals.heartRateBpm + 30);

    state = resetSimulation(state);
    for (let tick = 0; tick < 8; tick += 1) state = tickSimulation(state);
    expect(state.resettingSeconds).toBe(0);
    expect(state.crew[0].vitals.heartRateBpm).toBe(selected.baseline.restingHeartRateBpm);
    expect(state.cabin).toEqual(initial.cabin);
  });

  it("couples low cabin oxygen to gradual crew telemetry changes", () => {
    const state = createInitialSimulation();
    const cabin = { ...state.cabin, oxygenPercent: 18 };
    const affected = coupleCabinToCrew(state.crew, cabin);
    expect(affected[0].vitals.spo2Percent).toBeLessThan(state.crew[0].vitals.spo2Percent);
    expect(affected[0].vitals.stressIndex).toBeGreaterThan(state.crew[0].vitals.stressIndex);
    expect(state.crew[0].vitals.spo2Percent).toBe(98);
  });

  it("advances through the illustrative activity schedule", () => {
    expect(getActivityState(0)).toBe("rest");
    expect(getActivityState(43_200)).toBe("exercise");
  });
});
