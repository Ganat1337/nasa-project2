# AURA Phase 2 — Doctor + Astronaut demo

## Features
- Select Doctor Mode or a specific astronaut using the Demo profile dropdown. No login is required in this simulation.
- AURA personal companion automatically watches each astronaut's current simulated readings and existing hysteresis-based alert signals. Low-sleep / baseline-stress prompts also appear. Select **Talk to AURA** to chat.
- In Doctor Mode, AURA presents existing astronaut alert signals and checks for shared short sleep or stress deviations across the crew. A shared snapshot is *not* a longitudinal trend.
- **Investigate** selects the linked astronaut and scrolls to the vital-sign cards.
- **Export report** produces a local plain-text summary of the simulated snapshot (not a diagnostic report).
- Online AI chat uses the **unchanged** `gemini-3.5-flash-lite` fallback model (or the existing GEMINI_MODEL override). AI instructions encourage supportive symptom conversations without inventing diagnoses or medical treatment.
- When browser networking is unavailable, or Mars simulated ground link is unavailable, Astronaut Mode provides **limited local preset guidance** and current telemetry values. It is *not* offline Gemini. If the Gemini endpoint fails, Astronaut Mode falls back to the same limited guidance.
- No doctor contact, message sending, or remote synchronization is implemented or claimed. This is a simulator, not an operational emergency system.

## Run
1. Extract the zip.
2. Copy your **private** `.env` into the project root (next to `package.json`), with `GEMINI_API_KEY=...`. Never share the key or commit the file.
3. With Node 20.19+ / npm 10.8+, run `npm install`, then `npm run dev` and open the local URL.
4. Select Maya, Javier, or Priya in **Demo profile** to try Astronaut Mode. Use **Doctor Mode** to see all crew.
5. Use scenario controls in Doctor Mode to simulate new telemetry/alerts. The display updates as the simulation runs.

## Limitations and verification
This release was edited and code-inspected, but full build/tests could not run in the available environment because npm dependencies could not finish installing. Run `npm run build` and `npm test` on your computer after `npm install`.

## Safety
Fictional data; not a medical device. Emergency messages refer users to approved onboard checklists, other crew and mission communications rather than clinical diagnoses or prescriptions.
