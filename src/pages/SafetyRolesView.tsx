import React, { useState } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  Bell,
  CheckCircle2,
  CloudRain,
  Download,
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  Navigation,
  Phone,
  QrCode,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { VERIFIED_DRIVER_AVATAR } from "../data/initialMobilityData";
import { RouteMap } from "../components/RouteMap";
import { QrCodeMatrix } from "../components/QrCodeMatrix";
import { TRANSLATIONS } from "../i18n/translations";

type SafetyTabSection = "women" | "gps" | "qr" | "hazards";

export const SafetyRolesView: React.FC = () => {
  const {
    activePage,
    setActivePage,
    providers,
    buses,
    villages,
    disruptions,
    guardianRequests,
    approveGuardianRequest,
    toggleProviderAvailability,
    verifyProviderDriver,
    boardingPin,
    confirmStudentBoarding,
    personTrips,
    poolAllocation,
    scenario,
    liveSim,
    resetDemoScenario,
    lowDataMode,
    guardianTrackingConsent,
    toggleGuardianTrackingConsent,
    emergencyAlert,
    triggerSafetySos,
    acknowledgeSafetySos,
    clearSafetySos,
    qrPass,
    scanStudentQr,
    roadHazards,
    toggleRoadHazard,
    aiHazardAdvice,
    runAiHazardScan,
    womenSafety,
    toggleWomenVerifiedPriority,
    toggleWomenTripShare,
    requestWomenJourneyAssistance,
    guardianNotifications,
    assignedSafetyDriver,
    language,
  } = useMobility();

  const t = TRANSLATIONS[language];

  const tab: "student" | "parent" | "provider" | "admin" =
    activePage === "parent"
      ? "parent"
      : activePage === "provider"
      ? "provider"
      : activePage === "admin"
      ? "admin"
      : "student";

  const [safetyView, setSafetyView] = useState<SafetyTabSection>("women");
  const [pinInput, setPinInput] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const [scanVehicleSelect, setScanVehicleSelect] = useState<string>("");

  const activeStudent = personTrips[0];
  const studentLabel = activeStudent?.personName || "Kavya N.";
  const activeHazardsCount = roadHazards.filter((h) => h.status !== "Cleared").length;
  const effectiveScanVehicle = scanVehicleSelect || qrPass.vehicleReg;

  const handlePin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = confirmStudentBoarding(pinInput);
    setPinMsg(ok ? "Boarding verified." : `Demo PIN: ${boardingPin}`);
  };

  const exportCsv = () => {
    const rows = [
      "Village,DailyDemand,ShortageRisk",
      ...villages.map((v) => `"${v.name}",${v.dailyStudentDemand},"${v.shortageRisk}"`),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gramride_safety.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      {/* Compact Role Switcher + One-Tap SOS */}
      <div className="bg-white border border-sky-100 rounded-xl p-2 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 flex-1 min-w-[210px]">
          {[
            { id: "student", label: t.safety.student },
            { id: "parent", label: t.safety.guardian },
            { id: "provider", label: t.safety.driver },
            { id: "admin", label: t.safety.admin },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as "student" | "parent" | "provider" | "admin")}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === item.id ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-sky-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="tel:181"
            className="px-2 py-1.5 bg-sky-50 border border-sky-200 text-teal-900 text-[11px] font-semibold rounded-lg inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3" /> 181
          </a>
          <button
            onClick={() => triggerSafetySos(qrPass.pickupStop)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1"
          >
            <AlertOctagon className="w-3.5 h-3.5" /> {t.safety.sos}
          </button>
        </div>
      </div>

      {/* Compact Active SOS Banner (only when triggered) */}
      {emergencyAlert && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-2.5 text-[11px] space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="font-bold text-red-950 inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
              {emergencyAlert.status}: {emergencyAlert.studentName} · {emergencyAlert.vehicleReg}
            </span>
            <div className="flex items-center gap-1">
              {emergencyAlert.status === "Alert Sent (Simulated)" && (
                <button
                  onClick={acknowledgeSafetySos}
                  className="px-2 py-0.5 bg-amber-600 text-white font-semibold rounded"
                >
                  Acknowledge
                </button>
              )}
              <button
                onClick={clearSafetySos}
                className="px-2 py-0.5 bg-white border border-red-300 text-red-900 font-semibold rounded"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="text-red-900 truncate">
            {emergencyAlert.locationName} ({emergencyAlert.coords.lat.toFixed(3)},{" "}
            {emergencyAlert.coords.lng.toFixed(3)}) · Driver: {emergencyAlert.driverName} · Notified:{" "}
            {emergencyAlert.notifiedContacts.join(", ")}
          </div>
        </div>
      )}

      {/* STUDENT ONE-PAGE SAFETY VIEW */}
      {tab === "student" && (
        <div className="bg-white border border-sky-100 rounded-xl p-3 space-y-2.5">
          {/* Single-Line Live Status + 4 Feature Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-800 truncate">
              {studentLabel} · <span className="font-mono text-teal-800">{qrPass.vehicleReg}</span> ·{" "}
              <span className="text-emerald-800">{qrPass.boardingStatus}</span>
            </span>
            <span className="font-mono text-amber-800 font-semibold">
              {activeHazardsCount} {t.safety.hazardAlertsCount}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[11px]">
            {[
              { id: "women", label: t.safety.womenSafe, icon: <ShieldCheck className="w-3 h-3" /> },
              { id: "gps", label: t.safety.liveGps, icon: <Navigation className="w-3 h-3" /> },
              { id: "qr", label: t.safety.qrPass, icon: <QrCode className="w-3 h-3" /> },
              { id: "hazards", label: t.safety.hazards, icon: <CloudRain className="w-3 h-3" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSafetyView(item.id as SafetyTabSection)}
                className={`py-1.5 px-1.5 rounded-lg font-semibold border inline-flex items-center justify-center gap-1 ${
                  safetyView === item.id
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-sky-50/60 text-slate-700 border-sky-200"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 1. WOMEN STUDENT SAFETY */}
          {safetyView === "women" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-teal-950">
                  {t.safety.womenHeader}
                </span>
                <button
                  onClick={toggleWomenVerifiedPriority}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                    womenSafety.prioritizeVerifiedOnly
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  {womenSafety.prioritizeVerifiedOnly ? t.safety.verifiedOnlyOn : t.safety.standard}
                </button>
              </div>

              <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {!lowDataMode && (
                    <img
                      src={assignedSafetyDriver.photoUrl ?? VERIFIED_DRIVER_AVATAR}
                      alt={assignedSafetyDriver.driverName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-teal-300 shrink-0"
                    />
                  )}
                  <div className="text-xs min-w-0">
                    <div className="font-bold text-slate-900 inline-flex items-center gap-1 truncate">
                      {assignedSafetyDriver.driverName}
                      {assignedSafetyDriver.policeVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-teal-900 font-semibold truncate">
                      {assignedSafetyDriver.vehicleReg} · {assignedSafetyDriver.vehicleType}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate">
                      {assignedSafetyDriver.safetyScore} · {assignedSafetyDriver.phoneMasked}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      window.speechSynthesis.speak(
                        new SpeechSynthesisUtterance(
                          `Verified ride: ${assignedSafetyDriver.driverName}, ${assignedSafetyDriver.vehicleReg}.`
                        )
                      );
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white border border-sky-200 text-teal-900 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" /> {t.safety.voice}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={toggleWomenTripShare}
                  className={`py-2 px-2.5 rounded-xl font-semibold border text-left ${
                    womenSafety.guardianShareConsent
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="text-[11px] font-bold">
                    {womenSafety.guardianShareConsent ? t.safety.tripShared : t.safety.shareTrip}
                  </div>
                  <div className="text-[10px] opacity-80 truncate">
                    {womenSafety.trustedGuardianName} · {womenSafety.sharedTripLinkId}
                  </div>
                </button>

                <button
                  onClick={requestWomenJourneyAssistance}
                  className="py-2 px-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold text-left"
                >
                  <div className="text-[11px] font-bold inline-flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" /> {t.safety.journeyAssist}
                  </div>
                  <div className="text-[10px] text-teal-100 truncate">
                    {womenSafety.assistanceStatus}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
                <a href="tel:181" className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-900 font-semibold rounded-lg">
                  {t.safety.womenHelpline}
                </a>
                <a href="tel:112" className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-lg">
                  {t.safety.police}
                </a>
                <button
                  onClick={() => triggerSafetySos(qrPass.pickupStop)}
                  className="px-2.5 py-1 bg-red-600 text-white font-semibold rounded-lg"
                >
                  {t.safety.sos}
                </button>
              </div>
            </div>
          )}

          {/* 2. LIVE VEHICLE GPS TRACKING */}
          {safetyView === "gps" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900">
                  Live GPS (Sim) · {qrPass.pickupStop} → ETA{" "}
                  {poolAllocation.userAssignment?.estimatedArrival ?? "08:22 AM"}
                </span>
                <button
                  onClick={toggleGuardianTrackingConsent}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border inline-flex items-center gap-1 ${
                    guardianTrackingConsent
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-slate-100 border-slate-300 text-slate-700"
                  }`}
                >
                  {guardianTrackingConsent ? (
                    <>
                      <Eye className="w-3 h-3" /> {t.safety.consentOn}
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" /> {t.safety.paused}
                    </>
                  )}
                </button>
              </div>

              {guardianTrackingConsent ? (
                <RouteMap
                  villages={villages}
                  buses={buses}
                  disruption={disruptions[0]}
                  heightClass="h-[185px]"
                  activeMode={activeStudent?.selectedMode ?? "govt_bus"}
                  customFromLabel={qrPass.pickupStop}
                />
              ) : (
                <div className="h-[185px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-4 text-center text-xs text-slate-600">
                  GPS sharing paused by student privacy setting. Toggle Consent ON to share with guardian.
                </div>
              )}

              {guardianNotifications[0] && (
                <div className="px-2.5 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-[11px] flex justify-between gap-2">
                  <span className="truncate">
                    <Bell className="w-3 h-3 inline mr-1 text-teal-700" />
                    <strong>{guardianNotifications[0].title}:</strong>{" "}
                    {guardianNotifications[0].detail}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                    {Math.round(liveSim.busProgressPct)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. QR-BASED STUDENT BOARDING VERIFICATION */}
          {safetyView === "qr" && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <QrCodeMatrix token={qrPass.qrToken} size={82} />
                <div className="flex-1 min-w-0 text-xs space-y-0.5">
                  <div className="font-bold text-slate-900 truncate">
                    {qrPass.studentName} · <span className="font-mono text-teal-900">{qrPass.qrToken}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">{qrPass.routeLabel}</div>
                  <div className="text-[11px] font-mono text-emerald-800">
                    Board: {qrPass.boardedAt ?? "Pending"} · Arrive: {qrPass.arrivedAt ?? "Pending"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => scanStudentQr("board", qrPass.vehicleReg, qrPass.qrToken)}
                  className="py-1.5 bg-teal-700 text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1"
                >
                  <ScanLine className="w-3 h-3" /> {t.safety.board}
                </button>
                <button
                  onClick={() => scanStudentQr("arrive", qrPass.vehicleReg, qrPass.qrToken)}
                  className="py-1.5 bg-emerald-700 text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> {t.safety.arrive}
                </button>
                <button
                  onClick={() => scanStudentQr("board", "KA-05-Z-9901", qrPass.qrToken)}
                  className="py-1.5 bg-slate-100 text-slate-800 font-semibold rounded-lg"
                >
                  {t.safety.testMismatch}
                </button>
              </div>

              {qrPass.scanGuardNotice && (
                <div
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                    qrPass.scanGuardOk
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {qrPass.scanGuardNotice}
                </div>
              )}

              <form onSubmit={handlePin} className="flex gap-1.5">
                <input
                  type="text"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder={`Fallback PIN (${boardingPin})`}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
                <button type="submit" className="px-3 py-1.5 bg-sky-700 text-white text-xs font-semibold rounded-lg">
                  {t.safety.verifyPin}
                </button>
              </form>
              {pinMsg && <div className="text-[11px] text-teal-800">{pinMsg}</div>}
            </div>
          )}

          {/* 4. AI ROAD HAZARD, ACCIDENT & WEATHER ALERTS */}
          {safetyView === "hazards" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900">
                  {t.safety.hazardsTitle}
                </span>
                <button
                  onClick={runAiHazardScan}
                  className="px-2.5 py-1 bg-teal-700 text-white text-[11px] font-semibold rounded-lg inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> {t.safety.alertRidersDrivers}
                </button>
              </div>

              {aiHazardAdvice && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950">
                  {aiHazardAdvice}
                </div>
              )}

              <div className="space-y-1.5">
                {roadHazards.map((hz) => (
                  <div
                    key={hz.id}
                    className={`p-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                      hz.status === "Cleared"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-amber-50/60 border-amber-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {hz.category}: {hz.title} ({hz.severity})
                      </div>
                      <div className="text-teal-900 truncate">Detour: {hz.recommendedDetour}</div>
                    </div>
                    <button
                      onClick={() => toggleRoadHazard(hz.id)}
                      className="px-2 py-0.5 bg-white border border-amber-300 rounded font-bold text-[10px] shrink-0"
                    >
                      {hz.status} {hz.estimatedDelayMins > 0 ? `+${hz.estimatedDelayMins}m` : ""}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GUARDIAN TAB (COMPACT) */}
      {tab === "parent" && (
        <div className="bg-white border border-sky-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Guardian Monitor ({studentLabel})</span>
            <span className="font-mono text-teal-800">{scenario.journeyStage}</span>
          </div>

          {guardianTrackingConsent ? (
            <RouteMap
              villages={villages}
              buses={buses}
              disruption={disruptions[0]}
              heightClass="h-[160px]"
              customFromLabel={qrPass.pickupStop}
            />
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-center">
              Live GPS paused pending student consent.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {guardianRequests.map((req) => (
              <div key={req.id} className="p-2.5 bg-sky-50/50 border border-sky-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{req.studentName}</div>
                  <div className="text-[11px] text-slate-500">{req.assignedVehicleReg} · {req.status}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => approveGuardianRequest(req.id, "Approved")}
                    className="px-2.5 py-1 bg-teal-700 text-white font-semibold rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => approveGuardianRequest(req.id, "Declined")}
                    className="px-2 py-1 bg-slate-200 text-slate-700 font-semibold rounded-lg inline-flex items-center"
                    aria-label="Decline"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRIVER TAB (COMPACT) */}
      {tab === "provider" && (
        <div className="bg-white border border-sky-100 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs pb-2 border-b border-slate-100">
            <select
              value={effectiveScanVehicle}
              onChange={(e) => setScanVehicleSelect(e.target.value)}
              className="px-2 py-1 bg-sky-50 border border-sky-200 rounded-lg font-mono text-xs"
            >
              <option value={qrPass.vehicleReg}>{qrPass.vehicleReg} (Assigned)</option>
              {providers.map((p) => (
                <option key={p.id} value={p.registration}>{p.registration}</option>
              ))}
            </select>
            <button
              onClick={() => scanStudentQr("board", effectiveScanVehicle, qrPass.qrToken)}
              className="px-2.5 py-1 bg-teal-700 text-white font-semibold rounded-lg"
            >
              Scan Board
            </button>
            <button
              onClick={() => scanStudentQr("arrive", effectiveScanVehicle, qrPass.qrToken)}
              className="px-2.5 py-1 bg-emerald-700 text-white font-semibold rounded-lg"
            >
              Scan Arrive
            </button>
          </div>
          {qrPass.scanGuardNotice && (
            <div className={`px-2 py-1 rounded text-[11px] ${qrPass.scanGuardOk ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
              {qrPass.scanGuardNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {providers.slice(0, 4).map((vp) => (
              <div key={vp.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 inline-flex items-center gap-1 truncate">
                    {vp.operatorName}
                    {vp.policeVerified ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-red-600" />}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">{vp.registration} · {vp.seatCapacity} seats</div>
                </div>
                <button
                  onClick={() => toggleProviderAvailability(vp.id)}
                  disabled={!vp.policeVerified}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                    !vp.policeVerified ? "bg-slate-200 text-slate-500" : vp.available ? "bg-emerald-700 text-white" : "bg-slate-300 text-slate-800"
                  }`}
                >
                  {!vp.policeVerified ? "Locked" : vp.available ? "Online" : "Offline"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN TAB (COMPACT) */}
      {tab === "admin" && (
        <div className="bg-white border border-sky-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Safety Verification</span>
            <div className="flex gap-1.5">
              <button onClick={exportCsv} className="px-2.5 py-1 bg-sky-50 text-teal-900 border border-sky-200 rounded-lg font-semibold inline-flex items-center gap-1">
                <Download className="w-3 h-3" /> CSV
              </button>
              <button onClick={resetDemoScenario} className="px-2.5 py-1 bg-teal-700 text-white rounded-lg font-semibold">
                {t.pool.reset}
              </button>
            </div>
          </div>
          {providers.filter((p) => !p.policeVerified).map((p) => (
            <div key={p.id} className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-950">{p.operatorName} ({p.registration})</span>
              <button onClick={() => verifyProviderDriver(p.id)} className="px-2.5 py-1 bg-teal-700 text-white font-semibold rounded-lg">
                Verify Driver
              </button>
            </div>
          ))}
          {providers.every((p) => p.policeVerified) && (
            <div className="text-xs text-emerald-700 font-medium">All drivers police-verified.</div>
          )}
        </div>
      )}

      {/* Compact Footer Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActivePage("predictions")}
          className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> {t.nav.forecast}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActivePage("pool")}
            className="px-2.5 py-1.5 bg-white border border-sky-200 text-teal-900 text-[11px] font-semibold rounded-lg"
          >
            {t.nav.pool}
          </button>
          <button
            onClick={() => setActivePage("home")}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-teal-900 border border-sky-200 text-[11px] font-semibold rounded-lg"
          >
            {t.nav.home}
          </button>
        </div>
      </div>
    </div>
  );
};
