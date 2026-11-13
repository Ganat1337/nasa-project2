import type { Protocol } from "@/domain/types";

export const MEDICAL_PROTOCOLS: Record<string, Protocol> = {
  "cardiac-event": {
    id: "cardiac-event",
    title: "Possible cardiac event",
    steps: [
      "Stop EVA and strenuous activity; stabilize the crew member in a safe location.",
      "Confirm the signal with an approved secondary sensor and assess symptoms per onboard procedure.",
      "Contact the flight surgeon and follow the approved mission medical checklist.",
    ],
    marsAutonomousSteps: [
      "Stop EVA and strenuous activity; move to the designated safe area.",
      "Confirm readings with a second approved sensor and record symptoms and activity context.",
      "Follow the onboard flight-surgeon-approved medical procedure; send telemetry when the link is available.",
    ],
  },
  "cabin-decompression": {
    id: "cabin-decompression",
    title: "Cabin pressure loss",
    steps: [
      "Follow the vehicle's approved pressure-loss checklist and protect crew safety.",
      "Compare pressure, oxygen, and individual crew readings to identify shared effects.",
      "Notify mission control and the flight surgeon when communications permit.",
    ],
    marsAutonomousSteps: [
      "Follow the vehicle's approved pressure-loss checklist and secure crew in the designated safe area.",
      "Compare independent cabin sensors and crew readings; use only approved life-support procedures.",
      "Record events locally and transmit them when communications are restored.",
    ],
  },
  "co2-buildup": {
    id: "co2-buildup",
    title: "Elevated cabin CO₂",
    steps: [
      "Check the cabin CO₂ reading against a second environmental sensor.",
      "Review ventilation and carbon-dioxide removal system status using the vehicle checklist.",
      "Check all crew telemetry for a shared trend and notify mission control.",
    ],
    marsAutonomousSteps: [
      "Verify the cabin CO₂ reading with an independent sensor.",
      "Use the onboard environmental-control checklist to assess ventilation and CO₂ removal.",
      "Monitor crew symptoms, document the response, and contact ground when the link permits.",
    ],
  },
  "radiation-spike": {
    id: "radiation-spike",
    title: "Radiation event",
    steps: [
      "Verify personal dosimeter and spacecraft radiation monitor readings.",
      "Follow mission radiation-protection procedures and shelter guidance.",
      "Notify the radiation officer and flight surgeon; record exposure for review.",
    ],
    marsAutonomousSteps: [
      "Verify readings using independent radiation instruments.",
      "Follow the mission radiation-protection plan and approved shelter procedures.",
      "Record the event and exposure data for delayed ground review.",
    ],
  },
  "thermal-failure": {
    id: "thermal-failure",
    title: "Cabin thermal-control excursion",
    steps: [
      "Confirm cabin temperature using an independent sensor.",
      "Review vehicle thermal-control status and follow the approved environmental checklist.",
      "Monitor crew temperature readings and notify mission control.",
    ],
    marsAutonomousSteps: [
      "Confirm cabin temperature using an independent sensor.",
      "Follow the onboard thermal-control procedure and keep crew monitoring active.",
      "Document status and actions for ground review when communications permit.",
    ],
  },
  "ground-link-loss": {
    id: "ground-link-loss",
    title: "Ground-link loss during medical event",
    steps: [
      "Use the onboard flight-surgeon-approved autonomous medical procedures.",
      "Record the event, readings, and actions in the local mission log.",
      "Transmit the complete event record when communications are restored.",
    ],
    marsAutonomousSteps: [
      "Use the onboard flight-surgeon-approved autonomous medical procedures.",
      "Maintain a timestamped record of readings, symptoms, and actions.",
      "Queue telemetry and notes for transmission after link restoration.",
    ],
  },
};
