# Architecture

## Runtime shape

`index.html` is the Vite shell. `src/main.tsx` loads locally bundled Orbitron, Inter, and JetBrains Mono font subsets, global styles, and the React app. `src/App.tsx` owns the page composition, mission elapsed display, two-second simulation interval, offline badge, and alarm repeat lifecycle.

The dashboard is split into three semantic columns:

1. Crew roster and mission context.
2. Selected crew member, live chart, health indicators, and training scenarios.
3. Alert center, cabin environment, and medical log.

Desktop CSS Grid gives the center column the most space. At tablet widths, operations panels move below the first two columns. At phone widths, a compact navigation selects one column at a time.

## State and data flow

```text
scenario action / interval
        ↓
simulation engine → cabin coupling → alert evaluator → hysteresis
        ↓                                    ↓
      Zustand store ←────────────────── alert history
        ↓
React components → Chart.js / localStorage / optional Web Audio
```

- `src/domain/types.ts` defines the contracts shared by the app.
- `src/config/thresholds.ts` is the sole threshold table; sourced values explicitly carry an `UNVERIFIED` source note.
- `src/simulation/engine.ts` uses a seeded random walk and fixed simulation ticks so the same seed produces repeatable updates. Scenario values ramp in and the reset action eases values back to the baseline.
- `src/simulation/coupling.ts` models an illustrative relationship between cabin oxygen/CO₂ and crew readings.
- `src/alerts/evaluate.ts` is a pure evaluator. It does not display UI, play sounds, or mutate state.
- `src/alerts/hysteresis.ts` debounces new levels and requires sustained normal values before clearing.
- `src/store/index.ts` coordinates simulation and alert updates; `src/store/persistence.ts` validates and migrates the persisted user-facing subset.
- `src/components/VitalsPanel.tsx` renders the Chart.js heart-rate trend. A critical signal changes its line color; crew selection supplies the corresponding history.

## Persistence boundary

Only mission preferences, temperature units, alarm settings, and medical-log entries persist. Generated telemetry, alerts, and active scenarios are session state and start from demo baselines on reload. Saved notes remain in browser `localStorage`; no server or telemetry upload is implemented.

## Offline/PWA

Vite PWA generates a service worker and standalone manifest. Bundled JS, CSS, fonts, and static assets are precached. The app can render the demo offline after the initial online service-worker install. There is no remote API dependency.
