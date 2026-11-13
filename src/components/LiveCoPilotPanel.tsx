import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Mic,
  Pause,
  PhoneCall,
  Play,
  Send,
  Volume2,
  X,
} from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { LANGUAGE_LABELS } from "../i18n/translations";
import { Language, LiveStepId, PageId } from "../types/mobility";

interface LiveStepDef {
  id: LiveStepId;
  label: string;
  targetPage: PageId;
}

const LIVE_STEPS: LiveStepDef[] = [
  { id: "step_demand", label: "1. Detect 60/35 Seat Shortage", targetPage: "home" },
  { id: "step_pool", label: "2. Pool Pickups & Backup Vans", targetPage: "pool" },
  { id: "step_guardian", label: "3. Approve Minor Guardian Trip", targetPage: "parent" },
  { id: "step_boarding", label: "4. Verify Boarding PIN (4829)", targetPage: "student" },
  { id: "step_disruption", label: "5. Test Road Detour / SOS", targetPage: "emergency" },
  { id: "step_authority", label: "6. Redistribute Spare Bus", targetPage: "authority" },
  { id: "step_arrival", label: "7. Notify College Arrival", targetPage: "pool" },
];

export const LiveCoPilotPanel: React.FC<{ mode: "docked" | "drawer" }> = ({ mode }) => {
  const {
    assistantOpen,
    setAssistantOpen,
    language,
    setLanguage,
    setActivePage,
    liveSim,
    toggleLiveSimulation,
    setLiveSpeed,
    toggleAutoReact,
    toggleAutoSpeak,
    coPilotMessages,
    coPilotLoading,
    sendCoPilotChat,
    scenario,
    poolAllocation,
  } = useMobility();

  const [tab, setTab] = useState<"copilot" | "steps" | "sms">("copilot");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const [smsCommand, setSmsCommand] = useState("BUS KEMPAPURA");
  const [smsLog, setSmsLog] = useState<Array<{ from: string; text: string; bytes?: number }>>([
    {
      from: "GramRide 2G Gateway",
      text: "Send BUS, STATUS, or SOS to 56070 or place a missed call to 1800-425-4726.",
    },
  ]);

  if (mode === "drawer" && !assistantOpen) return null;

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utter);
  };

  const startVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-IN";
    setListening(true);
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        void sendCoPilotChat(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const sendSmsCommand = async (cmdOverride?: string) => {
    const cmd = (cmdOverride ?? smsCommand).trim();
    if (!cmd) return;
    setSmsLog((prev) => [...prev, { from: "Student Phone (2G SMS)", text: cmd }]);
    try {
      const res = await fetch("/api/ai/sms-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          language,
          liveSummary: {
            totalStudents: scenario.totalStudents,
            busSeats: poolAllocation.totalGovtSeats,
          },
        }),
      });
      const data = await res.json();
      setSmsLog((prev) => [
        ...prev,
        { from: "GramRide 2G Gateway", text: data.smsReply, bytes: data.byteLength },
      ]);
    } catch {
      setSmsLog((prev) => [
        ...prev,
        {
          from: "GramRide Offline Cache",
          text: "Cached: Govt Bus 07:35 AM. Backup Van KA42T4421 07:42 AM at Kempapura Cross.",
        },
      ]);
    }
  };

  const completedCount = liveSim.completedSteps.length;

  const panelContent = (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-teal-700 flex items-center justify-between bg-teal-800 text-white">
        <div>
          <h2 className="text-sm font-semibold">Live AI Co-Pilot & Step Tracker</h2>
          <p className="text-xs text-teal-100 font-mono tabular-nums">
            {completedCount}/7 Steps · Bus {Math.round(liveSim.busProgressPct)}% · Van{" "}
            {Math.round(liveSim.vanProgressPct)}%
          </p>
        </div>
        {mode === "drawer" && (
          <button
            onClick={() => setAssistantOpen(false)}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Close Live Co-Pilot"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Vehicle Simulation Controls */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLiveSimulation}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium text-slate-800 hover:bg-slate-100 inline-flex items-center gap-1"
          >
            {liveSim.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {liveSim.running ? "Pause Live" : "Resume Live"}
          </button>
          <button
            onClick={() => setLiveSpeed(liveSim.speed === 1 ? 5 : 1)}
            className="px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-700 hover:bg-slate-100"
          >
            {liveSim.speed}x
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={liveSim.autoReactEnabled}
              onChange={toggleAutoReact}
              className="accent-teal-800"
            />
            Auto-React
          </label>
          <label className="inline-flex items-center gap-1 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={liveSim.autoSpeakEnabled}
              onChange={toggleAutoSpeak}
              className="accent-teal-800"
            />
            Voice
          </label>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between gap-2 bg-white">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
          <button
            onClick={() => setTab("copilot")}
            className={`px-2.5 py-1 text-xs font-medium rounded inline-flex items-center gap-1 ${
              tab === "copilot" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <MessageSquare className="w-3 h-3" /> Live AI
          </button>
          <button
            onClick={() => setTab("steps")}
            className={`px-2.5 py-1 text-xs font-medium rounded ${
              tab === "steps" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Steps ({completedCount}/7)
          </button>
          <button
            onClick={() => setTab("sms")}
            className={`px-2.5 py-1 text-xs font-medium rounded inline-flex items-center gap-1 ${
              tab === "sms" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            <PhoneCall className="w-3 h-3" /> 2G SMS
          </button>
        </div>

        <select
          aria-label="Co-Pilot Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700"
        >
          {(["en", "kn", "hi"] as Language[]).map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Body */}
      {tab === "copilot" && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[420px] xl:max-h-[460px]">
            {coPilotMessages.map((msg) => {
              if (msg.sender === "step-event") {
                return (
                  <div
                    key={msg.id}
                    className="text-xs px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-slate-700"
                  >
                    <span className="font-mono text-slate-500 mr-1.5">{msg.timestamp}</span>
                    <span className="font-medium">{msg.text}</span>
                  </div>
                );
              }
              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-teal-800 text-white ml-6"
                      : "bg-teal-50 text-slate-900 mr-3 border border-teal-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.sender === "assistant" && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => speakText(msg.text)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:underline"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Speak
                      </button>
                      {msg.suggestedPage && msg.suggestedActionLabel && (
                        <button
                          onClick={() => {
                            setActivePage(msg.suggestedPage!);
                            if (mode === "drawer") setAssistantOpen(false);
                          }}
                          className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded font-semibold"
                        >
                          {msg.suggestedActionLabel} →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {coPilotLoading && (
              <div className="text-xs font-mono text-teal-800 px-2">
                Live model reacting to your step...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
            <div className="flex flex-wrap gap-1">
              {[
                "What should I do next?",
                "Are minors safe right now?",
                "ಕನ್ನಡದಲ್ಲಿ ಸ್ಥಿತಿ ತಿಳಿಸಿ",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => void sendCoPilotChat(q)}
                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim()) return;
                void sendCoPilotChat(input);
                setInput("");
              }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={startVoiceInput}
                className={`p-2 rounded border ${
                  listening
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
                aria-label="Speak to Live Co-Pilot"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask or command live model..."
                className="flex-1 px-2.5 py-2 text-xs border border-slate-300 rounded-md"
              />
              <button
                type="submit"
                disabled={coPilotLoading}
                className="px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-md disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      )}

      {tab === "steps" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-xs text-slate-600 pb-1">
            Every action you take across the dashboards checks off these live steps automatically. Click any step to jump straight there.
          </p>
          {LIVE_STEPS.map((step) => {
            const done = liveSim.completedSteps.includes(step.id);
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActivePage(step.targetPage);
                  if (mode === "drawer") setAssistantOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
                  done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  {step.label}
                </span>
                <span className="text-teal-800 font-semibold shrink-0">Open →</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "sms" && (
        <div className="flex-1 flex flex-col justify-between p-3 space-y-3 overflow-y-auto">
          <div className="space-y-2">
            <button
              onClick={() => void sendSmsCommand("STATUS")}
              className="w-full py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-md inline-flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Missed Call 1800-425-4726
            </button>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {smsLog.map((entry, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-xs ${
                    entry.from.includes("Student")
                      ? "bg-teal-800 text-white ml-6"
                      : "bg-white text-slate-800 border border-slate-200 mr-4"
                  }`}
                >
                  <div className="font-semibold mb-0.5 flex justify-between">
                    <span>{entry.from}</span>
                    {entry.bytes && <span className="font-mono opacity-75">{entry.bytes} B</span>}
                  </div>
                  <p className="font-mono">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendSmsCommand();
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              value={smsCommand}
              onChange={(e) => setSmsCommand(e.target.value)}
              className="flex-1 px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-md"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md"
            >
              SMS
            </button>
          </form>
        </div>
      )}
    </div>
  );

  if (mode === "docked") {
    return <aside className="hidden xl:block w-80 shrink-0 sticky top-20 h-[calc(100vh-6rem)]">{panelContent}</aside>;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end"
      role="dialog"
      aria-label="Live AI Co-Pilot and Step Tracker"
    >
      <div className="w-full max-w-md h-full p-2 sm:p-3">{panelContent}</div>
    </div>
  );
};
