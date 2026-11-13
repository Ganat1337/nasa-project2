# AstroPulse | Artemis IV Crew Health Monitor

AstroPulse is a **NASA Space Apps hackathon prototype** for the challenge **“Astronaut Health Monitoring Software on Space Mission.”** It demonstrates a responsive mission-control interface for simulated crew health, cabin telemetry, scenario alerts, and flight-surgeon notes.

> **Safety and provenance:** This is a fictional, non-operational demo—not a NASA product, medical device, validated clinical decision-support system, or flight procedure. Crew records and most numeric values are invented simulation parameters. Never use them for real health, spacecraft, or mission decisions, and do not enter real patient information.

## What the demo includes

- React 18, strict TypeScript, Vite, Tailwind CSS, Zustand, and Chart.js.
- Three fictional astronaut profiles with activity context and generated telemetry that advances every two seconds.
- A live heart-rate history, oxygen saturation, body-temperature, stress, radiation, exercise, and sleep panels.
- Rule-based threshold evaluation with debounce and clear hysteresis; the UI labels this as an illustrative rules monitor, not AI diagnosis.
- Six synthetic scenarios: cardiac event, cabin decompression, elevated CO₂, radiation-rate spike, thermal excursion, and Mars ground-link loss.
- Cabin environment telemetry, including oxygen and carbon dioxide, so a shared cabin trend can be distinguished from an individual signal.
- Verification-first response prompts, optional browser-generated two-tone alarm, and acknowledgement/cleared alert history.
- UTC-timestamped medical notes stored in versioned browser `localStorage`, with per-entry deletion and CSV export.
- Lunar and Mars mission display modes, an explicitly approximate Mars delay model, responsive mobile section navigation, and a PWA app shell for offline use.

## AURA workspace preview

Use **Demo profile** to switch between Elias Ward (Doctor Mode) and one of the
three astronauts (Astronaut Mode). The doctor workspace includes the crew
roster and mission operations. The astronaut workspace displays the selected
astronaut's own telemetry. **Open AURA** opens a chat backed by the current simulated readings in either mode.

The profile selector demonstrates the two interfaces. It has no sign-in or
server-side access control. The chat connects to Gemini through the local Vite server. Copy .env.example to .env.local and set GEMINI_API_KEY. Restart npm run dev after changing it. The key stays on the server. This demo profile selector is not authentication. The production dist folder requires an API server to support chat.

## Run locally

Requirements: Node.js `>=20.19.0` and npm `>=10.8.0`.

```bash
npm ci
npm run dev
```

Vite prints the local URL. For production verification:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

The app and font assets are bundled locally. Offline availability begins after the service worker has installed while the app is online; browser storage is local to that browser profile.

## Desktop grid and responsive layout

The dashboard uses CSS Grid in [src/styles.css](./src/styles.css). At desktop widths, the main grid has three columns:

```css
grid-template-columns:
  minmax(230px, 0.76fr) /* crew roster */
  minmax(460px, 1.65fr) /* selected astronaut and vitals */
  minmax(310px, 1.02fr); /* alerts, cabin, and medical log */
```

The crew sidebar remains a distinct navigation region; the center column gets the most width for the chart and metric cards; the operations column groups alerts, cabin readings, and the log. Cards inside the center panel use nested CSS Grid for vitals and space-specific metrics.

At `1120px`, the operations panels span beneath the roster and vitals. At `720px`, a three-item mobile navigation switches between Crew, Vitals, and Operations rather than compressing the desktop columns. The layout also has a narrow-screen adjustment at `390px`, visible keyboard focus, and reduced-motion handling.

## Project architecture

| Area                                           | Responsibility                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`src/App.tsx`](./src/App.tsx)                 | App shell, mission clock, two-second telemetry loop, offline indicator, alarm lifecycle, responsive navigation |
| [`src/components/`](./src/components/)         | Header, roster, chart, health metrics, scenario controls, operations panels, and settings                      |
| [`src/domain/types.ts`](./src/domain/types.ts) | Shared contracts for crew, telemetry, alerts, scenarios, and persisted state                                   |
| [`src/config/`](./src/config/)                 | Mission profiles, scenario definitions, and the single illustrative threshold table                            |
| [`src/data/`](./src/data/)                     | Fictional crew profiles and verification-first protocol text                                                   |
| [`src/simulation/`](./src/simulation/)         | Seeded bounded telemetry drift, activity schedule, scenario ramps/resets, and cabin-to-crew coupling           |
| [`src/alerts/`](./src/alerts/)                 | Pure threshold evaluation, alert hysteresis, and optional Web Audio signal                                     |
| [`src/store/`](./src/store/)                   | Zustand actions and safe, versioned persistence of user settings and medical notes                             |
| [`tests/`](./tests/)                           | Simulation, alerts, persistence, and dashboard interaction tests                                               |
| [`docs/`](./docs/)                             | Architecture, numeric assumptions, and external source notes                                                   |

The simulation and alert evaluators are isolated from the React view. The store is the UI integration boundary: a simulation tick advances crew/cabin state, evaluates signals, applies hysteresis, and publishes state for the components to render.

## Spaceflight context and limitations

Spaceflight research motivates the _categories_ shown here—cardiovascular adaptation, radiation exposure, cabin atmosphere, exercise countermeasures, sleep/circadian health, and behavioral health. NASA references do **not** supply or validate this app’s numeric thresholds, fictional crew values, cabin setpoints, exposure comparators, or scenario response text. Those numbers are clearly labeled **UNVERIFIED** in code and described in [docs/MEDICAL-MODEL.md](./docs/MEDICAL-MODEL.md).

The Mars one-way light-time display uses the exact NIST speed-of-light constant but a simplified, **unverified** sinusoidal distance estimate. It is not an ephemeris or communications prediction. A simulated solar-conjunction state is shown as link unavailable.

Medical prompts prioritize sensor verification, shared environmental context, approved onboard checklists, and escalation to qualified flight medicine. They are demonstration copy only; they do not prescribe treatment.

## Data, privacy, and offline behavior

- Crew telemetry is generated locally in the browser and resets to demo baselines when the page is reloaded.
- Mission mode, selected crew, temperature display, medical notes, and alarm volume are saved in `localStorage` under `astropulse-app-state`. Audible alerts must be enabled again after reload because browsers require a user gesture before audio can start.
- The log is not encrypted, synced, or transmitted. Do not store protected or real medical information here.
- Use the dashboard’s delete/clear controls or clear this site’s browser storage to remove saved notes.
- The PWA caches the static app shell and bundled assets. No backend, account, or remote telemetry service is configured.

## Five-person team boundaries

Suggested parallel ownership is documented in [CONTRIBUTING.md](./CONTRIBUTING.md). Each member owns a module boundary; shared types in `src/domain/types.ts` and exported config contracts are the coordination points.

## References

- [Verified source notes and scope](./docs/SOURCES.md)
- [Illustrative medical and environment model](./docs/MEDICAL-MODEL.md)
- [System architecture and data flow](./docs/ARCHITECTURE.md)
- [MIT License](./LICENSE)
#   n a s a - p r o j e c t 2  
 