import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Live server-side state snapshot so progress and model updates persist across reloads
let liveServerState: Record<string, unknown> | null = null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // Health & integration readiness endpoint (no secrets exposed)
  app.get("/api/health", (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    res.json({
      status: "ok",
      aiConfigured: Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY"),
      datasetMode: "simulated_with_api_adapter",
      hasPersistedState: liveServerState !== null,
      timestamp: new Date().toISOString(),
    });
  });

  // Live state persistence endpoints
  app.get("/api/state", (_req, res) => {
    res.json({ state: liveServerState });
  });

  app.post("/api/state", (req, res) => {
    const { state } = req.body ?? {};
    if (!state || typeof state !== "object") {
      return res.status(400).json({ error: "Invalid state payload." });
    }
    liveServerState = state as Record<string, unknown>;
    return res.json({ saved: true, updatedAt: new Date().toISOString() });
  });

  app.post("/api/state/reset", (_req, res) => {
    liveServerState = null;
    return res.json({ reset: true });
  });

  // Live Step-Tracking Interactive AI Co-Pilot Reaction Endpoint
  app.post("/api/ai/react", async (req, res) => {
    const {
      eventTitle,
      eventDetail,
      language = "en",
      completedSteps = [],
      contextSnapshot = {},
    } = req.body ?? {};

    const langNames: Record<string, string> = {
      en: "English",
      kn: "Kannada (ಕನ್ನಡ)",
      hi: "Hindi (हिन्दी)",
    };
    const targetLang = langNames[language] || "English";

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key not configured.",
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `The user just performed an action in the live GramRide AI model:
Action: ${eventTitle}
Details: ${eventDetail}
Completed Steps (${completedSteps.length}/7): ${JSON.stringify(completedSteps)}
Live Network Snapshot: ${JSON.stringify(contextSnapshot)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are the Live Interactive Co-Pilot inside GramRide AI.
Respond strictly in ${targetLang}.
React directly to what the user just did in 2 short, conversational sentences:
1. Confirm the live impact using exact numbers from the Live Network Snapshot (demand, govt seats, shortage, backup vans, or detour status).
2. Prompt or guide the user on the best next step to test in the network.
Return valid JSON matching the schema.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "Short 2-sentence interactive response reacting to the user's step.",
              },
              nextStepHint: {
                type: Type.STRING,
                description: "Short label for recommended next action (max 5 words).",
              },
              recommendedPage: {
                type: Type.STRING,
                description:
                  "One of: home, student, planner, pool, predictions, emergency, parent, provider, authority, admin",
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      return res.json({
        message: parsed.message ?? eventDetail,
        nextStepHint: parsed.nextStepHint ?? "Continue Workflow",
        recommendedPage: parsed.recommendedPage ?? "pool",
      });
    } catch {
      const snap = (contextSnapshot ?? {}) as Record<string, unknown>;
      const demand = Number(snap.demand ?? 60);
      const seats = Number(snap.govtBusSeats ?? 35);
      const shortage = Number(snap.shortage ?? Math.max(0, demand - seats));
      const disrupted = Boolean(snap.disruptionActive);

      let nextStepHint = "Open Mobility Pool";
      let recommendedPage = "pool";
      if (!completedSteps.includes("step_guardian")) {
        nextStepHint = "Approve Guardian Trip";
        recommendedPage = "parent";
      } else if (!completedSteps.includes("step_boarding")) {
        nextStepHint = "Verify Boarding PIN";
        recommendedPage = "student";
      } else if (!completedSteps.includes("step_disruption")) {
        nextStepHint = "Test Route Detour";
        recommendedPage = "emergency";
      } else if (!completedSteps.includes("step_authority")) {
        nextStepHint = "Redistribute Bus";
        recommendedPage = "authority";
      } else if (!completedSteps.includes("step_arrival")) {
        nextStepHint = "Notify College ETA";
        recommendedPage = "pool";
      }

      const fallbackMsg =
        language === "kn"
          ? `${eventTitle}: ${demand} ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ${seats} ಸರ್ಕಾರಿ ಬಸ್ ಆಸನಗಳಿವೆ (${shortage} ಕೊರತೆ). ${disrupted ? "ಪರ್ಯಾಯ ಮಾರ್ಗ ಸಕ್ರಿಯವಾಗಿದೆ." : "ಮುಂದಿನ ಹಂತಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ."}`
          : language === "hi"
          ? `${eventTitle}: ${demand} छात्रों के लिए ${seats} सरकारी सीटें उपलब्ध हैं (${shortage} की कमी)। ${disrupted ? "वैकल्पिक मार्ग सक्रिय है।" : "कृपया अगले चरण पर जाएं।"}`
          : `${eventTitle} recorded: ${demand} student demand vs. ${seats} govt seats (${shortage} shortage). ${disrupted ? "Adaptive detour is active." : "Proceed to the next recommended step below."}`;

      return res.json({
        message: fallbackMsg,
        nextStepHint,
        recommendedPage,
        mode: "live_deterministic_fallback",
      });
    }
  });

  // 1. Regional-Language Conversational Assistant (EN / KN / HI)
  app.post("/api/ai/chat", async (req, res) => {
    const { message, language = "en", contextSnapshot } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "A valid message string is required." });
    }

    const langNames: Record<string, string> = {
      en: "English",
      kn: "Kannada (ಕನ್ನಡ)",
      hi: "Hindi (हिन्दी)",
    };
    const targetLang = langNames[language] || "English";

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured in environment secrets.",
        fallbackUsed: true,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `User question (${targetLang}): ${message}\n\nCurrent Network Snapshot:\n${JSON.stringify(
          contextSnapshot ?? {},
          null,
          2
        )}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are GramRide AI Assistant, a practical rural student transportation coordinator.
Respond strictly in ${targetLang}.
Keep answers concise (under 110 words), clear for rural students and parents, and grounded ONLY in the provided Current Network Snapshot.
Always prioritize government buses first, and only recommend verified backup shuttles when bus capacity is full or disrupted.
Remind minors that guardian approval is mandatory before boarding backup vehicles.
Do not invent bus numbers or routes that are not in the snapshot.`,
        },
      });

      return res.json({
        reply: response.text ?? "Unable to generate a response right now.",
        language,
        model: "gemini-4-hydrogen",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gemini request failed";
      return res.status(500).json({ error: msg });
    }
  });

  // 2. AI Shortage Prediction & Resource Allocation Briefing
  app.post("/api/ai/predict", async (req, res) => {
    const {
      villages = [],
      buses = [],
      horizon = "tomorrow",
      language = "en",
      plan,
    } = req.body ?? {};

    const langNames: Record<string, string> = {
      en: "English",
      kn: "Kannada (ಕನ್ನಡ)",
      hi: "Hindi (हिन्दी)",
    };
    const targetLang = langNames[language] || "English";

    const buildDeterministicBriefing = () => {
      if (plan && typeof plan === "object") {
        const p = plan as {
          districtName?: string;
          totalPredictedDemand?: number;
          confirmedGovtSeats?: number;
          shortageBefore?: number;
          shortageAfter?: number;
          shortageReductionPct?: number;
          additionalDepotBusesRecommended?: number;
          totalVansUsed?: number;
          totalAutosUsed?: number;
          totalAccommodatedAfter?: number;
          examStudentsTotal?: number;
          examStudentsAccommodated?: number;
          totalDailyCostInr?: number;
          estimatedArrivalWindow?: string;
          villagePlans?: Array<{
            villageName: string;
            shortageBefore: number;
            recommendationText: string;
          }>;
        };
        const criticalVillages = (p.villagePlans ?? [])
          .filter((v) => v.shortageBefore > 0)
          .map((v) => v.villageName);
        const district = p.districtName ?? "Rural District";
        const summaryEn = `${district}: ${p.totalPredictedDemand ?? 0} predicted demand vs ${p.confirmedGovtSeats ?? 0} confirmed govt bus seats leaves a ${p.shortageBefore ?? 0}-seat shortage. AI deploys +${p.additionalDepotBusesRecommended ?? 0} reserve depot bus, ${p.totalVansUsed ?? 0} backup vans & ${p.totalAutosUsed ?? 0} rural autos, accommodating ${p.totalAccommodatedAfter ?? 0}/${p.totalPredictedDemand ?? 0} students (${p.shortageReductionPct ?? 100}% shortage reduction, Est. ₹${p.totalDailyCostInr ?? 0}/day, ETA ${p.estimatedArrivalWindow ?? "08:20 AM"}).`;
        const summaryKn = `${district}: ${p.totalPredictedDemand ?? 0} ಅಂದಾಜು ಬೇಡಿಕೆಗೆ ${p.confirmedGovtSeats ?? 0} ದೃಢೀಕೃತ ಬಸ್ ಆಸನಗಳಿದ್ದು ${p.shortageBefore ?? 0} ಕೊರತೆ ಇದೆ. +${p.additionalDepotBusesRecommended ?? 0} ಡಿಪೋ ಬಸ್, ${p.totalVansUsed ?? 0} ವ್ಯಾನ್ ಮತ್ತು ${p.totalAutosUsed ?? 0} ಆಟೋಗಳಿಂದ ${p.totalAccommodatedAfter ?? 0} ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸ್ಥಳ ಕಲ್ಪಿಸಲಾಗಿದೆ (ETA ${p.estimatedArrivalWindow ?? "08:20 AM"}).`;
        const summaryHi = `${district}: ${p.totalPredictedDemand ?? 0} अनुमानित मांग के मुकाबले ${p.confirmedGovtSeats ?? 0} कन्फर्म सरकारी सीटें हैं (${p.shortageBefore ?? 0} की कमी)। +${p.additionalDepotBusesRecommended ?? 0} डिपो बस, ${p.totalVansUsed ?? 0} बैकअप वैन और ${p.totalAutosUsed ?? 0} ऑटो से ${p.totalAccommodatedAfter ?? 0} छात्रों का समायोजन हुआ (ETA ${p.estimatedArrivalWindow ?? "08:20 AM"})।`;

        return {
          executiveSummary:
            language === "kn" ? summaryKn : language === "hi" ? summaryHi : summaryEn,
          criticalVillages,
          redistributionAction: `Deploy +${p.additionalDepotBusesRecommended ?? 0} depot bus (40 seats), ${p.totalVansUsed ?? 0} vans (12 seats), and ${p.totalAutosUsed ?? 0} rural autos across ${criticalVillages.join(", ") || district}; ${p.examStudentsAccommodated ?? 0}/${p.examStudentsTotal ?? 0} exam students prioritized first.`,
          backupVehiclesNeeded: (p.totalVansUsed ?? 0) + (p.totalAutosUsed ?? 0),
          safetyNote:
            "Police-verified drivers only; Guardian PIN remains mandatory for minors and college principals receive live shortage/ETA notices.",
        };
      }

      const vList = Array.isArray(villages) ? villages : [];
      const bList = Array.isArray(buses) ? buses : [];
      const totalDem = vList.reduce(
        (acc: number, v: { predictedDemand?: number }) => acc + Number(v.predictedDemand ?? 0),
        0
      );
      const totalCap = bList
        .filter((b: { status?: string }) => b.status !== "Cancelled")
        .reduce((acc: number, b: { totalSeats?: number }) => acc + Number(b.totalSeats ?? 0), 0);
      const short = Math.max(0, totalDem - totalCap);
      const vans = Math.ceil(short / 12);
      return {
        executiveSummary: `${totalDem} predicted demand vs ${totalCap} confirmed bus seats (${short} shortage). Dispatch ${vans} verified backup shuttles and prioritize <2h exam students.`,
        criticalVillages: vList.map((v: { name?: string }) => v.name ?? "Village"),
        redistributionAction: `Assign ${vans} backup vans and shift reserve depot bus to primary shortage corridor.`,
        backupVehiclesNeeded: vans,
        safetyNote: "Guardian PIN & police verification enforced on all backup vehicles.",
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ briefing: buildDeterministicBriefing(), mode: "deterministic_solver" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Analyze this rural student mobility allocation for horizon "${horizon}" and respond in ${targetLang}:
Verified Solver Plan (strictly respect all numbers — never exceed vehicle seat capacity): ${JSON.stringify(plan ?? {})}
Villages: ${JSON.stringify(villages)}
Government Buses: ${JSON.stringify(buses)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are GramRide AI Transit Planner. Respond strictly in ${targetLang}.
Distinguish predicted student demand from confirmed government bus & verified partner availability.
Prioritize students with upcoming exams, recommend depot buses + backup vans + shared rural autos, mention pickup optimization, ETA window, and cost.
Never claim more students accommodated than total vehicle seat capacity in Verified Solver Plan.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description: "2-3 sentence quantitative summary of shortages before vs after, depot/van/auto allocation, exam priority, cost, and ETA.",
              },
              criticalVillages: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Names of villages facing initial seat shortages.",
              },
              redistributionAction: {
                type: Type.STRING,
                description: "Specific depot bus, backup van, rural auto, and pickup route optimization action.",
              },
              backupVehiclesNeeded: {
                type: Type.INTEGER,
                description: "Total backup vans + shared rural autos used.",
              },
              safetyNote: {
                type: Type.STRING,
                description: "Exam priority, police verification, and guardian approval reminder.",
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      return res.json({ briefing: parsed, model: "gemini-4-hydrogen" });
    } catch {
      return res.json({ briefing: buildDeterministicBriefing(), mode: "deterministic_fallback" });
    }
  });

  // 2b. AI District Multi-Person Resource Optimization
  app.post("/api/ai/optimize-district", async (req, res) => {
    const { districtName, people = [], buses = [], language = "en" } = req.body ?? {};
    const langNames: Record<string, string> = {
      en: "English",
      kn: "Kannada (ಕನ್ನಡ)",
      hi: "Hindi (हिन्दी)",
    };
    const targetLang = langNames[language] || "English";

    const buildFallback = () => {
      const assignments = (people as Array<{
        id: string;
        personName: string;
        originVillageId: string;
        destination: string;
      }>).map((p) => {
        const bus = (buses as Array<{
          originVillageId: string;
          destinationName: string;
          totalSeats: number;
          occupiedSeats: number;
          status: string;
        }>).find((b) => b.originVillageId === p.originVillageId);
        const free = bus && bus.status !== "Cancelled" ? bus.totalSeats - bus.occupiedSeats : 0;
        const sameDest = bus?.destinationName === p.destination;
        const mode = free > 0 && sameDest ? "govt_bus" : "pool_van";
        return {
          personId: p.id,
          recommendedMode: mode,
          reason:
            mode === "govt_bus"
              ? "Free seats on Government Bus."
              : "Bus full or different destination; pooled into verified backup van.",
        };
      });
      return {
        summary: `Optimized ${assignments.length} travelers in ${districtName}: prioritized government buses where seats exist and pooled remaining students into verified backup vans.`,
        assignments,
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(buildFallback());
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `District: ${districtName}
Language: ${targetLang}
Travelers: ${JSON.stringify(people)}
Government Buses: ${JSON.stringify(buses)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are an AI rural transportation coordinator. Respond in ${targetLang}.
Assign each person in Travelers to the best mode ("govt_bus", "pool_van", or "verified_auto"):
- Always choose "govt_bus" if a matching origin bus has free seats (>0), is not Cancelled, and matches their destination.
- Otherwise pool travelers into "pool_van" (verified shared shuttle) or "verified_auto" (for 1-2 travelers going to a unique destination).
Keep summary to 1-2 short clear sentences.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              assignments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    personId: { type: Type.STRING },
                    recommendedMode: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      return res.json({
        summary: parsed.summary ?? buildFallback().summary,
        assignments: Array.isArray(parsed.assignments) ? parsed.assignments : buildFallback().assignments,
      });
    } catch {
      return res.json(buildFallback());
    }
  });

  // 3. AI Smart Journey Planner Recommendation
  app.post("/api/ai/plan-journey", async (req, res) => {
    const { requestDetails, availableOptions, language = "en" } = req.body ?? {};
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured in environment secrets.",
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Plan the safest, most affordable student journey in language "${language}".
Student Request: ${JSON.stringify(requestDetails ?? {})}
Available Transport Options: ${JSON.stringify(availableOptions ?? {})}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "Recommend Government Bus first if seats are available and arrival time is met. If full or disrupted, recommend the verified Village Mobility Pool backup vehicle with shared pickup point, estimated cost, and guardian approval notice for minors. Output 3 short clear sentences.",
        },
      });

      return res.json({
        recommendation: response.text ?? "Follow the matched transport plan shown below.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Journey planning AI failed";
      return res.status(500).json({ error: msg });
    }
  });

  // 4. Offline-First SMS & Missed-Call Enquiry Engine
  app.post("/api/ai/sms-enquiry", async (req, res) => {
    const { command, language = "en", liveSummary } = req.body ?? {};
    const text = typeof command === "string" ? command.trim().toUpperCase() : "BUS";

    const totalStudents = Number(liveSummary?.totalStudents ?? 60);
    const busSeats = Number(liveSummary?.busSeats ?? 35);
    const shortage = Math.max(0, totalStudents - busSeats);

    let smsReply = "";
    if (language === "kn") {
      if (text.includes("STATUS") || text.includes("POOL")) {
        smsReply = `GramRide: Magadi Bus KA42F1104 (${busSeats} seats FULL). ${shortage} vidyarthigalige backup Van KA42T4421 07:40 AM Kempapura Cross nalli siddhavide. Parent OTP agatyavide.`;
      } else {
        smsReply = `GramRide SMS: Mundina Govt Bus 07:35 AM (${busSeats} seats). Seat illadiddare Backup Shuttle 07:45 AM (Rs 15). Missed call: 1800-425-4726.`;
      }
    } else if (language === "hi") {
      if (text.includes("STATUS") || text.includes("POOL")) {
        smsReply = `GramRide: Bus KA42F1104 (${busSeats} seats) bhari hai. ${shortage} chhatron ke liye Backup Van KA42T4421 07:40 AM Kempapura Cross par tayyar hai. Guardian approval zaroori.`;
      } else {
        smsReply = `GramRide SMS: Agli Govt Bus 07:35 AM (${busSeats} seats). Seat na milne par Verified Shuttle 07:45 AM (Rs 15). Missed call: 1800-425-4726.`;
      }
    } else {
      if (text.includes("STATUS") || text.includes("POOL")) {
        smsReply = `GramRide: Govt Bus KA42F1104 (${busSeats} seats) full. ${shortage} students assigned to Verified Van KA42T4421 & KA42T4490 at 07:40 AM. Guardian PIN required.`;
      } else if (text.includes("SOS") || text.includes("HELP")) {
        smsReply = `GramRide SOS: Emergency desk notified. Nearest Patrol & College Nodal Officer alerted. Call 1800-425-4726 for immediate voice support.`;
      } else {
        smsReply = `GramRide SMS: Magadi-College Bus 07:35 AM (${busSeats}/${totalStudents} demand). Overflow Pool Van at Kempapura Cross 07:45 AM, Rs 15. Reply STATUS for PIN.`;
      }
    }

    return res.json({
      smsReply,
      byteLength: Buffer.byteLength(smsReply, "utf8"),
      channel: "2G-SMS-GATEWAY-SIM",
    });
  });

  // 5. External Dataset / GTFS Adapter Endpoint
  app.post("/api/dataset/validate", (req, res) => {
    const { payload } = req.body ?? {};
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid JSON dataset payload." });
    }
    const villagesCount = Array.isArray(payload.villages) ? payload.villages.length : 0;
    const busesCount = Array.isArray(payload.buses) ? payload.buses.length : 0;
    return res.json({
      valid: true,
      villagesCount,
      busesCount,
      message: `Validated external feed (${villagesCount} villages, ${busesCount} buses).`,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GramRide AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
