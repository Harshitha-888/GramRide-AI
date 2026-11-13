import React from "react";
import {
  BarChart3,
  Compass,
  Home,
  PhoneCall,
  Shield,
  Users,
  WifiOff,
} from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { LANGUAGE_LABELS, TRANSLATIONS } from "../i18n/translations";
import { Language, PageId } from "../types/mobility";
import { LiveCoPilotPanel } from "./LiveCoPilotPanel";
import { GramRideLogo } from "./GramRideLogo";

type PrimaryTab = "home" | "routes" | "pool" | "forecast" | "safety";

function getPrimaryTab(page: PageId): PrimaryTab {
  if (page === "home") return "home";
  if (page === "planner" || page === "emergency") return "routes";
  if (page === "pool") return "pool";
  if (page === "predictions" || page === "authority") return "forecast";
  return "safety";
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activePage,
    setActivePage,
    language,
    setLanguage,
    lowDataMode,
    setLowDataMode,
    setAssistantOpen,
    sosAlertMessage,
    dismissSosAlert,
    disruptions,
    liveSim,
    districts,
    selectedDistrict,
    selectDistrict,
    scenario,
    poolAllocation,
    reallocateCrisisFleet,
  } = useMobility();

  const currentTab = getPrimaryTab(activePage);
  const hasActiveDisruption = disruptions.some((d) => d.active);
  const t = TRANSLATIONS[language];

  const primaryTabs: Array<{ id: PrimaryTab; page: PageId; label: string; icon: React.ReactNode }> = [
    { id: "home", page: "home", label: t.nav.home, icon: <Home className="w-4 h-4" /> },
    { id: "routes", page: "planner", label: t.nav.routes, icon: <Compass className="w-4 h-4" /> },
    { id: "pool", page: "pool", label: t.nav.pool, icon: <Users className="w-4 h-4" /> },
    { id: "forecast", page: "predictions", label: t.nav.forecast, icon: <BarChart3 className="w-4 h-4" /> },
    { id: "safety", page: "student", label: t.nav.safety, icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`min-h-screen lg:h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-emerald-50/70 text-slate-900 ${
        lowDataMode ? "low-data-mode" : ""
      }`}
    >
      {/* Clean 3-Zone Top Header */}
      <header className="bg-white/95 backdrop-blur border-b border-sky-100 shrink-0 z-30">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => setActivePage("home")}
            className="bg-transparent whitespace-nowrap shrink-0 flex items-center"
            aria-label={t.brandName}
          >
            <GramRideLogo size="sm" brandName={t.brandName} />
          </button>

          {/* Desktop 5-Link Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {primaryTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePage(tab.page)}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? "text-teal-800 font-semibold underline underline-offset-4"
                      : tab.id === "routes" && hasActiveDisruption
                      ? "text-red-700 font-semibold"
                      : "hover:text-teal-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Single Primary Header Action */}
          <button
            onClick={() => setAssistantOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            {t.liveAi} ({liveSim.completedSteps.length}/7)
          </button>
        </div>
      </header>

      {/* Slim Global District + Language + 2G Mode Bar */}
      <div className="bg-white/80 border-b border-sky-100 shrink-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {currentTab !== "home" ? (
              <select
                aria-label="District"
                value={selectedDistrict.id}
                onChange={(e) => selectDistrict(e.target.value)}
                className="px-2 py-1 bg-sky-50 border border-sky-200 rounded-md text-xs font-semibold text-teal-900 truncate max-w-[165px] sm:max-w-none"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold text-teal-900 truncate">
                {t.liveNetwork}
              </span>
            )}
            <span className="hidden sm:inline text-slate-500 font-mono truncate">
              Bus {Math.round(liveSim.busProgressPct)}% · Van {Math.round(liveSim.vanProgressPct)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700"
            >
              {(["en", "kn", "hi"] as Language[]).map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>

            <button
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                lowDataMode
                  ? "bg-teal-800 text-white border-teal-800"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle 2G Low-Data Mode"
            >
              <WifiOff className="w-3 h-3" />
              <span>{lowDataMode ? "2G" : t.lowData}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Exam Day Crisis Strip */}
      {scenario.examCrisisActive && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <span className="font-semibold text-amber-950 truncate">
              Exam Crisis: 2 Buses Down · +40% Surge · Exam &lt;2h ({poolAllocation.examStudentsSecured}/
              {poolAllocation.examPriorityCount} secured)
            </span>
            {!scenario.crisisReallocated ? (
              <button
                onClick={() => {
                  reallocateCrisisFleet();
                  setActivePage("pool");
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shrink-0"
              >
                AI Reallocate
              </button>
            ) : (
              <button
                onClick={() => setActivePage("pool")}
                className="px-2.5 py-1 bg-emerald-700 text-white font-semibold rounded-md shrink-0"
              >
                {poolAllocation.onTimeRatePct}% On-Time
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global SOS Alert */}
      {sosAlertMessage && (
        <div className="bg-red-600 text-white px-3 py-2 text-xs shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="font-medium truncate">{sosAlertMessage}</span>
            <button
              onClick={dismissSosAlert}
              className="px-2.5 py-1 bg-red-800 rounded font-semibold shrink-0"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Single-Page Viewport */}
      <main className="flex-1 min-h-0 max-w-5xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-20 md:pb-4 lg:overflow-y-auto">
        {children}
      </main>

      {/* Mobile App Bottom Tab Navigation (<= 8% viewport height, thumb-friendly 44px+ targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-sky-100 h-14 flex items-center justify-around px-1"
      >
        {primaryTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.page)}
              className={`flex-1 h-11 mx-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                isActive ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <LiveCoPilotPanel mode="drawer" />
    </div>
  );
};
