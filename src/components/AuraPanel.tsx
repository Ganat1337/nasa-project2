import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { CrewMember } from "@/domain/types";
import { offlineCompanionReply } from "@/aura/companion";
import { symptomCheck } from "@/aura/triage";

interface AuraPanelProps {
  isDoctor: boolean;
  connectionAvailable: boolean;
  starter: string;
  crew: CrewMember[];
  selected: CrewMember;
  onShowChart: (crewId: string) => void;
  onClose: () => void;
}

export function AuraPanel({ isDoctor, connectionAvailable, starter, crew, selected, onShowChart, onClose }: AuraPanelProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [symptom, setSymptom] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [contactState, setContactState] = useState("");
  const [contactPending, setContactPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  useEffect(() => { if (starter) setQuestion(starter); }, [starter]);
  const [messages, setMessages] = useState<Array<{ question: string; answer: string }>>([]);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);

  async function send(value: string) {
    const clean = value.trim();
    if (!clean || request.current) return;
    // Consistent, immediately actionable symptom support, regardless of Gemini/network availability.
    if (!isDoctor) {
      const triage = symptomCheck(clean);
      if (triage) {
        setSymptom(clean);
        setUrgent(triage.urgent);
        setContactState("");
        setMessages((current) => [...current, { question: clean, answer: triage.reply }]);
        setQuestion("");
        return;
      }
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      if (!connectionAvailable) {
        const text = isDoctor
          ? "Offline doctor chat is unavailable. The live simulated dashboard and local alert monitoring remain available."
          : offlineCompanionReply(clean, selected);
        setMessages((current) => [...current, { question: clean, answer: text }]);
        setQuestion("");
        return;
      }
      const response = await fetch("/api/aura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: clean,
          history: messages.slice(-24),
          crew: isDoctor ? crew : [selected],
          selectedId: selected.id,
          isDoctor,
        }),
      });
      const answer = await response.json();
      if (!response.ok) throw new Error(answer.error || "AURA could not answer. Try again.");
      if (typeof answer.text !== "string") throw new Error("AURA returned an unreadable answer.");
      if (controller.signal.aborted) return;
      setMessages((current) => [...current, { question: clean, answer: answer.text }]);
      setQuestion("");
      if (
        answer.chartCrewId &&
        (isDoctor || answer.chartCrewId === selected.id) &&
        crew.some((member) => member.id === answer.chartCrewId)
      )
        onShowChart(answer.chartCrewId);
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (!isDoctor) {
          setMessages((current) => [...current, { question: clean, answer: offlineCompanionReply(clean, selected) }]);
          setQuestion("");
          setError("AI service unavailable. Showing limited preset local support instead.");
        } else setError(failure instanceof Error ? failure.message : "Connection failed.");
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }

  async function contactDoctor() {
    if (isDoctor || contactPending) return;
    setContactPending(true);
    setContactState("Sending request…");
    try {
      const res = await fetch("/api/doctor-contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, crewId: selected.id, crewName: selected.name,
          urgency: urgent ? "emergency" : "routine", message: symptom || "Astronaut requests medical assistance." }),
      });
      const data = await res.json() as { accepted?: boolean; detail?: string; error?: string };
      if (!res.ok || !data.accepted) throw new Error(data.error || "Contact not completed.");
      setContactState("Request accepted by the configured medical endpoint. This does NOT confirm a doctor has received or responded. Follow mission communication procedures.");
    } catch (e) {
      setContactState(e instanceof Error ? e.message : "Contact unavailable. Use approved mission communications.");
    } finally { setContactPending(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    send(question);
  }

  const examples = isDoctor
    ? ["How is the whole crew?", "Who needs attention?", "Compare crew sleep", "Compare Maya and Javier", "Show Priya's temperature", "Show Maya’s heart-rate history"]
    : ["I have a headache", "I feel dizzy", "I'm feeling anxious", "I can't contact the doctor", "How is my health today?", "Show my heart-rate history", "How much did I sleep?", "What is my oxygen level?"];

  return (
    <aside
      id="aura-panel"
      className={expanded ? "panel aura-panel aura-panel--expanded" : "panel aura-panel"}
      aria-labelledby="aura-title"
    >
      <header className="aura-panel__header">
        <div className="aura-panel__identity">
          <span className="aura-panel__mark" aria-hidden="true">
            ✦
          </span>
          <div>
            <h2 id="aura-title">AURA</h2>
            <p>{isDoctor ? "Doctor Mode" : `${selected.name.split(" ")[0]} · Astronaut Mode`} · {connectionAvailable ? "AI online" : "Local only"}</p>
          </div>
        </div>
        <div className="aura-panel__actions">
          <button
            type="button"
            className="button"
            onClick={() => setExpanded(!expanded)}
            aria-pressed={expanded}
          >
            {expanded ? "Restore" : "Expand"}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => { setMessages([]); setSymptom(""); setContactState(""); setUrgent(false); }}
            disabled={pending || !messages.length}
          >
            New chat
          </button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close AURA">
            ×
          </button>
        </div>
      </header>
      {messages.length ? (
        <div className="aura-panel__messages" ref={log} role="log" aria-label="AURA conversation">
          {messages.map((message, index) => (
            <div className="aura-panel__exchange" key={index}>
              <p className="aura-panel__question">{message.question}</p>
              <p className="aura-panel__answer">{message.answer}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="aura-panel__body">
          <h3>{isDoctor ? "Ask about the crew" : `Hi ${selected.name.split(" ")[0]}, how can I help?`}</h3>
          <p className="aura-panel__status">
            {isDoctor ? "Explore simulated crew readings and trends." : "Choose a question below or describe how you feel. AURA can guide you and offer to request medical support."}
          </p>
          <ul className="aura-panel__examples" aria-label="Example questions">
            {examples.map((example) => (
              <li key={example}>
                <button type="button" disabled={pending} onClick={() => send(example)}>
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isDoctor && messages.length > 0 && (
        <div className="aura-panel__quick-actions" aria-label="Astronaut quick actions">
          <button type="button" disabled={pending} onClick={() => send("I have a headache")}>Headache</button>
          <button type="button" disabled={pending} onClick={() => send("I feel dizzy")}>Dizzy</button>
          <button type="button" disabled={pending} onClick={() => send("How is my health today?")}>My health</button>
          <button type="button" disabled={pending} onClick={() => send("I can't contact the doctor")}>No doctor connection</button>
        </div>
      )}
      {!isDoctor && (symptom || messages.length > 0) && (
        <div className="aura-contact" aria-label="Medical assistance">
          <p>Need medical help? AURA will only send a request after you choose to proceed. Emergency help must follow approved onboard procedures.</p>
          <button type="button" className="button" disabled={contactPending} onClick={contactDoctor}>
            {contactPending ? "Requesting…" : urgent ? "Yes — request emergency help" : "Yes — contact flight doctor"}
          </button>
          {contactState && <p role="status">{contactState}</p>}
        </div>
      )}
      {pending && (
        <p className="aura-panel__status" role="status">
          AURA is checking your data…
        </p>
      )}
      {error && (
        <p className="aura-panel__status" role="alert">
          {error}
        </p>
      )}
      <form className="aura-panel__composer" onSubmit={submit}>
        <input
          aria-label="Ask AURA"
          placeholder="Ask AURA…"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button type="submit" className="button" disabled={pending || !question.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
}
