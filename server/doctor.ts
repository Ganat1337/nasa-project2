import type { Plugin, ViteDevServer } from "vite";

/** Optional server-side integration with an operator-provided medical escalation endpoint.
 * Never imply message delivery when unavailable. This is not a substitute for emergency comms.
 */
export function doctorPlugin(endpoint: string, token: string): Plugin {
  const install = (server: Pick<ViteDevServer, "middlewares">) => {
    server.middlewares.use("/api/doctor-contact", async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      const respond = (code: number, payload: object) => { res.statusCode = code; res.end(JSON.stringify(payload)); };
      if (req.method !== "POST") return respond(405, { error: "POST required." });
      const origin = req.headers.origin;
      if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`)
        return respond(403, { error: "Origin rejected." });
      if (!endpoint) return respond(503, { error: "Doctor contact is not connected. Configure DOCTOR_ALERT_WEBHOOK_URL on the server. Use approved crew/mission communications instead." });
      try {
        let raw = "";
        for await (const chunk of req) { raw += chunk; if (raw.length > 10000) return respond(413, { error: "Request too large." }); }
        const body: unknown = JSON.parse(raw);
        if (!body || typeof body !== "object") return respond(400, { error: "Invalid request." });
        const b = body as Record<string, unknown>;
        if (b.consent !== true || typeof b.crewId !== "string" || typeof b.crewName !== "string" || typeof b.message !== "string" || typeof b.urgency !== "string" || !["routine", "emergency"].includes(b.urgency) || b.message.length > 1000 || b.crewName.length > 100)
          return respond(400, { error: "Explicit consent and valid request are required." });
        const abort = AbortSignal.timeout(12000);
        const result = await fetch(endpoint, {
          method: "POST", signal: abort,
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ source: "AURA simulated mission", crewId: b.crewId, crewName: b.crewName, urgency: b.urgency, message: b.message, timestamp: new Date().toISOString() }),
        });
        if (!result.ok) return respond(502, { error: "Medical contact endpoint did not accept the request. Use approved mission communications." });
        return respond(200, { accepted: true, detail: "Request accepted by the configured endpoint; receipt by a doctor is not confirmed." });
      } catch { return respond(502, { error: "Contact request could not be sent. Use approved mission communications." }); }
    });
  };
  return { name: "aura-doctor-contact", configureServer: install, configurePreviewServer: install };
}
