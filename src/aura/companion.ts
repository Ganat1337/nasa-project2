import type { Alert, CrewMember } from "@/domain/types";

export interface CompanionInsight {
  id: string;
  level: "info" | "warning" | "emergency";
  title: string;
  description: string;
  crewId?: string;
}

// All insights use simulated sensor readings. These are demo prompts, not diagnoses.
export function personalInsights(member: CrewMember, alerts: Alert[]): CompanionInsight[] {
  const active = alerts.filter((a) => a.active && a.crewId === member.id);
  const fromAlerts: CompanionInsight[] = active.map((alert) => ({
    id: alert.id,
    level: alert.level === "emergency" ? "emergency" : "warning",
    title: alert.title,
    description: `${alert.reason} Follow your approved onboard procedure and contact the flight surgeon when available.`,
    crewId: member.id,
  }));
  if (member.sleepHours24h < 6) fromAlerts.push({
    id: `${member.id}:sleep`, level: "info", title: "Sleep check-in",
    description: `The simulated log shows ${member.sleepHours24h.toFixed(1)} hours of sleep in the last 24 hours. How are you feeling?`,
    crewId: member.id,
  });
  if (member.vitals.stressIndex >= member.baseline.stressIndex + 20) fromAlerts.push({
    id: `${member.id}:stress`, level: "info", title: "Stress check-in",
    description: "Your simulated stress index is higher than your baseline. Would you like to talk about how you feel?",
    crewId: member.id,
  });
  return fromAlerts;
}

export function sharedCrewInsights(crew: CrewMember[]): CompanionInsight[] {
  if (crew.length < 2) return [];
  const results: CompanionInsight[] = [];
  const shortSleep = crew.filter((m) => m.sleepHours24h < 6);
  if (shortSleep.length >= 2) results.push({
    id: "crew:sleep", level: "info", title: "Shared sleep pattern",
    description: `${shortSleep.map((m) => m.name).join(" and ")} each have under 6 hours of sleep recorded in the simulated last-24-hour snapshot. This is a shared snapshot finding, not proof of a trend.`,
  });
  const elevatedStress = crew.filter((m) => m.vitals.stressIndex >= m.baseline.stressIndex + 20);
  if (elevatedStress.length >= 2) results.push({
    id: "crew:stress", level: "info", title: "Shared stress pattern",
    description: `${elevatedStress.map((m) => m.name).join(" and ")} have simulated stress indices at least 20 points above baseline.`,
  });
  return results;
}

export function offlineCompanionReply(question: string, member: CrewMember): string {
  const q = question.toLowerCase();
  const prefix = "Offline support uses local simulated data and preset safety guidance, not Gemini. ";
  if (/chest pain|can't breathe|cannot breathe|difficulty breathing|unconscious|faint|severe|emergency|ألم صدر|مش قادر اتنفس|إغماء|طوارئ/.test(q))
    return prefix + "Your message may describe an emergency. Follow the mission's approved emergency checklist immediately; alert nearby crew and use onboard emergency communications. Do not rely on this chat for diagnosis or treatment.";
  if (/dizz|nause|headache|unwell|sick|دوخ|صداع|تعبان|غثيان/.test(q))
    return prefix + "I'm listening. Move to a safe position, let a nearby crew member know how you feel, and consult the approved onboard medical checklist. If symptoms are severe, worsening, or accompanied by breathing trouble or chest pain, use emergency procedures immediately.";
  if (/heart|pulse|bpm|نبض/.test(q)) return prefix + `${member.name}'s current simulated heart rate is ${member.vitals.heartRateBpm.toFixed(0)} BPM.`;
  if (/oxygen|spo2|أكسجين/.test(q)) return prefix + `Your current simulated oxygen saturation is ${member.vitals.spo2Percent.toFixed(1)}%.`;
  if (/temp|حرار/.test(q)) return prefix + `Your current simulated temperature is ${member.vitals.temperatureC.toFixed(1)}°C.`;
  if (/sleep|slept|نوم|نمت/.test(q)) return prefix + `Your last-24-hour simulated sleep is ${member.sleepHours24h.toFixed(1)} hours.`;
  if (/stress|توتر|قلق/.test(q)) return prefix + `Your simulated stress index is ${member.vitals.stressIndex.toFixed(0)}/100. Would you like to describe how you're feeling?`;
  return prefix + `I'm here to listen, ${member.name.split(" ")[0]}. You can tell me how you feel or ask for your current heart rate, oxygen, temperature, stress or sleep. For symptoms, use the approved onboard guidance and notify a crew member.`;
}

export function createCrewReport(member: CrewMember): string {
  return [
    `AURA SIMULATED HEALTH REPORT — ${member.name}`,
    `Role: ${member.role} | Activity: ${member.activityState}`,
    `Heart rate: ${member.vitals.heartRateBpm.toFixed(0)} BPM (resting baseline ${member.baseline.restingHeartRateBpm} BPM)`,
    `SpO₂: ${member.vitals.spo2Percent.toFixed(1)}%`,
    `Temperature: ${member.vitals.temperatureC.toFixed(1)} °C`,
    `Stress index: ${member.vitals.stressIndex.toFixed(0)}/100 (baseline ${member.baseline.stressIndex})`,
    `Sleep, last 24h: ${member.sleepHours24h.toFixed(1)} h | Quality: ${member.sleepQuality.toFixed(0)}%`,
    `Workout: ${member.workoutMinutes.toFixed(0)} min`,
    `Radiation accumulated: ${member.vitals.radiationDoseMsv.toFixed(2)} mSv`,
    "All readings are fictional simulation outputs. This is not a medical assessment.",
  ].join("\n");
}
