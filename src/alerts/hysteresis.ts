import type { AlertHysteresisState, AlertLevel } from "@/domain/types";

const ORDER: AlertLevel[] = ["nominal", "caution", "warning", "emergency"];

function rank(level: AlertLevel): number {
  return ORDER.indexOf(level);
}

export function createHysteresisState(): AlertHysteresisState {
  return { currentLevel: "nominal", pendingLevel: "nominal", pendingTicks: 0, clearTicks: 0 };
}

export function advanceHysteresis(
  state: AlertHysteresisState,
  candidate: AlertLevel,
  debounceTicks: number,
  clearAfterTicks: number,
): AlertHysteresisState {
  if (candidate === state.currentLevel) {
    return { ...state, pendingLevel: candidate, pendingTicks: 0, clearTicks: 0 };
  }

  if (rank(candidate) > rank(state.currentLevel)) {
    const pendingTicks = state.pendingLevel === candidate ? state.pendingTicks + 1 : 1;
    return pendingTicks >= debounceTicks
      ? { currentLevel: candidate, pendingLevel: candidate, pendingTicks: 0, clearTicks: 0 }
      : { ...state, pendingLevel: candidate, pendingTicks, clearTicks: 0 };
  }

  const clearTicks = state.pendingLevel === candidate ? state.clearTicks + 1 : 1;
  return clearTicks >= clearAfterTicks
    ? { currentLevel: candidate, pendingLevel: candidate, pendingTicks: 0, clearTicks: 0 }
    : { ...state, pendingLevel: candidate, pendingTicks: 0, clearTicks };
}
