# Contributing to AstroPulse

AstroPulse is a hackathon demonstration. Contributions must preserve the project’s safety boundary: no real patient data, no operational flight guidance, and no presenting illustrative values as NASA-approved limits.

## Team ownership

| Member                           | Owns                                                               | Coordinate through                                                     |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| UI / accessibility               | `src/components/`, `src/styles.css`, and responsive interaction    | Shared domain types and accessible component props                     |
| Telemetry / simulation           | `src/simulation/`, `src/data/crew.ts`                              | `CrewMember`, `Vitals`, and `SimulationState` in `src/domain/types.ts` |
| Visualization                    | Chart in `src/components/VitalsPanel.tsx`                          | `HistoryPoint` and chart props                                         |
| Alerts / protocols               | `src/alerts/`, `src/data/protocols.ts`, `src/config/thresholds.ts` | `AlertSignal`, `Alert`, and `ScenarioId`                               |
| Mission operations / integration | `src/store/`, mission/scenario config, persistence, and app wiring | Store actions and `PersistedAppState`                                  |

Choose one integrator to own shared-type changes and the `src/App.tsx` shell. Coordinate interface changes before editing shared files. Prefer small module-level pull requests to overlapping edits in the app shell or global CSS.

## Development workflow

1. Install with `npm ci`; start the app with `npm run dev`.
2. Keep simulation and alert logic framework-independent and deterministic where practical.
3. Add a focused test for new simulation, alert, or persistence behavior.
4. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
5. Update the source or medical-model docs if a displayed value, threshold, behavior, or claim changes.

## Data and medical language

- Keep all made-up numeric values labeled `UNVERIFIED` at their source.
- Cite a primary source for factual context. A contextual NASA source is not evidence for a specific clinical cutoff or spacecraft setpoint.
- Do not add real astronaut data, real patient notes, or unreviewed treatment recommendations.
- Prefer “simulated,” “illustrative,” and “verify/escalate” language over “diagnose,” “safe,” or “normal” claims.
