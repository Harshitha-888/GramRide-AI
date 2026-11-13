import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  BellRing,
  CheckCircle2,
  Layers,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { DemandCapacityChart } from "../components/SvgCharts";
import { computeForecastSolutionPlan } from "../utils/forecastSolver";
import { TRANSLATIONS } from "../i18n/translations";

interface AiBriefingResponse {
  executiveSummary: string;
  criticalVillages: string[];
  redistributionAction: string;
  backupVehiclesNeeded: number;
  safetyNote: string;
}

export const ForecastAuthorityView: React.FC = () => {
  const {
    activePage,
    setActivePage,
    selectedDistrict,
    villages,
    buses,
    providers,
    disruptions,
    scenario,
    poolAllocation,
    reallocateCrisisFleet,
    redistributeBusToCorridor,
    toggleBusStatus,
    toggleProviderAvailability,
    toggleDisruption,
    applyForecastSolutionToPool,
    notifyCollegeShortage,
    language,
  } = useMobility();

  const t = TRANSLATIONS[language];

  const tab: "predictions" | "authority" =
    activePage === "authority" ? "authority" : "predictions";

  const [horizon, setHorizon] = useState<"tomorrow" | "market" | "exam" | "crisis">(
    scenario.examCrisisActive ? "crisis" : "tomorrow"
  );
  const [demandDelta, setDemandDelta] = useState<number>(0);
  const [briefing, setBriefing] = useState<AiBriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [poolAppliedStamp, setPoolAppliedStamp] = useState<string | null>(null);
  const [redistributed, setRedistributed] = useState(false);

  const multiplier =
    horizon === "crisis" ? 1.4 : horizon === "exam" ? 1.28 : horizon === "market" ? 1.15 : 1;

  // Automatically recalculates whenever demand (horizon/demandDelta) or vehicle availability (buses/providers/disruption) changes
  const solutionPlan = useMemo(
    () =>
      computeForecastSolutionPlan({
        districtName: selectedDistrict.name,
        villages,
        buses,
        providers,
        horizon,
        disruptionActive: scenario.disruptionActive,
        demandOverrideDelta: demandDelta,
      }),
    [selectedDistrict.name, villages, buses, providers, horizon, scenario.disruptionActive, demandDelta]
  );

  const totalOccupied = buses.reduce((acc, b) => acc + b.occupiedSeats, 0);
  const occupancyPct =
    solutionPlan.confirmedGovtSeats > 0
      ? Math.round((totalOccupied / solutionPlan.confirmedGovtSeats) * 100)
      : 0;

  const generateAiSolution = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horizon,
          language,
          plan: solutionPlan,
          villages: solutionPlan.villagePlans.map((vp) => ({
            name: vp.villageName,
            predictedDemand: vp.predictedDemand,
            confirmedBusSeats: vp.confirmedBusSeats,
            shortageBefore: vp.shortageBefore,
            examStudents: vp.examStudents,
          })),
          buses: buses.map((b) => ({
            route: b.routeNumber,
            origin: b.originName,
            totalSeats: b.totalSeats,
            status: b.status,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.briefing?.executiveSummary) {
        setBriefing(data.briefing as AiBriefingResponse);
      } else {
        setBriefing({
          executiveSummary: `${solutionPlan.totalPredictedDemand} predicted demand vs ${solutionPlan.confirmedGovtSeats} confirmed govt seats (${solutionPlan.shortageBefore} initial shortage). Recommending +${solutionPlan.additionalDepotBusesRecommended} depot bus, ${solutionPlan.totalVansUsed} backup vans & ${solutionPlan.totalAutosUsed} rural autos to accommodate ${solutionPlan.totalAccommodatedAfter}/${solutionPlan.totalPredictedDemand} students (${solutionPlan.shortageReductionPct}% shortage reduction).`,
          criticalVillages: solutionPlan.villagePlans
            .filter((vp) => vp.shortageBefore > 0)
            .map((vp) => vp.villageName),
          redistributionAction: `Prioritize ${solutionPlan.examStudentsAccommodated}/${solutionPlan.examStudentsTotal} exam candidates; dispatch depot bus & verified shuttles along optimized village pickups (${solutionPlan.estimatedArrivalWindow}).`,
          backupVehiclesNeeded: solutionPlan.totalVansUsed + solutionPlan.totalAutosUsed,
          safetyNote: "Police-verified vehicles only; Guardian PIN remains mandatory for minors.",
        });
      }
    } catch {
      setBriefing({
        executiveSummary: `Solver Solution: ${solutionPlan.totalAccommodatedAfter}/${solutionPlan.totalPredictedDemand} accommodated (+${solutionPlan.additionalDepotBusesRecommended} depot bus, ${solutionPlan.totalVansUsed} vans, ${solutionPlan.totalAutosUsed} autos · Est. ₹${solutionPlan.totalDailyCostInr}/day).`,
        criticalVillages: solutionPlan.villagePlans
          .filter((vp) => vp.shortageBefore > 0)
          .map((vp) => vp.villageName),
        redistributionAction: "Exam candidates prioritized first across active bus & backup shuttles.",
        backupVehiclesNeeded: solutionPlan.totalVansUsed + solutionPlan.totalAutosUsed,
        safetyNote: "Guardian PIN & verified drivers active.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToPool = () => {
    applyForecastSolutionToPool(solutionPlan);
    setPoolAppliedStamp(
      `${solutionPlan.totalAccommodatedAfter}/${solutionPlan.totalPredictedDemand} synced (${solutionPlan.totalVansUsed}V, ${solutionPlan.totalAutosUsed}A)`
    );
  };

  const handleNotifyCollege = () => {
    notifyCollegeShortage(solutionPlan);
  };

  const handleRedistribute = () => {
    if (scenario.examCrisisActive) {
      reallocateCrisisFleet();
      setRedistributed(true);
      return;
    }
    const spareBus = buses[buses.length - 1];
    const topShortageVillage =
      villages.find((v) => v.id === solutionPlan.villagePlans[0]?.villageId) ?? villages[0];
    if (spareBus && topShortageVillage) {
      redistributeBusToCorridor(spareBus.id, topShortageVillage.id);
      setRedistributed(true);
    }
  };

  const shortageVillages = solutionPlan.villagePlans.filter((vp) => vp.shortageBefore > 0);
  const firstVerifiedVan = providers.find(
    (p) => p.policeVerified && p.vehicleType !== "Verified Rural Auto"
  );

  return (
    <div className="space-y-2">
      {/* Top Bar: Sub-Tabs + Scenario Horizon */}
      <div className="bg-white border border-sky-100 rounded-xl px-2.5 py-2 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 p-0.5 bg-sky-50 rounded-lg border border-sky-200">
          <button
            onClick={() => setActivePage("predictions")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              tab === "predictions" ? "bg-teal-700 text-white" : "text-slate-700"
            }`}
          >
            {t.forecast.aiForecast}
          </button>
          <button
            onClick={() => setActivePage("authority")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              tab === "authority" ? "bg-teal-700 text-white" : "text-slate-700"
            }`}
          >
            {t.forecast.busRedist}
          </button>
        </div>

        {tab === "predictions" ? (
          <div className="flex flex-wrap items-center gap-1">
            {(["tomorrow", "market", "exam", "crisis"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                  horizon === h
                    ? h === "crisis"
                      ? "bg-amber-50 text-amber-950 border-amber-300 font-semibold"
                      : "bg-teal-50 text-teal-900 border-teal-300 font-semibold"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {h === "tomorrow"
                  ? t.forecast.tomorrow
                  : h === "market"
                  ? t.forecast.market
                  : h === "exam"
                  ? t.forecast.exam
                  : t.forecast.crisis}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-teal-800 font-semibold">
            Occupancy {occupancyPct}% · {providers.filter((p) => p.policeVerified).length} Verified Partners
          </span>
        )}
      </div>

      {tab === "predictions" ? (
        <>
          {/* Compact Controls + Predicted vs Confirmed + Action Buttons */}
          <div className="bg-white border border-sky-100 rounded-xl p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-bold text-slate-900">{t.forecast.demandAdj}</span>
                <div className="inline-flex items-center border border-slate-200 rounded-md bg-slate-50">
                  <button
                    aria-label="Decrease demand per village"
                    onClick={() => setDemandDelta((d) => Math.max(-20, d - 5))}
                    className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-200 rounded-l-md"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-900">
                    {demandDelta >= 0 ? `+${demandDelta}` : demandDelta}
                  </span>
                  <button
                    aria-label="Increase demand per village"
                    onClick={() => setDemandDelta((d) => Math.min(40, d + 5))}
                    className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-200 rounded-r-md"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                {buses[0] && (
                  <button
                    onClick={() => toggleBusStatus(buses[0].id)}
                    className={`px-2 py-0.5 rounded-md border font-semibold ${
                      buses[0].status === "Cancelled"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    {buses[0].routeNumber}: {buses[0].status === "Cancelled" ? "Down" : "Active"}
                  </button>
                )}
                {firstVerifiedVan && (
                  <button
                    onClick={() => toggleProviderAvailability(firstVerifiedVan.id)}
                    className={`px-2 py-0.5 rounded-md border font-semibold ${
                      firstVerifiedVan.available
                        ? "bg-sky-50 border-sky-200 text-teal-900"
                        : "bg-slate-100 border-slate-300 text-slate-600"
                    }`}
                  >
                    Van {firstVerifiedVan.registration}:{" "}
                    {firstVerifiedVan.available ? "On" : "Off"}
                  </button>
                )}
                {disruptions[0] && (
                  <button
                    onClick={() => toggleDisruption(disruptions[0].id)}
                    className={`px-2 py-0.5 rounded-md border font-semibold ${
                      scenario.disruptionActive
                        ? "bg-amber-50 border-amber-300 text-amber-950"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {scenario.disruptionActive ? "Detour On" : "Clear Road"}
                  </button>
                )}
              </div>
            </div>

            {/* Compact Predicted vs Confirmed 4-Tile Strip */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="px-2 py-1.5 bg-sky-50/80 border border-sky-200 rounded-lg">
                <div className="text-[10px] font-semibold text-sky-900 truncate">{t.forecast.predicted}</div>
                <div className="text-sm font-bold font-mono text-slate-900">
                  {solutionPlan.totalPredictedDemand}
                </div>
              </div>

              <div className="px-2 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <div className="text-[10px] font-semibold text-emerald-900 truncate">{t.forecast.confBus}</div>
                <div className="text-sm font-bold font-mono text-emerald-950">
                  {solutionPlan.confirmedGovtSeats}
                </div>
              </div>

              <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-700 truncate">{t.forecast.confFleet}</div>
                <div className="text-sm font-bold font-mono text-slate-900">
                  {solutionPlan.confirmedBackupVans}V·{solutionPlan.confirmedBackupAutos}A
                </div>
              </div>

              <div className="px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-[10px] font-semibold text-amber-900 truncate">{t.forecast.shortage}</div>
                <div className="text-sm font-bold font-mono text-amber-950">
                  {solutionPlan.shortageBefore}
                </div>
              </div>
            </div>

            {/* Compact Interactive Actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => void generateAiSolution()}
                disabled={loading}
                className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold rounded-lg inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {loading ? t.forecast.solving : t.forecast.generateAi}
              </button>

              <button
                onClick={handleApplyToPool}
                className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-semibold rounded-lg inline-flex items-center gap-1"
              >
                <Layers className="w-3 h-3" /> {t.forecast.applyToPool}
              </button>

              <button
                onClick={handleNotifyCollege}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg inline-flex items-center gap-1 border ${
                  scenario.collegeNotified
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950"
                }`}
              >
                <BellRing className="w-3 h-3" />
                {scenario.collegeNotified ? t.forecast.notified : t.forecast.notifyCollege}
              </button>

              {poolAppliedStamp && (
                <button
                  onClick={() => setActivePage("pool")}
                  className="ml-auto text-[11px] font-semibold text-teal-800 underline inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> {t.forecast.openPool}
                </button>
              )}
            </div>

            {scenario.collegeNotified && scenario.collegeNoticeMessage && (
              <div className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-950 truncate">
                {scenario.collegeNoticeMessage}
              </div>
            )}

            {briefing && (
              <div className="px-2 py-1 bg-teal-50 border border-teal-200 rounded-lg text-[10px] text-teal-950 line-clamp-2">
                <span className="font-bold">AI:</span> {briefing.executiveSummary}
              </div>
            )}
          </div>

          {/* Visual Capacity vs Predicted Demand Chart */}
          <div className="bg-white border border-sky-100 rounded-xl p-2.5">
            <DemandCapacityChart
              villages={villages}
              buses={buses}
              multiplier={multiplier}
              demandDelta={demandDelta}
              compact
            />
          </div>

          {/* Bottom Compact AI Solution Only */}
          <div className="bg-white border border-sky-100 rounded-xl p-2.5 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <span className="font-bold text-slate-900">{t.forecast.aiSolution}</span>
              <span className="font-mono font-bold text-teal-900">
                +{solutionPlan.additionalDepotBusesRecommended} Bus · {solutionPlan.totalVansUsed}V ·{" "}
                {solutionPlan.totalAutosUsed}A · Exam {solutionPlan.examStudentsAccommodated}/
                {solutionPlan.examStudentsTotal} · ETA {solutionPlan.estimatedArrivalWindow.split(" ")[0]} · ₹
                {solutionPlan.totalDailyCostInr}
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {solutionPlan.shortageBefore}→{solutionPlan.shortageAfter} short (
                {solutionPlan.totalAccommodatedAfter}/{solutionPlan.totalPredictedDemand})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {solutionPlan.villagePlans.map((vp) => (
                <div
                  key={vp.villageId}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-1"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{vp.villageName}</div>
                    <div className="font-medium text-teal-900 truncate">
                      {vp.depotBusesAdded > 0 || vp.vansAssigned > 0 || vp.autosAssigned > 0
                        ? [
                            vp.depotBusesAdded > 0 ? `+${vp.depotBusesAdded}B` : "",
                            vp.vansAssigned > 0 ? `${vp.vansAssigned}V` : "",
                            vp.autosAssigned > 0 ? `${vp.autosAssigned}A` : "",
                          ]
                            .filter(Boolean)
                            .join("·")
                        : "Bus OK"}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-800 shrink-0">
                    {vp.shortageBefore}→{vp.shortageAfter}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-sky-100 rounded-2xl p-4 space-y-3">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs">
              <div className="font-bold text-slate-900">
                {scenario.examCrisisActive
                  ? `Exam Crisis Reallocation (${poolAllocation.examStudentsSecured}/${poolAllocation.examPriorityCount} <2h exam students secured)`
                  : `AI Action: Shift under-used bus to ${solutionPlan.villagePlans[0]?.villageName ?? villages[0]?.name}`}
              </div>
              <div className="text-slate-600">
                {scenario.examCrisisActive
                  ? "Deploy reserve bus + detour vans & prioritize <2h exam candidates."
                  : `Covers ${solutionPlan.shortageBefore} predicted shortage seats across ${shortageVillages.length} routes.`}
              </div>
            </div>
            <button
              onClick={handleRedistribute}
              disabled={redistributed || Boolean(scenario.crisisReallocated)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1 ${
                redistributed || scenario.crisisReallocated
                  ? "bg-emerald-700 text-white"
                  : "bg-teal-700 hover:bg-teal-800 text-white"
              }`}
            >
              {redistributed || scenario.crisisReallocated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reallocated
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />{" "}
                  {scenario.examCrisisActive ? "AI Crisis Reallocate" : "Shift Bus"}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {buses.map((b) => (
              <div
                key={b.id}
                className={`p-2.5 border rounded-xl flex items-center justify-between gap-2 ${
                  b.status === "Cancelled"
                    ? "bg-red-50 border-red-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {b.routeNumber} {b.status === "Cancelled" ? "· Breakdown" : ""}
                  </div>
                  <div className="text-slate-500">
                    {b.originName} · {b.status === "Cancelled" ? "0 seats" : `${b.occupiedSeats}/${b.totalSeats}`}
                  </div>
                </div>
                <button
                  onClick={() => toggleBusStatus(b.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold border text-[11px] inline-flex items-center gap-1 ${
                    b.status === "Cancelled"
                      ? "bg-white border-red-300 text-red-800"
                      : "bg-white border-slate-300 text-slate-700"
                  }`}
                >
                  {b.status === "Cancelled" ? (
                    <>
                      <AlertTriangle className="w-3 h-3" /> Restore
                    </>
                  ) : (
                    "Simulate Down"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActivePage("pool")}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> {t.nav.pool}
          </button>
          <button
            onClick={() => setActivePage("planner")}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            {t.nav.routes}
          </button>
        </div>
        <button
          onClick={() => setActivePage("student")}
          className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold rounded-lg inline-flex items-center gap-1"
        >
          {t.forecast.nextSafety} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
