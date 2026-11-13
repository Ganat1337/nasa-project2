import type { CrewMember } from "@/domain/types";

const metrics = [
  {
    match: /heart rate|heartbeat|pulse|bpm|نبض/,
    label: "Heart rate",
    read: (m: CrewMember) => m.vitals.heartRateBpm,
    unit: "BPM",
  },
  {
    match: /oxygen|spo2|أكسجين|اكسجين/,
    label: "Oxygen saturation",
    read: (m: CrewMember) => m.vitals.spo2Percent,
    unit: "%",
  },
  {
    match: /temperature|حرارة/,
    label: "Body temperature",
    read: (m: CrewMember) => m.vitals.temperatureC,
    unit: "°C",
  },
  {
    match: /stress|توتر/,
    label: "Stress index",
    read: (m: CrewMember) => m.vitals.stressIndex,
    unit: "/100",
  },
  {
    match: /radiation|إشعاع|اشعاع/,
    label: "Radiation dose",
    read: (m: CrewMember) => m.vitals.radiationDoseMsv,
    unit: "mSv",
  },
  {
    match: /workout|exercise|تمرين|رياضة/,
    label: "Workout",
    read: (m: CrewMember) => m.workoutMinutes,
    unit: "min",
  },
  {
    match: /sleep|slept|نوم|نام|نمت/,
    label: "Sleep (last 24 hours)",
    read: (m: CrewMember) => m.sleepHours24h,
    unit: "h",
  },
  {
    match: /quality|جودة/,
    label: "Sleep quality",
    read: (m: CrewMember) => m.sleepQuality,
    unit: "%",
  },
];

export interface AuraAnswer {
  text: string;
  chartCrewId?: string;
}

export function answerAura(
  question: string,
  crew: CrewMember[],
  selected: CrewMember,
  isDoctor: boolean,
): AuraAnswer {
  const query = question.toLowerCase().replace(/[-‐‑–]/g, " ");
  const named = crew.filter((member) =>
    [member.name, ...member.name.split(" "), member.role, member.id.replace("-", " ")].some(
      (alias) => new RegExp(`\\b${alias.toLowerCase()}\\b`).test(query),
    ),
  );
  const compare =
    /compare|most|least|highest|lowest|crew|everyone|all astronauts|قارن|الطاقم|أكتر|أقل/.test(
      query,
    );
  if (!isDoctor && (compare || named.some((member) => member.id !== selected.id))) {
    return { text: "Astronaut Mode shows your own health data." };
  }

  if (!named.length && /\b(?!what|who|how|it|that|there)[\p{L}]+[’']s\b/iu.test(question)) {
    return {
      text: "I couldn’t match that name to an astronaut. Use a name from the crew roster or ask for your own readings in Astronaut Mode.",
    };
  }

  if (isDoctor && !named.length && !compare && !/selected|current|المحدد/.test(query)) {
    return {
      text:
        "Which astronaut? " +
        crew.map((member) => member.name).join(", ") +
        ". You can also say selected astronaut.",
    };
  }

  const targets = named.length ? named : compare ? crew : [selected];
  const requested = metrics.filter((metric) => metric.match.test(query));
  const wantsHistory = /history|chart|graph|trend|تاريخ|رسم/.test(query);
  const wantsLongPeriod = /week|month|yesterday|days|أسبوع|اسبوع|شهر|امبارح/.test(query);
  if (/why|should|diagnos|treatment|ليه|تشخيص/.test(query)) {
    return {
      text: "I can look up simulated health readings. Try asking for a metric or a crew summary.",
    };
  }
  if (wantsHistory && requested.length === 1 && requested[0] === metrics[0] && !wantsLongPeriod) {
    if (targets.length !== 1)
      return { text: "Choose one astronaut to open their heart-rate chart." };
    const member = targets[0];
    return {
      text: `${member.name} · opened the heart-rate chart with ${member.heartRateHistory.length} available readings.`,
      chartCrewId: member.id,
    };
  }
  if (wantsHistory || wantsLongPeriod) {
    return {
      text: "Historical charts are available for recent heart-rate readings. Sleep data covers the last 24 hours.",
    };
  }

  const overview = /summary|overview|vitals|telemetry|health data|readings|ملخص|قراءات/.test(query);
  if (!requested.length && !overview) {
    return {
      text: "Ask for a crew member’s heart rate, oxygen, temperature, stress, radiation, workout, or sleep. You can also ask for a health summary.",
    };
  }

  const fields = requested.length ? requested : metrics;
  const ranking = query.match(/most|highest|least|lowest|أكتر|أقل/)?.[0];
  const metric = fields[0];
  const rows =
    ranking && fields.length === 1
      ? [...targets].sort(
          (a, b) => (metric.read(b) - metric.read(a)) * (/least|lowest|أقل/.test(ranking) ? -1 : 1),
        )
      : targets;
  return {
    text: rows
      .map(
        (member) =>
          `${member.name}\n${fields.map(({ label, read, unit }) => `${label}: ${Number(read(member).toFixed(2))} ${unit}`).join("\n")}`,
      )
      .join("\n\n"),
  };
}
