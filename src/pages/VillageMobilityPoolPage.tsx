import React from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, MapPin, RotateCcw, Sparkles } from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { TRANSLATIONS } from "../i18n/translations";

export const VillageMobilityPoolPage: React.FC = () => {
  const {
    setActivePage,
    selectedDistrict,
    villages,
    scenario,
    updateScenario,
    poolAllocation,
    reallocateCrisisFleet,
    triggerExamDayCrisis,
    resetDemoScenario,
    language,
  } = useMobility();

  const t = TRANSLATIONS[language];

  const ua = poolAllocation.userAssignment;

  return (
    <div className="space-y-2.5">
      {/* Shared College + Demand & Fleet Sliders */}
      <div className="bg-white border border-sky-100 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              {t.nav.pool} · {villages.length} {t.pool.headerSuffix}
            </div>
            <select
              aria-label="Target college"
              value={scenario.institutionName}
              onChange={(e) => updateScenario({ institutionName: e.target.value })}
              className="mt-1 w-full sm:w-auto px-2.5 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-bold text-slate-900"
            >
              {selectedDistrict.destinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => triggerExamDayCrisis()}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1 ${
                poolAllocation.crisisActive
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {poolAllocation.crisisActive ? t.pool.clearCrisis : t.pool.examCrisis}
            </button>
            <button
              onClick={resetDemoScenario}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t.pool.reset}
            </button>
          </div>
        </div>

        {/* Exam Day Crisis Response Banner */}
        {poolAllocation.crisisActive && (
          <div
            className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              poolAllocation.crisisReallocated
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-red-50 border-red-200 text-red-950"
            }`}
          >
            <div>
              <div className="font-bold">
                {poolAllocation.crisisReallocated
                  ? `Crisis Mitigated: ${poolAllocation.onTimeRatePct}% On-Time · Exam <2h (${poolAllocation.examStudentsSecured}/${poolAllocation.examPriorityCount} Secured)`
                  : `Exam Crisis: ${poolAllocation.brokenDownBuses} Buses Down · +${poolAllocation.demandSurgePct}% Surge · Flood Detour`}
              </div>
              <div className="text-[11px] opacity-90">
                Exam candidates (&lt; 2h) are prioritized first across active buses, detour vans, and rural autos.
              </div>
            </div>
            {!poolAllocation.crisisReallocated ? (
              <button
                onClick={reallocateCrisisFleet}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg inline-flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t.routes.aiReallocate}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 shrink-0">
                <CheckCircle2 className="w-4 h-4" /> Reserve Fleet Active
              </span>
            )}
          </div>
        )}

        {/* Active User Request Synced From Routes */}
        {ua && (
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-bold text-emerald-950 truncate">
                {ua.personName}
                {ua.examPriority ? " (Exam < 2h Priority)" : ""}: {ua.fromPlace} → {ua.toCollege}
              </div>
              <div className="text-[11px] text-emerald-800 truncate">{ua.statusNote}</div>
            </div>
            <div className="text-right font-mono shrink-0">
              <div className="font-bold text-teal-900">
                {ua.assignedVehicleLabel} · {ua.fareLabel}
              </div>
              <div className="text-[11px] text-emerald-800">
                Pick {ua.pickupTime} → ETA {ua.estimatedArrival}
              </div>
            </div>
          </div>
        )}

        {scenario.appliedPlanSummary && (
          <div className="px-2.5 py-2 bg-teal-50 border border-teal-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-teal-950">
            <span>
              <strong>AI Forecast Plan Applied ({scenario.appliedPlanSummary.appliedAt}):</strong>{" "}
              {scenario.appliedPlanSummary.totalGovtSeats} Govt Seats (+{scenario.appliedPlanSummary.depotBusesAdded} Depot Bus) ·{" "}
              {scenario.appliedPlanSummary.vansUsed} Vans · {scenario.appliedPlanSummary.autosUsed} Autos · Est. Cost ₹{scenario.appliedPlanSummary.totalDailyCostInr}
            </span>
            <button
              onClick={() => setActivePage("predictions")}
              className="font-semibold underline text-teal-800 shrink-0"
            >
              Adjust Forecast
            </button>
          </div>
        )}

        {scenario.collegeNotified && scenario.collegeNoticeMessage && (
          <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{scenario.collegeNoticeMessage}</span>
          </div>
        )}

        {/* Automatic Distribution Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-100">
          <label className="text-xs text-slate-700 flex flex-col gap-0.5">
            <span className="flex justify-between">
              <span>{poolAllocation.crisisActive ? t.pool.surge : t.pool.students}</span>
              <span className="font-mono font-bold">{poolAllocation.totalDemand}</span>
            </span>
            <input
              type="range"
              min={10}
              max={Math.max(120, scenario.totalStudents)}
              value={scenario.totalStudents}
              onChange={(e) => updateScenario({ totalStudents: Number(e.target.value) })}
              className="w-full accent-teal-700"
            />
          </label>
          <label className="text-xs text-slate-700 flex flex-col gap-0.5">
            <span className="flex justify-between">
              <span>{t.pool.busSeats}</span>
              <span className="font-mono font-bold">{scenario.seatsPerGovtBus}</span>
            </span>
            <input
              type="range"
              min={15}
              max={55}
              value={scenario.seatsPerGovtBus}
              onChange={(e) => updateScenario({ seatsPerGovtBus: Number(e.target.value) })}
              className="w-full accent-teal-700"
            />
          </label>
          <label className="text-xs text-slate-700 flex flex-col gap-0.5">
            <span className="flex justify-between">
              <span>{t.pool.vans}</span>
              <span className="font-mono font-bold">{scenario.backupVansAvailable}</span>
            </span>
            <input
              type="range"
              min={0}
              max={6}
              value={scenario.backupVansAvailable}
              onChange={(e) => updateScenario({ backupVansAvailable: Number(e.target.value) })}
              className="w-full accent-amber-600"
            />
          </label>
          <label className="text-xs text-slate-700 flex flex-col gap-0.5">
            <span className="flex justify-between">
              <span>{t.pool.autos}</span>
              <span className="font-mono font-bold">{scenario.backupAutosAvailable}</span>
            </span>
            <input
              type="range"
              min={0}
              max={6}
              value={scenario.backupAutosAvailable}
              onChange={(e) => updateScenario({ backupAutosAvailable: Number(e.target.value) })}
              className="w-full accent-sky-600"
            />
          </label>
        </div>
      </div>

      {/* Automatic Distribution Split: Exam Priority · Govt Bus · Backup Vans · Rural Autos */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
          <div className="text-[11px] text-amber-900 font-semibold">{t.pool.examLabel}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-950">
            {poolAllocation.examStudentsSecured}/{poolAllocation.examPriorityCount}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
          <div className="text-[11px] text-emerald-800">{t.pool.govtBus}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-900">
            {poolAllocation.govtSeatsAssigned}
          </div>
        </div>
        <div className="bg-white border border-sky-200 rounded-xl p-2">
          <div className="text-[11px] text-teal-800">
            {t.pool.vans.split(" ")[0]} ({poolAllocation.backupVansDispatched})
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-teal-900">
            {poolAllocation.vanSeatsAllocated}
          </div>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-2">
          <div className="text-[11px] text-sky-900">
            {t.pool.autos.split(" ")[0]} ({poolAllocation.backupAutosDispatched})
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-sky-950">
            {poolAllocation.autoSeatsAllocated}
          </div>
        </div>
      </div>

      {poolAllocation.unaccommodatedStudents > 0 && (
        <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center justify-between gap-2">
          <span>
            {poolAllocation.unaccommodatedStudents} non-priority students unassigned (Exam &lt;2h protected first).
          </span>
          {poolAllocation.crisisActive && !poolAllocation.crisisReallocated && (
            <button onClick={reallocateCrisisFleet} className="underline font-bold shrink-0">
              Reallocate Now
            </button>
          )}
        </div>
      )}

      {/* Pickup Locations, Vehicle Assignments & Estimated Arrival Times */}
      <div className="bg-white border border-sky-100 rounded-2xl p-3.5 space-y-2">
        <div className="text-xs font-bold text-slate-900">
          {t.pool.pickupsTitle}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {poolAllocation.pickupClusters.map((c) => (
            <div key={c.pickupId} className="p-2.5 bg-sky-50/50 border border-sky-200 rounded-xl space-y-1">
              <div className="flex items-start justify-between gap-1">
                <div className="font-bold text-slate-900 inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className="font-mono font-bold text-teal-900 shrink-0">
                  {c.totalStudents} std
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">{c.villageName}</div>
              <div className="text-[11px] font-semibold text-slate-800">
                {c.assignedVehicle}
              </div>
              <div className="text-[11px] font-mono text-teal-800 inline-flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 shrink-0" />
                Pick {c.pickupTime} → ETA {c.estimatedArrival}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <button
          onClick={() => setActivePage("planner")}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t.nav.routes}
        </button>
        <button
          onClick={() => setActivePage("predictions")}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
        >
          {t.pool.nextForecast} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
