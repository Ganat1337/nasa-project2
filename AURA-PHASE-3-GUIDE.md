# AURA Phase 3 — Astronaut symptom help + contact consent

- Astronaut Mode offers 8 one-click chat choices and 4 quick actions throughout the chat.
- Headache/dizziness and urgent symptoms get immediate preset, conservative guidance even when Gemini is offline. This is a simulation, **not approved flight medical guidance**.
- AURA asks whether the astronaut wants flight-doctor support. Clicking **Yes — contact flight doctor** is affirmative consent; no request is sent before this.
- **Real delivery is NOT preconfigured.** To connect a real flight doctor/medical support service, set `DOCTOR_ALERT_WEBHOOK_URL` and optionally `DOCTOR_ALERT_WEBHOOK_TOKEN` in `.env`, restart Vite, and configure the destination service to accept JSON POSTs. The request includes `crewId`, `crewName`, `urgency`, `message`, `timestamp`, and `source`. The service must independently deliver/acknowledge messages. A 2xx means the endpoint accepted the request, **not** doctor receipt or rescue dispatch.
- The message is **not transmitted** when offline or when the endpoint is absent. Astronauts must use approved onboard emergency communications for emergencies.
- Demo selection is not authentication; do not use this project to transmit real patient information without adding authentication, access control, transport safeguards, consent logs, and medically approved processes.
- The Gemini model default remains `gemini-3.5-flash-lite`, unchanged.

Run `npm install` then `npm run dev`. Do not place API keys in browser-exposed VITE_* variables.
