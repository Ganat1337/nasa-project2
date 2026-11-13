# Medical and environment model

## Intended use and limits

This file documents a hackathon UI simulation. It is not clinical guidance, a flight rule, a spacecraft environmental control specification, or a NASA-approved health model. The numeric values below are **UNVERIFIED illustrative parameters** with no validated operational or clinical meaning. They must not be used to make real decisions.

NASA references in [SOURCES.md](./SOURCES.md) motivate broad spaceflight-health topics. They do not establish or endorse the cutoffs, crew baselines, cabin values, scenario effects, or recovery text in this repository.

## Demo rule values

All alert comparisons are centralized in `src/config/thresholds.ts`.

| Signal                      | Current illustrative behavior                                                                                                                                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heart rate                  | Absolute warning at or above 120 BPM and emergency at or above 140 BPM outside exercise/EVA; during exercise/EVA, use the activity-adjusted upper range instead. Excess above that upper range of 25 BPM is warning; 45 BPM is emergency. Below 45 BPM is warning outside high workload. |
| Oxygen saturation           | Warning below 95%; emergency below 92%.                                                                                                                                                                                                                                                  |
| Body temperature            | Warning below 35.8 °C or above 38 °C; emergency below 35 °C or above 39 °C.                                                                                                                                                                                                              |
| Radiation rate              | Warning above 1 mSv/day in the simulation.                                                                                                                                                                                                                                               |
| Cumulative radiation        | Caution at 75% of each fictional crew member’s demo comparator. The comparator (580–640 mSv) is not a career limit or exposure recommendation.                                                                                                                                           |
| Cabin oxygen, CO₂, pressure | Emergency below 19.5% oxygen, above 0.5% CO₂, or below 70 kPa pressure.                                                                                                                                                                                                                  |
| Cabin temperature, humidity | Warning below 18 °C or above 28 °C, or humidity below 20% or above 70%.                                                                                                                                                                                                                  |
| Stress display              | Demo index under 40 is labeled low, 40–69 moderate, and 70 or higher high; no alert rule is attached.                                                                                                                                                                                    |
| Exercise display            | Progress against an illustrative 60-minute daily target.                                                                                                                                                                                                                                 |

The activity schedule cycles through 12 hours rest, 1 hour exercise, 2 hours EVA, and 9 hours sleep. Heart-rate offsets, stress offsets, crew baselines, dose drift, cabin coupling, scenario ramps, and history points are likewise synthetic. Every value is a user-interface demonstration only.

## Source handling

Source notes are carried alongside numeric thresholds and mission constants. `verified: false` means a displayed numeric input is a demo value. “Verified” on a NASA/NIST source note means the cited page supports the narrow contextual claim in its note—not that it validates the surrounding model or a medical cutoff.

The Mars delay display uses NIST’s exact speed-of-light constant converted to km/s. The distance extremes and sinusoidal orbital approximation are unverified, intentionally simplified, and not an ephemeris.

## Response text

Protocol copy is verification-first: confirm sensor values, compare cabin and crew telemetry, use the approved vehicle checklist, and contact qualified medical/mission support when available. It is placeholder language for interaction design, not an instruction set. Replace it only with appropriately reviewed content before any real-world use.
