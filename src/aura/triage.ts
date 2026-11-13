/** Deterministic demo safety prompts, not medical diagnosis or flight-approved protocols. */
export type SymptomKind = "headache" | "dizziness" | "breathing" | "chest" | "fainting" | "other";
export interface SymptomCheck { kind: SymptomKind; urgent: boolean; reply: string }
export function symptomCheck(input: string): SymptomCheck | null {
  const q = input.toLowerCase();
  const headache = /headache|head hurts|head pain|migraine|صداع|راسي بتوجع|دماغي بتوجع/.test(q);
  const dizzy = /dizz|lightheaded|دوخ|دوخة/.test(q);
  const chest = /chest pain|pain in my chest|ألم في الصدر|وجع صدري/.test(q);
  const breathing = /can't breathe|cannot breathe|trouble breathing|difficulty breathing|short of breath|مش قادر اتنفس|ضيق نفس/.test(q);
  const fainting = /faint|unconscious|passed out|اغم|إغماء/.test(q);
  const urgent = chest || breathing || fainting || /worst headache|sudden severe headache|vision loss|one.sided weakness|confusion|seizure|صداع شديد مفاجئ/.test(q);
  if (!headache && !dizzy && !urgent) return null;
  const kind: SymptomKind = chest ? "chest" : breathing ? "breathing" : fainting ? "fainting" : headache ? "headache" : "dizziness";
  if (urgent) return {
    kind, urgent: true,
    reply: "This could be urgent. Stop your activity and alert a nearby crew member immediately. Activate your mission's approved medical emergency procedure and emergency communications now. Do not wait for this chat or a reply from Earth. Would you like me to request emergency assistance through the configured medical channel?",
  };
  return {
    kind, urgent: false,
    reply: `${headache ? "For your headache" : "For your dizziness"}: pause what you're doing, move to a safe position, and tell a nearby crew member. Rest and follow your approved onboard symptom checklist; avoid driving or operating equipment while unwell. If you develop a sudden severe headache, fainting, weakness, confusion, chest pain, or breathing trouble, activate emergency procedures immediately.\n\nIs the pain sudden or severe, and do you have any other symptoms? Would you like me to request the flight doctor's help?`,
  };
}
