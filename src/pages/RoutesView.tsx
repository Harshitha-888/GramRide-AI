import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { RouteMap } from "../components/RouteMap";
import { TransportModeKey } from "../types/mobility";
import { TRANSLATIONS } from "../i18n/translations";

function VehicleSymbol({ mode }: { mode: TransportModeKey }) {
  if (mode === "govt_bus") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
      </svg>
    );
  }
  if (mode === "pool_van") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/>
        <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15h14l2-4-3-5H7L4 11v4Z"/><path d="M9 6v5"/><path d="M14 6v5"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  );
}

export const RoutesView: React.FC<{ initialTab?: "planner" | "emergency" }> = ({
  initialTab = "planner",
}) => {
  const {
    activePage,
    setActivePage,
    selectedDistrict,
    villages,
    buses,
    disruptions,
    toggleDisruption,
    scenario,
    poolAllocation,
    triggerExamDayCrisis,
    reallocateCrisisFleet,
    personTrips,
    addPersonTrip,
    updatePersonTrip,
    getTransportPossibilities,
    language,
    liveSim,
    destinationArrival,
    simulateReachDestination,
    dismissDestinationArrival,
    startNewRide,
  } = useMobility();

  const tab: "planner" | "emergency" =
    activePage === "emergency" ? "emergency" : activePage === "planner" ? "planner" : initialTab;

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activePerson = personTrips[0];
  const possibilities = getTransportPossibilities(activePerson);
  const primaryDisruption = disruptions[0];
  const activeOption =
    possibilities.find((p) => p.mode === activePerson.selectedMode) ?? possibilities[0];
  const activeRidePct =
    activePerson.selectedMode === "govt_bus"
      ? liveSim.busProgressPct
      : activePerson.selectedMode === "pool_van"
      ? liveSim.vanProgressPct
      : liveSim.autoProgressPct;

  // Build district-specific From options (all clusters + individual pickup stops + custom address)
  const districtFromOptions = villages.flatMap((v) => [
    { value: v.id, label: `${v.name} (${v.taluk})` },
    ...v.pickupPoints.map((pp) => ({
      value: pp.id,
      label: `${pp.name} — ${pp.landmark}`,
    })),
  ]);

  const askAi = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/plan-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          requestDetails: {
            district: selectedDistrict.name,
            person: activePerson.personName,
            gender: activePerson.gender ?? "female",
            from:
              activePerson.originVillageId === "custom"
                ? activePerson.customFromAddress
                : activePerson.originVillageId,
            destination: activePerson.destination,
          },
          availableOptions: possibilities,
        }),
      });
      const data = await res.json();
      setAiAdvice(res.ok ? data.recommendation : "Use recommended route shown below.");
    } catch {
      setAiAdvice("Offline plan ready below.");
    } finally {
      setLoading(false);
    }
  };

  const isFemale = (activePerson.gender ?? "female") === "female";
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-2.5">
      {/* Segmented Switch + Controls */}
      <div className="bg-white border border-sky-100 rounded-2xl p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-sky-50 rounded-lg border border-sky-200">
            <button
              onClick={() => setActivePage("planner")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                tab === "planner" ? "bg-teal-700 text-white" : "text-slate-700"
              }`}
            >
              {t.routes.routeOptions}
            </button>
            <button
              onClick={() => setActivePage("emergency")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                tab === "emergency" ? "bg-red-600 text-white" : "text-slate-700"
              }`}
            >
              {t.routes.emergencyDetour}
            </button>
          </div>

          {tab === "planner" ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => addPersonTrip()}
                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-teal-900 border border-sky-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t.routes.person}
              </button>
              <button
                onClick={() => void askAi()}
                disabled={loading}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> {loading ? t.routes.thinking : t.routes.aiCompare}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => triggerExamDayCrisis()}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1 ${
                  scenario.examCrisisActive
                    ? "bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {scenario.examCrisisActive ? t.routes.clearCrisis : t.routes.simulateCrisis}
              </button>
              {scenario.examCrisisActive && !scenario.crisisReallocated && (
                <button
                  onClick={reallocateCrisisFleet}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {t.routes.aiReallocate}
                </button>
              )}
              {!scenario.examCrisisActive && (
                <button
                  onClick={() => toggleDisruption(primaryDisruption.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1 ${
                    primaryDisruption.active
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  {primaryDisruption.active ? t.routes.restoreRoad : t.routes.floodDetour}
                </button>
              )}
            </div>
          )}
        </div>

        {tab === "planner" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Direct Traveler Name Input */}
              <div className="flex items-center gap-1">
                <input
                  aria-label="Enter traveler name"
                  type="text"
                  value={activePerson.personName}
                  onChange={(e) =>
                    updatePersonTrip(activePerson.id, { personName: e.target.value })
                  }
                  placeholder={t.routes.enterName}
                  className="flex-1 min-w-0 px-2.5 py-2 text-xs border border-sky-200 rounded-lg bg-white font-semibold text-slate-900"
                />
              </div>

              {/* District-Specific From Place Selector + Custom Address */}
              <div className="space-y-1">
                <select
                  aria-label="Origin"
                  value={activePerson.originVillageId}
                  onChange={(e) =>
                    updatePersonTrip(activePerson.id, { originVillageId: e.target.value })
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                >
                  {districtFromOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t.routes.fromPrefix}: {opt.label}
                    </option>
                  ))}
                  <option value="custom">{t.routes.fromPrefix}: {t.routes.customAddress}</option>
                </select>
                {activePerson.originVillageId === "custom" && (
                  <input
                    aria-label="Enter custom from address"
                    type="text"
                    value={activePerson.customFromAddress ?? ""}
                    onChange={(e) =>
                      updatePersonTrip(activePerson.id, { customFromAddress: e.target.value })
                    }
                    placeholder={`Type village / street in ${selectedDistrict.name.replace(" District", "")}`}
                    className="w-full px-2.5 py-1.5 text-xs border border-teal-300 rounded-lg bg-sky-50/50"
                  />
                )}
              </div>

              {/* Expanded District-Specific Destination Places */}
              <select
                aria-label="Destination"
                value={activePerson.destination}
                onChange={(e) =>
                  updatePersonTrip(activePerson.id, { destination: e.target.value })
                }
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
              >
                {selectedDistrict.destinations.map((d) => (
                  <option key={d} value={d}>
                    {t.routes.toPrefix}: {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Custom From Address input + Aadhaar/Bus Pass + Exam <2h Priority */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updatePersonTrip(activePerson.id, { gender: "female", hasBusPass: false })
                  }
                  className={`px-2 py-1 rounded-md font-semibold border ${
                    isFemale
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {t.routes.womanFree}
                </button>
                <button
                  type="button"
                  onClick={() => updatePersonTrip(activePerson.id, { gender: "male" })}
                  className={`px-2 py-1 rounded-md font-semibold border ${
                    !isFemale
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {t.routes.manPay}
                </button>
                {!isFemale && (
                  <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 border border-sky-200 text-teal-900 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(activePerson.hasBusPass)}
                      onChange={(e) =>
                        updatePersonTrip(activePerson.id, { hasBusPass: e.target.checked })
                      }
                      className="accent-teal-700"
                    />
                    {t.routes.govtPass}
                  </label>
                )}
                <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-950 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(activePerson.examCandidate)}
                    onChange={(e) =>
                      updatePersonTrip(activePerson.id, {
                        examCandidate: e.target.checked,
                        examInMins: e.target.checked ? 85 : undefined,
                      })
                    }
                    className="accent-amber-600"
                  />
                  {t.routes.examPriority}
                </label>
              </div>

              {activePerson.originVillageId !== "custom" && (
                <button
                  type="button"
                  onClick={() =>
                    updatePersonTrip(activePerson.id, {
                      originVillageId: "custom",
                      customFromAddress: activePerson.customFromAddress ?? "",
                    })
                  }
                  className="text-[11px] font-semibold text-teal-800 hover:underline"
                >
                  {t.routes.customFrom}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="text-slate-700 bg-sky-50/60 border border-sky-200 rounded-lg p-2.5">
              {scenario.examCrisisActive ? (
                <span>
                  <strong>Exam Day Crisis:</strong> 2 buses down · +{poolAllocation.demandSurgePct}% demand ({poolAllocation.totalDemand} std) · Flood detour active ·{" "}
                  <strong>
                    Exam &lt;2h: {poolAllocation.examStudentsSecured}/{poolAllocation.examPriorityCount} secured
                  </strong>{" "}
                  ({poolAllocation.onTimeRatePct}% on-time).
                </span>
              ) : primaryDisruption.active ? (
                `Flood detour active (+${primaryDisruption.detourEtaDelayMins}m). Safe Pickup: ${primaryDisruption.alternatePickupName}.`
              ) : (
                "All corridors clear. Tap 'Simulate Exam Crisis' to test 2 bus breakdowns, +40% surge, flood blockage, and <2h exam priority."
              )}
            </div>
          </div>
        )}
      </div>

      {aiAdvice && tab === "planner" && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
          {aiAdvice}
        </div>
      )}

      {/* Attractive Map + 3 Transport Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7 space-y-2">
          <RouteMap
            villages={villages}
            buses={buses}
            disruption={primaryDisruption}
            focusVillageId={activePerson.originVillageId}
            activeMode={activePerson.selectedMode}
            customFromLabel={
              activePerson.originVillageId === "custom" ? activePerson.customFromAddress : undefined
            }
            activeVehicleLabel={activeOption?.vehicleLabel}
            onSimulateArrival={simulateReachDestination}
            onStartNewRide={startNewRide}
            reachDestLabel={t.routes.reachDestBtn}
            rideEndedLabel={t.routes.rideEnded}
            startNewRideLabel={t.routes.startNewRide}
            heightClass="h-[210px] sm:h-[240px]"
          />

          {/* Compact Live Bus & Currently Traveling Vehicle Status */}
          <div className="bg-white border border-sky-100 rounded-xl p-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 truncate">
                {t.routes.yourRide}: <span className="text-teal-800">{activeOption?.vehicleLabel}</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 shrink-0">
                {liveSim.rideEnded || activeRidePct >= 100
                  ? `${t.routes.rideEnded} · 100%`
                  : `${Math.round(activeRidePct)}% · ${t.routes.enRoute}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  liveSim.rideEnded ? "bg-teal-700" : "bg-emerald-600"
                }`}
                style={{ width: `${liveSim.rideEnded ? 100 : Math.min(100, Math.round(activeRidePct))}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600">
              <span className="truncate">
                {t.routes.liveTracking}:{" "}
                {buses.map((b, idx) => {
                  const pct = idx === 0 ? liveSim.busProgressPct : (liveSim.busProgressPct + idx * 24) % 100;
                  return `${b.routeNumber} (${b.status === "Cancelled" ? "Down" : `${Math.round(pct)}%`})`;
                }).join(" · ")}
              </span>
              {liveSim.rideEnded ? (
                <button
                  type="button"
                  onClick={startNewRide}
                  className="px-2 py-0.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-[10px] font-semibold shrink-0"
                >
                  {t.routes.startNewRide}
                </button>
              ) : (
                <span className="font-mono text-teal-800 shrink-0">
                  Van {Math.round(liveSim.vanProgressPct)}% · Auto {Math.round(liveSim.autoProgressPct)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 space-y-2">
          {possibilities.map((opt) => {
            const selected = activePerson.selectedMode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => updatePersonTrip(activePerson.id, { selectedMode: opt.mode })}
                className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                  selected
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-white text-slate-900 border-slate-200 hover:border-teal-500"
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold gap-2">
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <VehicleSymbol mode={opt.mode} />
                    {opt.mode === "govt_bus"
                      ? t.routes.govtBus
                      : opt.mode === "pool_van"
                      ? t.routes.poolVan
                      : t.routes.ruralAuto}
                  </span>
                  <span className="font-mono shrink-0">{opt.fareLabel}</span>
                </div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    selected ? "text-teal-100" : "text-slate-600"
                  }`}
                >
                  {opt.vehicleLabel} · {opt.availabilityLabel}
                </div>
                {opt.fareRuleBadge && (
                  <div
                    className={`text-[10px] font-semibold mt-1 ${
                      selected ? "text-emerald-100" : "text-teal-800"
                    }`}
                  >
                    {opt.fareRuleBadge}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smooth Flow Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setActivePage("home")}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t.nav.home}
        </button>
        <button
          onClick={() => setActivePage("pool")}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
        >
          {t.routes.nextPool} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reached Destination Popup Modal */}
      {destinationArrival && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reached-dest-title"
          className="fixed inset-0 z-[1000] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-emerald-200 rounded-2xl shadow-xl max-w-sm w-full p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 id="reached-dest-title" className="text-base font-extrabold text-[#0F2942]">
                {t.routes.reachedTitle}
              </h3>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{destinationArrival.personName}</span> —{" "}
                {t.routes.reachedSubtitle}
              </p>
              <div className="inline-flex items-center justify-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{destinationArrival.destination}</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              {destinationArrival.vehicleLabel} · {destinationArrival.distanceKm} km · {destinationArrival.fareLabel} · {destinationArrival.arrivedAt}
            </div>
            <div className="text-[11px] font-semibold text-emerald-800">
              {t.routes.rideEnded}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={dismissDestinationArrival}
                className="flex-1 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl"
              >
                {t.routes.okDismiss}
              </button>
              <button
                type="button"
                onClick={startNewRide}
                className="flex-1 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-teal-900 text-xs font-semibold rounded-xl"
              >
                {t.routes.startNewRide}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
