import type {
  ActivityState,
  AlertSignal,
  CabinState,
  CrewBaseline,
  MissionMode,
  ScenarioId,
  Vitals,
} from "@/domain/types";
import { getActivityProfile } from "@/simulation/activityStates";
import { getCabinSeverity, THRESHOLDS } from "@/config/thresholds";

type AlertOptions = {
  crewId?: string;
  crewName?: string;
  missionMode?: MissionMode;
  scenarioId?: ScenarioId | null;
  scenarioCrewId?: string;
};

function activityName(state: ActivityState): string {
  return getActivityProfile(state).label.toLowerCase();
}

function signal(
  id: string,
  level: AlertSignal["level"],
  title: string,
  reason: string,
  protocolId: string,
  source: AlertSignal["source"],
  crewId?: string,
): AlertSignal {
  return { id, level, title, reason, protocolId, source, crewId };
}

export function evaluateAlerts(
  vitals: Vitals,
  baseline: CrewBaseline,
  activityState: ActivityState,
  thresholds: typeof THRESHOLDS,
  cabin: CabinState,
  options: AlertOptions = {},
): AlertSignal[] {
  const alerts: AlertSignal[] = [];
  const context = options.crewName
    ? ` during ${activityName(activityState)} for ${options.crewName}`
    : ` during ${activityName(activityState)}`;
  const hrRange = getActivityProfile(activityState).heartRateOffsetBpm;
  const expectedMax = baseline.restingHeartRateBpm + hrRange[1];
  const hrExcess = vitals.heartRateBpm - expectedMax;
  const elevatedWorkload = activityState === "exercise" || activityState === "eva";
  const absoluteLevel = elevatedWorkload
    ? "nominal"
    : vitals.heartRateBpm >= thresholds.heartRate.absoluteEmergencyBpm.value
      ? "emergency"
      : vitals.heartRateBpm >= thresholds.heartRate.absoluteWarningBpm.value ||
          vitals.heartRateBpm < thresholds.heartRate.lowWarningBpm.value
        ? "warning"
        : "nominal";
  const adjustedLevel =
    hrExcess >= thresholds.heartRate.excessEmergencyBpm.value
      ? "emergency"
      : hrExcess >= thresholds.heartRate.excessWarningBpm.value
        ? "warning"
        : "nominal";
  const scenarioEmergency =
    options.scenarioId === "cardiac-event" && options.scenarioCrewId === options.crewId;
  const hrLevel = scenarioEmergency
    ? "emergency"
    : absoluteLevel === "emergency" || adjustedLevel === "emergency"
      ? "emergency"
      : absoluteLevel === "warning" || adjustedLevel === "warning"
        ? "warning"
        : "nominal";
  if (hrLevel !== "nominal") {
    alerts.push(
      signal(
        `${options.crewId ?? "crew"}:heart-rate`,
        hrLevel,
        hrLevel === "emergency" ? "Critical heart-rate excursion" : "Heart-rate excursion",
        `${vitals.heartRateBpm} BPM${context}; activity-adjusted upper reference is ${expectedMax} BPM.`,
        "cardiac-event",
        thresholds.heartRate.absoluteWarningBpm.source,
        options.crewId,
      ),
    );
  }

  const oxygenLevel =
    vitals.spo2Percent < thresholds.spo2.emergencyPercent.value
      ? "emergency"
      : vitals.spo2Percent < thresholds.spo2.warningPercent.value
        ? "warning"
        : "nominal";
  if (oxygenLevel !== "nominal") {
    alerts.push(
      signal(
        `${options.crewId ?? "crew"}:spo2`,
        oxygenLevel,
        oxygenLevel === "emergency" ? "Critical oxygen saturation" : "Low oxygen saturation",
        `SpO₂ ${vitals.spo2Percent.toFixed(1)}%${context}. Verify the sensor and compare with cabin telemetry.`,
        "cabin-decompression",
        thresholds.spo2.emergencyPercent.source,
        options.crewId,
      ),
    );
  }

  const temperatureLevel =
    vitals.temperatureC < thresholds.temperature.lowEmergencyC.value ||
    vitals.temperatureC > thresholds.temperature.highEmergencyC.value
      ? "emergency"
      : vitals.temperatureC < thresholds.temperature.lowWarningC.value ||
          vitals.temperatureC > thresholds.temperature.highWarningC.value
        ? "warning"
        : "nominal";
  if (temperatureLevel !== "nominal") {
    alerts.push(
      signal(
        `${options.crewId ?? "crew"}:temperature`,
        temperatureLevel,
        "Body temperature excursion",
        `Core temperature estimate ${vitals.temperatureC.toFixed(1)} °C${context}. Confirm using approved clinical equipment.`,
        "thermal-failure",
        thresholds.temperature.highWarningC.source,
        options.crewId,
      ),
    );
  }

  if (vitals.radiationRateMsvPerDay > thresholds.radiation.warningRateMsvPerDay.value) {
    alerts.push(
      signal(
        `${options.crewId ?? "crew"}:radiation-rate`,
        "warning",
        "Elevated radiation rate",
        `Simulated dose rate ${vitals.radiationRateMsvPerDay.toFixed(2)} mSv/day. Verify dosimeter and vehicle monitor.`,
        "radiation-spike",
        thresholds.radiation.warningRateMsvPerDay.source,
        options.crewId,
      ),
    );
  } else if (
    vitals.radiationDoseMsv >=
    baseline.radiationDemoReferenceMsv * thresholds.radiation.cautionReferenceFraction.value
  ) {
    alerts.push(
      signal(
        `${options.crewId ?? "crew"}:radiation-dose`,
        "caution",
        "Radiation dose review point",
        `Illustrative cumulative dose ${vitals.radiationDoseMsv.toFixed(1)} mSv reached the configured review fraction.`,
        "radiation-spike",
        thresholds.radiation.cautionReferenceFraction.source,
        options.crewId,
      ),
    );
  }

  const cabinSeverity = getCabinSeverity(cabin);
  if (cabinSeverity !== "nominal") {
    const reason =
      cabin.oxygenPercent < thresholds.cabin.lowOxygenPercent.value
        ? `Cabin oxygen is ${cabin.oxygenPercent.toFixed(1)}%; assess life-support telemetry and shared crew trends.`
        : cabin.carbonDioxidePercent > thresholds.cabin.highCarbonDioxidePercent.value
          ? `Cabin CO₂ is ${cabin.carbonDioxidePercent.toFixed(2)}%; assess ventilation and CO₂ removal.`
          : cabin.pressureKpa < thresholds.cabin.lowPressureKpa.value
            ? `Cabin pressure is ${cabin.pressureKpa.toFixed(1)} kPa; follow the vehicle pressure-loss checklist.`
            : `Cabin thermal or humidity telemetry is outside the configured illustrative range.`;
    alerts.push(
      signal(
        "system:cabin",
        cabinSeverity,
        "Cabin environment excursion",
        reason,
        cabin.carbonDioxidePercent > thresholds.cabin.highCarbonDioxidePercent.value
          ? "co2-buildup"
          : cabin.temperatureC < thresholds.cabin.lowTemperatureC.value ||
              cabin.temperatureC > thresholds.cabin.highTemperatureC.value
            ? "thermal-failure"
            : "cabin-decompression",
        thresholds.cabin.lowOxygenPercent.source,
      ),
    );
  }

  if (options.scenarioId === "ground-link-loss" && options.missionMode === "mars") {
    alerts.push(
      signal(
        "system:ground-link",
        "warning",
        "Ground link unavailable",
        "Simulated communication loss: use approved onboard procedures and queue records for later transmission.",
        "ground-link-loss",
        thresholds.heartRate.absoluteWarningBpm.source,
      ),
    );
  }

  return alerts;
}
