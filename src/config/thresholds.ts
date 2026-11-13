import type { ActivityState, CabinState, SourceNote, SourcedNumber } from "@/domain/types";

const demoSource: SourceNote = {
  label: "UNVERIFIED — illustrative demo value; not an operational limit",
  verified: false,
  note: "Requires review by qualified flight medicine and mission-system authorities.",
};

const demo = (value: number): SourcedNumber => ({ value, source: demoSource });

export const THRESHOLDS = {
  heartRate: {
    absoluteWarningBpm: demo(120),
    absoluteEmergencyBpm: demo(140),
    excessWarningBpm: demo(25),
    excessEmergencyBpm: demo(45),
    lowWarningBpm: demo(45),
  },
  spo2: {
    warningPercent: demo(95),
    emergencyPercent: demo(92),
  },
  temperature: {
    lowWarningC: demo(35.8),
    highWarningC: demo(38),
    lowEmergencyC: demo(35),
    highEmergencyC: demo(39),
  },
  radiation: {
    cautionReferenceFraction: demo(0.75),
    warningRateMsvPerDay: demo(1),
  },
  cabin: {
    lowOxygenPercent: demo(19.5),
    highCarbonDioxidePercent: demo(0.5),
    lowPressureKpa: demo(70),
    lowTemperatureC: demo(18),
    highTemperatureC: demo(28),
    lowHumidityPercent: demo(20),
    highHumidityPercent: demo(70),
  },
  hysteresis: {
    clearAfterTicks: demo(3),
    debounceTicks: demo(2),
  },
} as const;

export interface ActivityHeartRateRange {
  minOffsetFromRestBpm: number;
  maxOffsetFromRestBpm: number;
}

export const ACTIVITY_HEART_RATE_RANGES: Record<
  ActivityState,
  ActivityHeartRateRange & { source: SourceNote }
> = {
  rest: { minOffsetFromRestBpm: -8, maxOffsetFromRestBpm: 20, source: demoSource },
  exercise: { minOffsetFromRestBpm: 20, maxOffsetFromRestBpm: 75, source: demoSource },
  eva: { minOffsetFromRestBpm: 10, maxOffsetFromRestBpm: 65, source: demoSource },
  sleep: { minOffsetFromRestBpm: -12, maxOffsetFromRestBpm: 8, source: demoSource },
};

export function getCabinSeverity(cabin: CabinState): "nominal" | "warning" | "emergency" {
  const { cabin: limits } = THRESHOLDS;
  if (
    cabin.oxygenPercent < limits.lowOxygenPercent.value ||
    cabin.carbonDioxidePercent > limits.highCarbonDioxidePercent.value ||
    cabin.pressureKpa < limits.lowPressureKpa.value
  ) {
    return "emergency";
  }
  if (
    cabin.temperatureC < limits.lowTemperatureC.value ||
    cabin.temperatureC > limits.highTemperatureC.value ||
    cabin.humidityPercent < limits.lowHumidityPercent.value ||
    cabin.humidityPercent > limits.highHumidityPercent.value
  ) {
    return "warning";
  }
  return "nominal";
}

export const THRESHOLD_SOURCE = demoSource;
