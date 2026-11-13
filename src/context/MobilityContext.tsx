import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AuditLogEntry,
  CoPilotMessage,
  Coordinates,
  DestinationArrivalNotice,
  DistrictDataset,
  ForecastSolutionPlan,
  GovernmentBus,
  GuardianApprovalRequest,
  GuardianSafetyNotification,
  JourneyHistoryRecord,
  JourneyStage,
  Language,
  LiveSimulationState,
  LiveStepId,
  PageId,
  PersonTripRequest,
  PoolAllocationResult,
  RoadWeatherHazard,
  RouteDisruption,
  SafetyEmergencyAlert,
  SafetyQrPass,
  ScenarioConfig,
  TransportPossibility,
  UserRole,
  VerifiedProviderVehicle,
  Village,
  WomenSafetyProfile,
} from "../types/mobility";
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BUSES,
  INITIAL_DISRUPTIONS,
  INITIAL_GUARDIAN_REQUESTS,
  INITIAL_JOURNEY_HISTORY,
  INITIAL_PROVIDERS,
  INITIAL_SCENARIO,
  INITIAL_VILLAGES,
} from "../data/initialMobilityData";
import { buildDefaultPersonTrips, DISTRICT_DATASETS } from "../data/districtDatasets";

interface MobilityContextValue {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  lowDataMode: boolean;
  setLowDataMode: (val: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (val: boolean) => void;
  districts: DistrictDataset[];
  selectedDistrict: DistrictDataset;
  selectDistrict: (districtId: string) => void;
  personTrips: PersonTripRequest[];
  addPersonTrip: (personName?: string) => void;
  updatePersonTrip: (id: string, patch: Partial<PersonTripRequest>) => void;
  removePersonTrip: (id: string) => void;
  getTransportPossibilities: (person: PersonTripRequest) => TransportPossibility[];
  villages: Village[];
  buses: GovernmentBus[];
  providers: VerifiedProviderVehicle[];
  guardianRequests: GuardianApprovalRequest[];
  disruptions: RouteDisruption[];
  journeyHistory: JourneyHistoryRecord[];
  auditLogs: AuditLogEntry[];
  scenario: ScenarioConfig;
  updateScenario: (patch: Partial<ScenarioConfig>) => void;
  poolAllocation: PoolAllocationResult;
  approveGuardianRequest: (id: string, decision: "Approved" | "Declined") => void;
  toggleProviderAvailability: (id: string) => void;
  verifyProviderDriver: (id: string) => void;
  toggleDisruption: (id: string, forceActive?: boolean) => void;
  triggerExamDayCrisis: (enable?: boolean) => void;
  reallocateCrisisFleet: () => void;
  redistributeBusToCorridor: (sourceBusId: string, targetVillageId: string) => void;
  toggleBusStatus: (busId: string) => void;
  applyForecastSolutionToPool: (plan: ForecastSolutionPlan) => void;
  notifyCollegeShortage: (plan: ForecastSolutionPlan) => void;
  advanceJourneyStage: (stage: JourneyStage) => void;
  notifyCollegeArrival: () => void;
  triggerEmergencySos: (studentName: string, location: string) => void;
  importExternalDataset: (villagesInput: Village[], busesInput?: GovernmentBus[]) => void;
  resetDemoScenario: () => void;
  boardingPin: string;
  studentBoarded: boolean;
  confirmStudentBoarding: (pinInput: string) => boolean;
  sosAlertMessage: string | null;
  dismissSosAlert: () => void;
  liveSim: LiveSimulationState;
  toggleLiveSimulation: () => void;
  setLiveSpeed: (speed: 1 | 5) => void;
  toggleAutoReact: () => void;
  toggleAutoSpeak: () => void;
  coPilotMessages: CoPilotMessage[];
  coPilotLoading: boolean;
  sendCoPilotChat: (message: string) => Promise<void>;
  markStepCompleted: (step: LiveStepId, title: string, detail: string) => void;
  // Intelligent Student & Women Safety Module
  guardianTrackingConsent: boolean;
  toggleGuardianTrackingConsent: () => void;
  emergencyAlert: SafetyEmergencyAlert | null;
  triggerSafetySos: (customLocation?: string) => void;
  acknowledgeSafetySos: () => void;
  clearSafetySos: () => void;
  qrPass: SafetyQrPass;
  scanStudentQr: (action: "board" | "arrive", scannedVehicleReg?: string, scannedToken?: string) => void;
  roadHazards: RoadWeatherHazard[];
  toggleRoadHazard: (hazardId: string) => void;
  aiHazardAdvice: string | null;
  runAiHazardScan: () => void;
  womenSafety: WomenSafetyProfile;
  toggleWomenVerifiedPriority: () => void;
  toggleWomenTripShare: () => void;
  requestWomenJourneyAssistance: () => void;
  guardianNotifications: GuardianSafetyNotification[];
  assignedSafetyDriver: {
    driverName: string;
    vehicleReg: string;
    vehicleType: string;
    phoneMasked: string;
    policeVerified: boolean;
    safetyScore: string;
    permitExpiry: string;
    photoUrl?: string;
  };
  destinationArrival: DestinationArrivalNotice | null;
  simulateReachDestination: () => void;
  dismissDestinationArrival: () => void;
  startNewRide: () => void;
}

const INITIAL_LIVE_SIM: LiveSimulationState = {
  running: true,
  speed: 1,
  busProgressPct: 18,
  vanProgressPct: 12,
  autoProgressPct: 26,
  rideEnded: false,
  completedSteps: ["step_demand"],
  autoReactEnabled: true,
  autoSpeakEnabled: false,
};

const INITIAL_COPILOT_MESSAGES: CoPilotMessage[] = [
  {
    id: "cp-init",
    sender: "assistant",
    timestamp: "Live",
    text: "Select your District first, then pick each person's destination to compare Government Bus, Verified Pool Van, and Rural Auto options live.",
    suggestedPage: "pool",
    suggestedActionLabel: "Open Pool",
  },
];

const MobilityContext = createContext<MobilityContextValue | null>(null);

function haversineKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function computeRouteDistanceKm(
  person: PersonTripRequest,
  villages: Village[],
  buses: GovernmentBus[],
  districtCenter: Coordinates,
  destinationsList: string[],
  disruptionActive = false
): number {
  const matchedPickup = villages
    .flatMap((v) => v.pickupPoints.map((pp) => ({ village: v, pp })))
    .find((entry) => entry.pp.id === person.originVillageId);
  const originV =
    matchedPickup?.village ??
    villages.find((v) => v.id === person.originVillageId) ??
    villages[0];

  let fromCoords: Coordinates = matchedPickup?.pp.coords ?? originV?.coords ?? districtCenter;
  if (person.originVillageId === "custom") {
    const addr = (person.customFromAddress ?? "").trim();
    const hash = addr.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    fromCoords = {
      lat: (originV?.coords.lat ?? districtCenter.lat) + ((hash % 9) - 4) * 0.015,
      lng: (originV?.coords.lng ?? districtCenter.lng) + (((hash >> 2) % 9) - 4) * 0.015,
    };
  }

  const destBus = buses.find((b) => b.destinationName === person.destination && b.waypoints.length > 0);
  let toCoords: Coordinates;
  if (destBus) {
    toCoords = destBus.waypoints[destBus.waypoints.length - 1];
  } else {
    const destIdx = Math.max(0, destinationsList.indexOf(person.destination));
    const offsets: Array<[number, number]> = [
      [-0.12, 0.05],
      [-0.08, 0.09],
      [0.14, 0.16],
      [0.07, -0.07],
      [-0.1, 0.02],
      [-0.04, 0.14],
      [-0.18, -0.02],
      [-0.22, 0.09],
    ];
    const [dLat, dLng] = offsets[destIdx % offsets.length];
    toCoords = { lat: districtCenter.lat + dLat, lng: districtCenter.lng + dLng };
  }

  const straightKm = haversineKm(fromCoords, toCoords);
  const baseRoadKm = Math.max(3, Math.round(straightKm * 1.28));
  return baseRoadKm + (disruptionActive ? 3 : 0);
}

export function computePoolAllocation(
  scenario: ScenarioConfig,
  villages: Village[],
  providers: VerifiedProviderVehicle[],
  buses: GovernmentBus[] = [],
  personTrips: PersonTripRequest[] = []
): PoolAllocationResult {
  const activeRequest = personTrips[0];
  const targetCollege = scenario.institutionName || activeRequest?.destination || "";

  // Resolve active user's From pickup point
  const matchedUserPickup = activeRequest
    ? villages
        .flatMap((v) => v.pickupPoints.map((pp) => ({ village: v, pp })))
        .find((entry) => entry.pp.id === activeRequest.originVillageId)
    : undefined;
  const userOriginVillage =
    matchedUserPickup?.village ??
    (activeRequest ? villages.find((v) => v.id === activeRequest.originVillageId) : undefined) ??
    villages[0];
  const userFromName =
    activeRequest?.originVillageId === "custom"
      ? activeRequest.customFromAddress?.trim() || "Custom Pickup"
      : matchedUserPickup?.pp.name ??
        userOriginVillage?.pickupPoints[0]?.name ??
        userOriginVillage?.name ??
        "Village Stop";

  // Check if a Government Bus actually serves the selected route/college & is not cancelled
  const routeBus =
    buses.find(
      (b) => b.originVillageId === userOriginVillage?.id && b.destinationName === targetCollege
    ) ?? buses.find((b) => b.destinationName === targetCollege);
  const directBusExists = Boolean(routeBus);
  const busIsCancelled = Boolean(scenario.disruptionActive || routeBus?.status === "Cancelled");

  const crisisActive = Boolean(scenario.examCrisisActive);
  const crisisReallocated = Boolean(scenario.crisisReallocated);
  const demandSurgePct = crisisActive ? scenario.demandSurgePct ?? 40 : 0;
  const brokenDownBuses = crisisActive ? scenario.brokenDownBusCount ?? 2 : 0;

  const extraAddedPeople = Math.max(0, personTrips.length - 3);
  const baseStudents = Math.max(1, scenario.totalStudents + extraAddedPeople);
  const totalDemand = scenario.appliedPlanSummary
    ? scenario.appliedPlanSummary.predictedDemand
    : crisisActive
    ? Math.round(baseStudents * (1 + demandSurgePct / 100))
    : baseStudents;

  // Exam priority students (examinations within next 2 hours)
  const examPriorityCount = scenario.appliedPlanSummary
    ? Math.min(totalDemand, Math.round(totalDemand * (crisisActive ? 0.42 : 0.25)))
    : crisisActive
    ? Math.min(totalDemand, Math.max(24, Math.round(totalDemand * 0.42)))
    : Math.min(totalDemand, Math.round(totalDemand * 0.25));

  // Count operational government buses for capacity calculation
  const operationalBuses = buses.filter((b) => b.status !== "Cancelled");
  const rawGovtSeats = crisisActive
    ? crisisReallocated
      ? Math.max(scenario.seatsPerGovtBus, operationalBuses.length * scenario.seatsPerGovtBus)
      : Math.max(0, (scenario.govtBusCount - brokenDownBuses) * scenario.seatsPerGovtBus)
    : Math.max(0, scenario.govtBusCount * scenario.seatsPerGovtBus);

  const totalGovtSeats = scenario.appliedPlanSummary
    ? scenario.appliedPlanSummary.totalGovtSeats
    : crisisActive && crisisReallocated
    ? rawGovtSeats
    : directBusExists && !busIsCancelled
    ? rawGovtSeats
    : 0;
  const govtSeatsAssigned = Math.min(totalDemand, totalGovtSeats);
  const shortageCount = Math.max(0, totalDemand - govtSeatsAssigned);

  const verifiedVans = providers.filter(
    (p) => p.policeVerified && p.available && p.vehicleType !== "Verified Rural Auto"
  );
  const verifiedAutos = providers.filter(
    (p) => p.policeVerified && p.available && p.vehicleType === "Verified Rural Auto"
  );

  const maxVanSeats = scenario.backupVansAvailable * scenario.seatsPerBackupVan;
  const maxAutoSeats = scenario.backupAutosAvailable * scenario.seatsPerAuto;

  let remainingShortage = shortageCount;
  let backupVansDispatched = 0;
  let backupAutosDispatched = 0;

  // If user explicitly requested Rural Auto and autos exist, dispatch at least 1 auto when needed or requested
  const userRequestedAuto = activeRequest?.selectedMode === "verified_auto";

  while (
    remainingShortage > 0 &&
    backupVansDispatched < scenario.backupVansAvailable &&
    maxVanSeats > 0 &&
    !(userRequestedAuto && backupAutosDispatched === 0 && remainingShortage <= scenario.seatsPerAuto)
  ) {
    backupVansDispatched += 1;
    remainingShortage = Math.max(0, remainingShortage - scenario.seatsPerBackupVan);
  }

  while (remainingShortage > 0 && backupAutosDispatched < scenario.backupAutosAvailable && maxAutoSeats > 0) {
    backupAutosDispatched += 1;
    remainingShortage = Math.max(0, remainingShortage - scenario.seatsPerAuto);
  }

  if (userRequestedAuto && backupAutosDispatched === 0 && scenario.backupAutosAvailable > 0) {
    backupAutosDispatched = 1;
  }

  const vanSeatsAllocated = Math.min(
    shortageCount,
    backupVansDispatched * scenario.seatsPerBackupVan
  );
  const autoSeatsAllocated = Math.min(
    Math.max(0, shortageCount - vanSeatsAllocated),
    backupAutosDispatched * scenario.seatsPerAuto
  );
  const totalBackupSeatsAllocated = vanSeatsAllocated + autoSeatsAllocated;
  const unaccommodatedStudents = Math.max(0, shortageCount - totalBackupSeatsAllocated);

  // Build nearby village pickup list prioritizing the user's selected/custom From place first
  const districtPickups = villages.flatMap((v) =>
    v.pickupPoints.map((pp) => ({ ...pp, villageName: v.name }))
  );

  const prioritizedPickups: typeof districtPickups = [];
  if (activeRequest?.originVillageId === "custom") {
    prioritizedPickups.push({
      id: "custom-user-pickup",
      villageId: userOriginVillage?.id ?? "custom",
      villageName: `${activeRequest.personName || "Traveler"} (Custom Stop)`,
      name: userFromName,
      landmark: "User Address",
      coords: userOriginVillage?.coords ?? { lat: 12.9, lng: 77.2 },
      assignedStudents: 1,
      accessibleShelter: true,
    });
  } else if (matchedUserPickup) {
    prioritizedPickups.push({
      ...matchedUserPickup.pp,
      villageName: matchedUserPickup.village.name,
    });
  }

  for (const pp of districtPickups) {
    if (prioritizedPickups.length >= 3) break;
    if (!prioritizedPickups.some((p) => p.id === pp.id)) {
      prioritizedPickups.push(pp);
    }
  }

  const pickups = prioritizedPickups.slice(0, 3);
  const weights = pickups.length === 3 ? [0.4, 0.35, 0.25] : pickups.length === 2 ? [0.55, 0.45] : [1];

  let allocatedGovtRemaining = govtSeatsAssigned;
  let allocatedVanRemaining = vanSeatsAllocated;
  let allocatedAutoRemaining = autoSeatsAllocated;

  const pickupClusters = pickups.map((pp, idx) => {
    const clusterTotal =
      idx === pickups.length - 1
        ? Math.max(
            0,
            totalDemand -
              pickups
                .slice(0, idx)
                .reduce((acc, _item, i) => acc + Math.round(totalDemand * (weights[i] ?? 0.3)), 0)
          )
        : Math.round(totalDemand * (weights[idx] ?? 0.33));

    const govtTake = Math.min(clusterTotal, allocatedGovtRemaining);
    allocatedGovtRemaining = Math.max(0, allocatedGovtRemaining - govtTake);

    const neededAfterGovt = Math.max(0, clusterTotal - govtTake);
    const vanTake = Math.min(neededAfterGovt, allocatedVanRemaining);
    allocatedVanRemaining = Math.max(0, allocatedVanRemaining - vanTake);

    const neededAfterVan = Math.max(0, neededAfterGovt - vanTake);
    const autoTake = Math.min(neededAfterVan, allocatedAutoRemaining);
    allocatedAutoRemaining = Math.max(0, allocatedAutoRemaining - autoTake);

    const vanReg = verifiedVans[idx % Math.max(1, verifiedVans.length)]?.registration ?? "Backup Van";
    const autoReg = verifiedAutos[idx % Math.max(1, verifiedAutos.length)]?.registration ?? "Rural Auto";

    const parts: string[] = [];
    if (govtTake > 0) parts.push(`${routeBus?.routeNumber ?? "Govt Bus"} (${govtTake})`);
    if (vanTake > 0) parts.push(`Van ${vanReg} (${vanTake})`);
    if (autoTake > 0) parts.push(`Auto ${autoReg} (${autoTake})`);
    const assignedVehicle = parts.length > 0 ? parts.join(" · ") : "Waitlist";

    const pickupTimes = ["07:35 AM", "07:42 AM", "07:48 AM"];
    const baseEtas = scenario.disruptionActive
      ? ["08:32 AM", "08:36 AM", "08:38 AM"]
      : ["08:18 AM", "08:22 AM", "08:25 AM"];

    return {
      pickupId: pp.id,
      villageName: pp.villageName,
      name: pp.name,
      landmark: pp.landmark,
      totalStudents: clusterTotal,
      govtBusAssigned: govtTake,
      vanAssigned: vanTake,
      autoAssigned: autoTake,
      backupPoolAssigned: vanTake + autoTake,
      assignedVehicle,
      pickupTime: pickupTimes[idx] ?? "07:45 AM",
      estimatedArrival: baseEtas[idx] ?? "08:24 AM",
    };
  });

  const totalAccommodated = govtSeatsAssigned + totalBackupSeatsAllocated;
  // Exam students (< 2h) are prioritized FIRST for all active seats
  const examStudentsSecured = Math.min(examPriorityCount, totalAccommodated);
  const onTimeRatePct = Math.round((totalAccommodated / Math.max(1, totalDemand)) * 100);

  // Determine active user's specific assignment based on Routes request
  let userAssignment: PoolAllocationResult["userAssignment"];
  if (activeRequest) {
    const primaryVan = verifiedVans[0];
    const primaryAuto = verifiedAutos[0];
    const isFemale = (activeRequest.gender ?? "female") === "female";
    const hasPass = Boolean(activeRequest.hasBusPass);
    const estDistKm = computeRouteDistanceKm(
      activeRequest,
      villages,
      buses,
      userOriginVillage?.coords ?? { lat: 12.84, lng: 77.26 },
      [targetCollege],
      scenario.disruptionActive
    );
    const busRateFare = estDistKm * 3;
    const vanRateFare = estDistKm * 5;
    const autoRateFare = estDistKm * 10;
    const govtFare = isFemale
      ? `₹0 (Aadhaar · Std ₹${busRateFare})`
      : hasPass
      ? `₹0 (Pass · Std ₹${busRateFare})`
      : `₹${busRateFare} (${estDistKm} km)`;
    const isExamCandidate = Boolean(activeRequest.examCandidate);

    const requestedModeLabel =
      activeRequest.selectedMode === "govt_bus"
        ? "Government Bus"
        : activeRequest.selectedMode === "pool_van"
        ? "Pooled Backup Van"
        : "Verified Rural Auto";

    let assignedVehicleLabel = "";
    let fareLabel = "";
    let statusNote = "";

    if (activeRequest.selectedMode === "govt_bus") {
      if ((directBusExists && !busIsCancelled && govtSeatsAssigned > 0) || (crisisActive && crisisReallocated)) {
        assignedVehicleLabel = crisisActive && crisisReallocated
          ? `Express Reserve Bus (${buses[buses.length - 1]?.routeNumber ?? "KSRTC"})`
          : `${routeBus?.routeNumber ?? "Govt Bus"} (${routeBus?.registration ?? ""})`;
        fareLabel = govtFare;
        statusNote = isExamCandidate
          ? "Exam Priority (< 2h): Assigned Priority 1 seat on Express Bus."
          : "Matched on requested direct Government Bus.";
      } else if (vanSeatsAllocated > 0 || scenario.backupVansAvailable > 0) {
        assignedVehicleLabel = `Van ${primaryVan?.registration ?? "Backup Van"}`;
        fareLabel = `₹${vanRateFare} (${estDistKm} km)`;
        statusNote = isExamCandidate
          ? "Exam Priority (< 2h): Bus unavailable — express-shifted to Detour Van."
          : busIsCancelled
          ? "Route bus disrupted — auto-shifted to Backup Van."
          : "No direct bus to selected campus — auto-shifted to Backup Van.";
      } else {
        assignedVehicleLabel = `Auto ${primaryAuto?.registration ?? "Rural Auto"}`;
        fareLabel = `₹${autoRateFare} (${estDistKm} km)`;
        statusNote = "Shifted to Verified Rural Auto.";
      }
    } else if (activeRequest.selectedMode === "pool_van") {
      assignedVehicleLabel = `Pooled Van (${primaryVan?.registration ?? "Verified"})`;
      fareLabel = `₹${vanRateFare} (${estDistKm} km)`;
      statusNote = isExamCandidate
        ? "Exam Priority (< 2h): Express Detour Van reserved."
        : "Assigned to shared Backup Van from your pickup stop.";
    } else {
      assignedVehicleLabel = `Rural Auto (${primaryAuto?.registration ?? "Verified"})`;
      fareLabel = `₹${autoRateFare} (${estDistKm} km)`;
      statusNote = isExamCandidate
        ? "Exam Priority (< 2h): Direct Rural Auto bypasses flood detour."
        : "Assigned to door-to-campus Verified Rural Auto.";
    }

    userAssignment = {
      personName: activeRequest.personName || "Traveler",
      fromPlace: userFromName,
      toCollege: targetCollege,
      examPriority: isExamCandidate,
      requestedModeLabel,
      assignedVehicleLabel,
      fareLabel,
      pickupTime: pickupClusters[0]?.pickupTime ?? "07:35 AM",
      estimatedArrival: pickupClusters[0]?.estimatedArrival ?? "08:22 AM",
      statusNote,
    };
  }

  const etaDelay = scenario.disruptionActive ? "08:35 AM (+13m Detour)" : "08:22 AM";
  const collegeEtaSummary = `${govtSeatsAssigned} Bus · ${vanSeatsAllocated} Van · ${autoSeatsAllocated} Auto · ETA ${etaDelay}`;

  return {
    totalDemand,
    totalGovtSeats,
    govtSeatsAssigned,
    shortageCount,
    backupCapacityNeeded: shortageCount,
    backupVansDispatched,
    backupAutosDispatched,
    vanSeatsAllocated,
    autoSeatsAllocated,
    totalBackupSeatsAllocated,
    unaccommodatedStudents,
    examPriorityCount,
    examStudentsSecured,
    crisisActive,
    crisisReallocated,
    brokenDownBuses,
    demandSurgePct,
    onTimeRatePct,
    pickupClusters,
    userAssignment,
    collegeEtaSummary,
  };
}

export const MobilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePageState] = useState<PageId>("home");
  const [role, setRole] = useState<UserRole>("student");
  const [language, setLanguage] = useState<Language>("en");
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(DISTRICT_DATASETS[0].id);
  const selectedDistrict = useMemo(
    () => DISTRICT_DATASETS.find((d) => d.id === selectedDistrictId) ?? DISTRICT_DATASETS[0],
    [selectedDistrictId]
  );

  const [personTrips, setPersonTrips] = useState<PersonTripRequest[]>(() =>
    buildDefaultPersonTrips(DISTRICT_DATASETS[0])
  );

  const [villages, setVillages] = useState<Village[]>(INITIAL_VILLAGES);
  const [buses, setBuses] = useState<GovernmentBus[]>(INITIAL_BUSES);
  const [providers, setProviders] = useState<VerifiedProviderVehicle[]>(INITIAL_PROVIDERS);
  const [guardianRequests, setGuardianRequests] = useState<GuardianApprovalRequest[]>(
    INITIAL_GUARDIAN_REQUESTS
  );
  const [disruptions, setDisruptions] = useState<RouteDisruption[]>(INITIAL_DISRUPTIONS);
  const [journeyHistory, setJourneyHistory] = useState<JourneyHistoryRecord[]>(
    INITIAL_JOURNEY_HISTORY
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [scenario, setScenario] = useState<ScenarioConfig>(INITIAL_SCENARIO);

  const [boardingPin] = useState<string>("4829");
  const [studentBoarded, setStudentBoarded] = useState<boolean>(false);
  const [sosAlertMessage, setSosAlertMessage] = useState<string | null>(null);

  const [liveSim, setLiveSim] = useState<LiveSimulationState>(INITIAL_LIVE_SIM);
  const [coPilotMessages, setCoPilotMessages] = useState<CoPilotMessage[]>(INITIAL_COPILOT_MESSAGES);
  const [coPilotLoading, setCoPilotLoading] = useState<boolean>(false);

  // 5 Intelligent Safety Module states
  const [guardianTrackingConsent, setGuardianTrackingConsent] = useState<boolean>(true);
  const [emergencyAlert, setEmergencyAlert] = useState<SafetyEmergencyAlert | null>(null);
  const [qrScanState, setQrScanState] = useState<{
    passKey: string;
    boardedAt?: string;
    arrivedAt?: string;
    scanGuardNotice?: string;
    scanGuardOk?: boolean;
  }>({ passKey: "" });
  const [hazardClearedIds, setHazardClearedIds] = useState<Record<string, boolean>>({});
  const [aiHazardAdvice, setAiHazardAdvice] = useState<string | null>(null);
  const [womenSafety, setWomenSafety] = useState<WomenSafetyProfile>({
    prioritizeVerifiedOnly: true,
    guardianShareConsent: true,
    sharedTripLinkId: "GR-SAFE-7742",
    trustedGuardianName: "Smt. Lakshmi Devi",
    trustedGuardianPhone: "+91 98451 ••302",
    assistanceStatus: "Standby",
    lastSharedAt: "Active Trip Ready",
  });
  const [guardianNotifications, setGuardianNotifications] = useState<GuardianSafetyNotification[]>([
    {
      id: "gn-init",
      timestamp: "07:20 AM",
      title: "Trip Assigned via Pool",
      detail: "Pre-boarding verified vehicle & driver checks passed.",
      kind: "women_share",
    },
  ]);
  const [destinationArrival, setDestinationArrival] = useState<DestinationArrivalNotice | null>(null);

  const reactTimerRef = useRef<number | null>(null);
  const hydratedRef = useRef<boolean>(false);
  const prevActivePctRef = useRef<number>(18);

  const poolAllocation = useMemo(
    () => computePoolAllocation(scenario, villages, providers, buses, personTrips),
    [scenario, villages, providers, buses, personTrips]
  );

  const assignedSafetyDriver = useMemo(() => {
    const activeTrip = personTrips[0];
    const verifiedPoolDrivers = providers
      .filter((p) => p.policeVerified && p.available)
      .sort((a, b) => b.safetyScore.localeCompare(a.safetyScore));
    const fallbackDriver = providers[0];
    const preferredProvider =
      (activeTrip?.selectedMode === "verified_auto"
        ? verifiedPoolDrivers.find((p) => p.vehicleType === "Verified Rural Auto")
        : verifiedPoolDrivers.find((p) => p.vehicleType !== "Verified Rural Auto")) ??
      verifiedPoolDrivers[0] ??
      fallbackDriver;

    const assignedLabel = poolAllocation.userAssignment?.assignedVehicleLabel ?? "";
    const matchedBus =
      buses.find(
        (b) => b.status !== "Cancelled" && assignedLabel.includes(b.routeNumber)
      ) ?? buses.find((b) => b.status !== "Cancelled");

    const useBus =
      activeTrip?.selectedMode === "govt_bus" &&
      matchedBus &&
      !assignedLabel.includes("Van") &&
      !assignedLabel.includes("Auto");

    if (useBus && matchedBus) {
      return {
        driverName: matchedBus.driverName,
        vehicleReg: matchedBus.registration,
        vehicleType: `Govt Bus (${matchedBus.routeNumber})`,
        phoneMasked: "+91 800-KSRTC-24",
        policeVerified: true,
        safetyScore: "Govt Roster Verified",
        permitExpiry: "Active State Permit",
        photoUrl: preferredProvider?.photoUrl,
      };
    }

    return {
      driverName: preferredProvider?.operatorName ?? "Ramesh Gowda",
      vehicleReg: preferredProvider?.registration ?? "KA-42-T-4421",
      vehicleType: preferredProvider?.vehicleType ?? "Mini Shuttle Van",
      phoneMasked: preferredProvider?.phoneMasked ?? "+91 98450 ••214",
      policeVerified: Boolean(preferredProvider?.policeVerified),
      safetyScore: preferredProvider?.safetyScore ?? "4.9 / 5.0 Verified",
      permitExpiry: preferredProvider?.permitExpiry ?? "2027-08-15",
      photoUrl: preferredProvider?.photoUrl,
    };
  }, [personTrips, providers, buses, poolAllocation.userAssignment]);

  const qrPass: SafetyQrPass = useMemo(() => {
    const activeTrip = personTrips[0];
    const studentName = activeTrip?.personName || "Kavya N.";
    const pickupStop =
      poolAllocation.userAssignment?.fromPlace ||
      villages[0]?.pickupPoints[0]?.name ||
      "Village Stop";
    const collegeName =
      poolAllocation.userAssignment?.toCollege || scenario.institutionName;
    const vehicleReg = assignedSafetyDriver.vehicleReg;
    const passKey = `${selectedDistrict.id}-${studentName}-${vehicleReg}`;
    const cleanCode = studentName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "STD";
    const regTail = vehicleReg.replace(/[^A-Za-z0-9]/g, "").slice(-4);
    const sameTrip = qrScanState.passKey === passKey;
    const boardedAt = sameTrip ? qrScanState.boardedAt : undefined;
    const arrivedAt = sameTrip ? qrScanState.arrivedAt : undefined;

    return {
      passId: `PASS-${regTail}`,
      qrToken: `GR-${selectedDistrict.id.slice(5, 8).toUpperCase()}-${cleanCode}-${regTail}`,
      studentName,
      vehicleReg,
      routeLabel: `${pickupStop} → ${collegeName}`,
      pickupStop,
      collegeName,
      boardingStatus: arrivedAt
        ? "Arrived at College"
        : boardedAt
        ? "Boarded"
        : "Not Boarded",
      boardedAt,
      arrivedAt,
      scanGuardNotice: sameTrip ? qrScanState.scanGuardNotice : undefined,
      scanGuardOk: sameTrip ? qrScanState.scanGuardOk : undefined,
    };
  }, [
    personTrips,
    poolAllocation.userAssignment,
    villages,
    scenario.institutionName,
    assignedSafetyDriver.vehicleReg,
    selectedDistrict.id,
    qrScanState,
  ]);

  const roadHazards: RoadWeatherHazard[] = useMemo(() => {
    const primaryCorridor =
      disruptions[0]?.corridorName ?? `${selectedDistrict.name} Main Highway`;
    const primaryDetour =
      disruptions[0]?.alternatePickupName ?? "Elevated Taluk Bypass Road";
    const floodActive = Boolean(scenario.disruptionActive || disruptions[0]?.active);
    const rainCleared = Boolean(hazardClearedIds["haz-rain"]);
    const trafficCleared = Boolean(hazardClearedIds["haz-accident"]);

    return [
      {
        id: "haz-flood",
        title: disruptions[0]?.cause ?? "Culvert Flooding & Waterlogging",
        category: "Flooding",
        location: primaryCorridor,
        severity: floodActive ? "High" : "Low",
        estimatedDelayMins: floodActive ? disruptions[0]?.detourEtaDelayMins ?? 14 : 0,
        affectedRoutes: [buses[0]?.routeNumber ?? "Route 1", "Backup Shuttle Van"],
        recommendedDetour: `Detour via ${primaryDetour} (higher elevation)`,
        status: floodActive ? "Active Alert" : "Cleared",
        sourceTag: "Simulated Sensor Feed",
      },
      {
        id: "haz-rain",
        title: "Heavy Rainfall & Low Visibility",
        category: "Heavy Rain",
        location: `${villages[0]?.name ?? selectedDistrict.name} Approach`,
        severity: rainCleared ? "Low" : "Moderate",
        estimatedDelayMins: rainCleared ? 0 : 8,
        affectedRoutes: buses.slice(0, 2).map((b) => b.routeNumber),
        recommendedDetour: "Use sheltered Panchayat pickup bays & reduce speed 35 km/h",
        status: rainCleared ? "Cleared" : "Monitoring",
        sourceTag: "Simulated Sensor Feed",
      },
      {
        id: "haz-accident",
        title: "Market Junction Congestion / Minor Fender-Bender",
        category: "Accident",
        location: `${villages[1]?.name ?? selectedDistrict.name} Cross`,
        severity: trafficCleared ? "Low" : "Moderate",
        estimatedDelayMins: trafficCleared ? 0 : 6,
        affectedRoutes: [buses[1]?.routeNumber ?? buses[0]?.routeNumber ?? "Route 2"],
        recommendedDetour: "Reroute Rural Autos via College Ring Bypass",
        status: trafficCleared ? "Cleared" : "Active Alert",
        sourceTag: "Simulated Sensor Feed",
      },
    ];
  }, [disruptions, selectedDistrict.name, scenario.disruptionActive, hazardClearedIds, buses, villages]);

  useEffect(() => {
    let active = true;
    fetch("/api/state")
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data?.state) {
          hydratedRef.current = true;
          return;
        }
        const s = data.state;
        if (typeof s.selectedDistrictId === "string") setSelectedDistrictId(s.selectedDistrictId);
        if (Array.isArray(s.personTrips)) setPersonTrips(s.personTrips);
        if (s.scenario) setScenario(s.scenario);
        if (Array.isArray(s.guardianRequests)) setGuardianRequests(s.guardianRequests);
        if (Array.isArray(s.disruptions)) setDisruptions(s.disruptions);
        if (Array.isArray(s.villages)) setVillages(s.villages);
        if (Array.isArray(s.buses)) setBuses(s.buses);
        if (Array.isArray(s.providers)) setProviders(s.providers);
        if (typeof s.studentBoarded === "boolean") setStudentBoarded(s.studentBoarded);
        if (Array.isArray(s.completedSteps)) {
          setLiveSim((prev) => ({ ...prev, completedSteps: s.completedSteps }));
        }
        hydratedRef.current = true;
      })
      .catch(() => {
        hydratedRef.current = true;
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const handle = window.setTimeout(() => {
      void fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            selectedDistrictId,
            personTrips,
            scenario,
            guardianRequests,
            disruptions,
            villages,
            buses,
            providers,
            studentBoarded,
            completedSteps: liveSim.completedSteps,
          },
        }),
      }).catch(() => {});
    }, 350);
    return () => window.clearTimeout(handle);
  }, [
    selectedDistrictId,
    personTrips,
    scenario,
    guardianRequests,
    disruptions,
    villages,
    buses,
    providers,
    studentBoarded,
    liveSim.completedSteps,
  ]);

  useEffect(() => {
    if (!liveSim.running || liveSim.rideEnded) return;
    const interval = window.setInterval(() => {
      const activeMode = personTrips[0]?.selectedMode ?? "govt_bus";
      setLiveSim((prev) => {
        if (prev.rideEnded) return prev;
        const step = prev.speed === 5 ? 3.5 : 0.8;
        const nextBus = scenario.disruptionActive
          ? prev.busProgressPct
          : activeMode === "govt_bus"
          ? Math.min(100, Number((prev.busProgressPct + step).toFixed(1)))
          : prev.busProgressPct >= 100
          ? 0
          : Math.min(100, Number((prev.busProgressPct + step).toFixed(1)));
        const nextVan =
          activeMode === "pool_van"
            ? Math.min(100, Number((prev.vanProgressPct + step * 0.9).toFixed(1)))
            : prev.vanProgressPct >= 100
            ? 0
            : Math.min(100, Number((prev.vanProgressPct + step * 0.9).toFixed(1)));
        const nextAuto =
          activeMode === "verified_auto"
            ? Math.min(100, Number((prev.autoProgressPct + step * 1.1).toFixed(1)))
            : prev.autoProgressPct >= 100
            ? 0
            : Math.min(100, Number((prev.autoProgressPct + step * 1.1).toFixed(1)));
        return {
          ...prev,
          busProgressPct: nextBus,
          vanProgressPct: nextVan,
          autoProgressPct: nextAuto,
        };
      });
    }, 1500);
    return () => window.clearInterval(interval);
  }, [liveSim.running, liveSim.rideEnded, liveSim.speed, scenario.disruptionActive, personTrips]);

  const speakIfEnabled = useCallback(
    (text: string) => {
      if (!liveSim.autoSpeakEnabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(utter);
    },
    [liveSim.autoSpeakEnabled, language]
  );

  const triggerLiveAiReaction = useCallback(
    (eventTitle: string, eventDetail: string, updatedSteps: LiveStepId[]) => {
      const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCoPilotMessages((prev) => [
        ...prev.slice(-18),
        { id: `ev-${Date.now()}`, sender: "step-event", timestamp: nowLabel, text: `${eventTitle}: ${eventDetail}` },
      ]);

      if (!liveSim.autoReactEnabled) return;

      if (reactTimerRef.current) window.clearTimeout(reactTimerRef.current);
      reactTimerRef.current = window.setTimeout(async () => {
        setCoPilotLoading(true);
        try {
          const res = await fetch("/api/ai/react", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventTitle,
              eventDetail,
              language,
              completedSteps: updatedSteps,
              contextSnapshot: {
                district: selectedDistrict.name,
                peopleCount: personTrips.length,
                demand: scenario.totalStudents,
                govtBusSeats: scenario.govtBusCount * scenario.seatsPerGovtBus,
                shortage: Math.max(0, scenario.totalStudents - scenario.govtBusCount * scenario.seatsPerGovtBus),
                disruptionActive: scenario.disruptionActive,
              },
            }),
          });
          const data = await res.json();
          if (res.ok && data.message) {
            const replyMsg: CoPilotMessage = {
              id: `ai-${Date.now()}`,
              sender: "assistant",
              timestamp: nowLabel,
              text: data.message,
              suggestedPage: data.recommendedPage as PageId,
              suggestedActionLabel: data.nextStepHint,
            };
            setCoPilotMessages((prev) => [...prev.slice(-18), replyMsg]);
            speakIfEnabled(data.message);
          }
        } catch {
          // Silent network fallback
        } finally {
          setCoPilotLoading(false);
        }
      }, 450);
    },
    [liveSim.autoReactEnabled, language, selectedDistrict.name, personTrips.length, scenario, speakIfEnabled]
  );

  const markStepCompleted = useCallback(
    (step: LiveStepId, title: string, detail: string) => {
      setLiveSim((prev) => {
        const nextSteps = prev.completedSteps.includes(step)
          ? prev.completedSteps
          : [...prev.completedSteps, step];
        triggerLiveAiReaction(title, detail, nextSteps);
        return { ...prev, completedSteps: nextSteps };
      });
    },
    [triggerLiveAiReaction]
  );

  const selectDistrict = (districtId: string) => {
    const nextDist = DISTRICT_DATASETS.find((d) => d.id === districtId);
    if (!nextDist) return;
    setSelectedDistrictId(nextDist.id);
    setVillages(nextDist.villages);
    setBuses(nextDist.buses);
    setProviders(nextDist.providers);
    setPersonTrips(buildDefaultPersonTrips(nextDist));
    const primaryV = nextDist.villages[0];
    setScenario((prev) => ({
      ...prev,
      villageName: primaryV.name,
      institutionName: nextDist.destinations[0],
      totalStudents: primaryV.dailyStudentDemand,
      seatsPerGovtBus: nextDist.buses[0]?.totalSeats ?? 35,
      govtBusCount: 1,
    }));
    markStepCompleted(
      "step_demand",
      `District Selected: ${nextDist.name}`,
      `${nextDist.villages.length} rural clusters, ${nextDist.buses.length} govt buses, ${nextDist.providers.length} backup vehicles loaded.`
    );
  };

  const addPersonTrip = (personName?: string) => {
    const idx = personTrips.length + 1;
    const v0 = villages[0];
    const newTrip: PersonTripRequest = {
      id: `pt-${Date.now()}`,
      personName: personName || `Traveler ${idx}`,
      gender: idx % 2 === 1 ? "female" : "male",
      hasBusPass: false,
      isMinor: idx % 2 === 1,
      originVillageId: v0.id,
      destination: selectedDistrict.destinations[idx % selectedDistrict.destinations.length],
      selectedMode: "govt_bus",
    };
    setPersonTrips((prev) => [...prev, newTrip]);
    markStepCompleted(
      "step_pool",
      "Added Person Destination",
      `${newTrip.personName} → ${newTrip.destination} in ${selectedDistrict.name}.`
    );
  };

  const updatePersonTrip = (id: string, patch: Partial<PersonTripRequest>) => {
    setPersonTrips((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
    if (patch.destination) {
      setScenario((prev) => ({ ...prev, institutionName: patch.destination! }));
    }
    if (patch.destination || patch.originVillageId || patch.customFromAddress) {
      // Starting/selecting a new From/To route resets a previously ended ride cleanly
      if (liveSim.rideEnded) {
        setDestinationArrival(null);
        setLiveSim((prev) => ({
          ...prev,
          busProgressPct: 14,
          vanProgressPct: 10,
          autoProgressPct: 20,
          rideEnded: false,
          running: true,
        }));
      }
    }
    if (patch.destination || patch.originVillageId || patch.selectedMode || patch.customFromAddress) {
      markStepCompleted(
        "step_pool",
        "Updated Person Route",
        `Recalculated transport possibilities in ${selectedDistrict.name}.`
      );
    }
  };

  const removePersonTrip = (id: string) => {
    setPersonTrips((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const getTransportPossibilities = useCallback(
    (person: PersonTripRequest): TransportPossibility[] => {
      // originVillageId can match a Village ID, a PickupPoint ID, or "custom"
      const matchedPickup = villages
        .flatMap((v) => v.pickupPoints.map((pp) => ({ village: v, pp })))
        .find((entry) => entry.pp.id === person.originVillageId);

      const originV =
        matchedPickup?.village ??
        villages.find((v) => v.id === person.originVillageId) ??
        villages[0];

      const pickupName =
        person.originVillageId === "custom"
          ? person.customFromAddress?.trim() || "Custom Pickup Point"
          : matchedPickup?.pp.name ?? originV?.pickupPoints[0]?.name ?? originV?.name ?? "Village Stop";

      const matchedBus =
        buses.find(
          (b) => b.originVillageId === originV?.id && b.destinationName === person.destination
        ) ??
        buses.find((b) => b.originVillageId === originV?.id) ??
        buses[0];

      const freeBusSeats = matchedBus
        ? matchedBus.status === "Cancelled"
          ? 0
          : Math.max(0, matchedBus.totalSeats - matchedBus.occupiedSeats)
        : 0;
      const busMatchesDest = matchedBus?.destinationName === person.destination;
      const busAvailable = Boolean(matchedBus && freeBusSeats > 0 && busMatchesDest);

      const distanceKm = computeRouteDistanceKm(
        person,
        villages,
        buses,
        selectedDistrict.center,
        selectedDistrict.destinations,
        scenario.disruptionActive
      );
      const busFareInr = distanceKm * 3;
      const vanFareInr = distanceKm * 5;
      const autoFareInr = distanceKm * 10;

      const isMale = person.gender === "male";
      const hasPass = Boolean(person.hasBusPass);
      const govtFareLabel = !isMale
        ? `₹0 (₹${busFareInr})`
        : hasPass
        ? `₹0 (₹${busFareInr})`
        : `₹${busFareInr}`;
      const govtFareRuleBadge = !isMale
        ? `${distanceKm} km · ₹3/km (Std ₹${busFareInr}, Women Aadhaar Free)`
        : hasPass
        ? `${distanceKm} km · ₹3/km (Std ₹${busFareInr}, Govt Pass)`
        : `${distanceKm} km · ₹3/km = ₹${busFareInr}`;

      const pooledPeers = personTrips.filter(
        (p) => p.originVillageId === person.originVillageId && p.destination === person.destination
      ).length;

      const van =
        providers.find(
          (p) => p.policeVerified && p.available && p.vehicleType !== "Verified Rural Auto"
        ) ?? providers[0];

      const auto =
        providers.find(
          (p) => p.policeVerified && p.available && p.vehicleType === "Verified Rural Auto"
        ) ?? providers[providers.length - 1];

      return [
        {
          mode: "govt_bus",
          title: "Government Bus",
          vehicleLabel: matchedBus ? `${matchedBus.routeNumber} (${matchedBus.registration})` : "No direct bus",
          pickupPoint: pickupName,
          departureTime: matchedBus?.departureTime ?? "07:35 AM",
          eta: matchedBus?.expectedArrival ?? "08:20 AM",
          fareLabel: govtFareLabel,
          fareRuleBadge: govtFareRuleBadge,
          distanceKm,
          ratePerKmInr: 3,
          availabilityLabel: !busMatchesDest
            ? "Transfer / Alternate"
            : matchedBus?.status === "Cancelled"
            ? "Cancelled"
            : freeBusSeats > 0
            ? `${freeBusSeats} seats free`
            : "0 seats (Full)",
          available: busAvailable,
          recommended: busAvailable,
          note: !isMale
            ? `Women ride free on govt buses with Aadhaar (${distanceKm} km · ₹3/km waived).`
            : hasPass
            ? `Male rider verified with Student/Govt Bus Pass (${distanceKm} km · ₹3/km waived).`
            : `Standard bus fare: ${distanceKm} km × ₹3/km = ₹${busFareInr}.`,
        },
        {
          mode: "pool_van",
          title: "Pooled Backup Van",
          vehicleLabel: van ? `${van.vehicleType} (${van.registration})` : "Pool Van",
          pickupPoint: pickupName,
          departureTime: "07:42 AM",
          eta: "08:22 AM",
          fareLabel: `₹${vanFareInr}`,
          fareRuleBadge: `${distanceKm} km · ₹5/km`,
          distanceKm,
          ratePerKmInr: 5,
          availabilityLabel: `${pooledPeers} pooled · ${van?.seatCapacity ?? 12} seats`,
          available: Boolean(van?.policeVerified && van?.available),
          recommended: !busAvailable,
          note: person.isMinor
            ? `Police-verified driver · ${distanceKm} km × ₹5/km = ₹${vanFareInr}.`
            : `Police-verified shared village shuttle (${distanceKm} km × ₹5/km).`,
        },
        {
          mode: "verified_auto",
          title: "Verified Rural Auto",
          vehicleLabel: auto ? `${auto.vehicleType} (${auto.registration})` : "Rural Auto",
          pickupPoint: `${pickupName} (Door-to-Gate)`,
          departureTime: "07:50 AM",
          eta: "08:25 AM",
          fareLabel: `₹${autoFareInr}`,
          fareRuleBadge: `${distanceKm} km · ₹10/km`,
          distanceKm,
          ratePerKmInr: 10,
          availabilityLabel: `${auto?.seatCapacity ?? 4} seats · Direct`,
          available: Boolean(auto?.policeVerified && auto?.available),
          recommended: false,
          note: `Direct auto fare: ${distanceKm} km × ₹10/km = ₹${autoFareInr}.`,
        },
      ];
    },
    [villages, buses, providers, personTrips, selectedDistrict, scenario.disruptionActive]
  );

  const setActivePage = (page: PageId) => {
    setActivePageState(page);
    if (page === "pool" && !liveSim.completedSteps.includes("step_pool")) {
      markStepCompleted(
        "step_pool",
        "Opened Village Mobility Pool",
        `Reviewing ${poolAllocation.shortageCount}-student overflow in ${selectedDistrict.name}.`
      );
    }
  };

  const appendLog = (actorRole: string, action: string, detail: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setAuditLogs((prev) => [{ id: `aud-${Date.now()}`, timestamp: timeStr, actorRole, action, detail }, ...prev]);
  };

  const updateScenario = (patch: Partial<ScenarioConfig>) => {
    setScenario((prev) => {
      const next = { ...prev, ...patch, appliedPlanSummary: undefined };
      const nextShortage = Math.max(0, next.totalStudents - next.govtBusCount * next.seatsPerGovtBus);
      markStepCompleted(
        "step_pool",
        "Scenario Adjusted",
        `${next.totalStudents} students vs. ${next.govtBusCount * next.seatsPerGovtBus} govt seats (${nextShortage} shortage).`
      );
      return next;
    });
    if (patch.institutionName) {
      setPersonTrips((prev) =>
        prev.map((p, idx) => (idx === 0 ? { ...p, destination: patch.institutionName! } : p))
      );
    }
  };

  const approveGuardianRequest = (id: string, decision: "Approved" | "Declined") => {
    setGuardianRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: decision } : req)));
    if (decision === "Approved") {
      setScenario((prev) => ({ ...prev, journeyStage: "Guardian Approved" }));
      appendLog("Parent / Guardian", "Minor Transport Approved", `Approved verified backup shuttle request ${id}.`);
      markStepCompleted("step_guardian", "Guardian Approved Minor Trip", `Boarding PIN ${boardingPin} unlocked.`);
    } else {
      appendLog("Parent / Guardian", "Request Declined", `Declined backup shuttle request ${id}.`);
      markStepCompleted("step_guardian", "Guardian Declined Request", `Request ${id} declined.`);
    }
  };

  const toggleProviderAvailability = (id: string) => {
    setProviders((prev) =>
      prev.map((vp) => {
        if (vp.id !== id || !vp.policeVerified) return vp;
        const nextAvail = !vp.available;
        appendLog("Transport Provider", nextAvail ? "Vehicle Online" : "Vehicle Offline", `${vp.registration} updated.`);
        return { ...vp, available: nextAvail };
      })
    );
  };

  const verifyProviderDriver = (id: string) => {
    setProviders((prev) =>
      prev.map((vp) =>
        vp.id === id
          ? { ...vp, policeVerified: true, available: true, permitExpiry: "2028-04-30", safetyScore: "Verified" }
          : vp
      )
    );
    appendLog("System Admin", "Driver Police-Verified", `Authorized operator ${id} into rural pool.`);
  };

  const toggleDisruption = (id: string, forceActive?: boolean) => {
    setDisruptions((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const nextState = forceActive !== undefined ? forceActive : !d.active;
        setScenario((s) => ({ ...s, disruptionActive: nextState }));
        setBuses((busList) =>
          busList.map((b, i) => (i === 0 ? { ...b, status: nextState ? "Cancelled" : "Full" } : b))
        );
        appendLog("Route Monitor", nextState ? "Disruption Activated" : "Route Cleared", d.corridorName);
        markStepCompleted(
          "step_disruption",
          nextState ? "Route Disruption Triggered" : "Route Restored",
          nextState ? `${d.cause} active; adaptive detour engaged.` : "Normal corridor restored."
        );
        return { ...d, active: nextState };
      })
    );
  };

  const triggerExamDayCrisis = (enable?: boolean) => {
    const activate = enable !== undefined ? enable : !scenario.examCrisisActive;
    if (activate) {
      // 1. Two government buses unavailable due to technical breakdown
      setBuses((busList) =>
        busList.map((b, i) =>
          i < 2 ? { ...b, status: "Cancelled", occupiedSeats: 0 } : b
        )
      );
      // 2. Flood road blockage activated
      setDisruptions((prev) => prev.map((d, i) => (i === 0 ? { ...d, active: true } : d)));
      // 3. +40% demand surge + 2h exam urgency
      setScenario((prev) => ({
        ...prev,
        disruptionActive: true,
        examCrisisActive: true,
        crisisReallocated: false,
        demandSurgePct: 40,
        brokenDownBusCount: 2,
      }));
      // Prioritize exam candidate onto fastest available pool van
      setPersonTrips((prev) =>
        prev.map((p, idx) =>
          idx === 0
            ? { ...p, examCandidate: true, examInMins: 85, selectedMode: "pool_van" }
            : p
        )
      );
      appendLog(
        "Crisis Engine",
        "Exam Day Crisis Activated",
        "2 govt buses broken down, +40% demand surge, flood road blockage active."
      );
      markStepCompleted(
        "step_disruption",
        "Exam Day Crisis Active",
        "2 buses down, +40% surge, flood blockage. Ready to reallocate fleet & prioritize <2h exam students."
      );
    } else {
      // Restore normal operations
      setBuses(selectedDistrict.buses);
      setDisruptions((prev) => prev.map((d) => ({ ...d, active: false })));
      setScenario((prev) => ({
        ...prev,
        disruptionActive: false,
        examCrisisActive: false,
        crisisReallocated: false,
        demandSurgePct: 0,
        brokenDownBusCount: 0,
        govtBusCount: 1,
        backupVansAvailable: 3,
        backupAutosAvailable: 2,
      }));
      appendLog("Crisis Engine", "Crisis Cleared", "Restored normal bus schedules and clear roads.");
    }
  };

  const reallocateCrisisFleet = () => {
    const primaryVillage = villages[0];
    const targetDest = scenario.institutionName || selectedDistrict.destinations[0];
    // Reallocate reserve/underused buses onto the blocked corridor via detour + open extra backup vans & autos
    setBuses((prev) =>
      prev.map((b, idx) =>
        idx >= 2 || prev.length <= 2
          ? {
              ...b,
              originVillageId: primaryVillage?.id ?? b.originVillageId,
              originName: primaryVillage?.name ?? b.originName,
              destinationName: targetDest,
              status: "On Time",
              occupiedSeats: 0,
              totalSeats: Math.max(b.totalSeats, 45),
            }
          : b
      )
    );
    setProviders((prev) =>
      prev.map((vp) => (vp.policeVerified ? { ...vp, available: true } : vp))
    );
    setScenario((prev) => ({
      ...prev,
      examCrisisActive: true,
      crisisReallocated: true,
      govtBusCount: Math.max(prev.govtBusCount, 2),
      backupVansAvailable: Math.max(prev.backupVansAvailable, 4),
      backupAutosAvailable: Math.max(prev.backupAutosAvailable, 4),
      journeyStage: "En Route to College",
    }));
    appendLog(
      "AI Crisis Reallocation",
      "Fleet Reallocated & Exam Priority Applied",
      `Dispatched reserve bus + 4 vans + 4 autos via flood detour; 100% <2h exam candidates prioritized.`
    );
    markStepCompleted(
      "step_authority",
      "Crisis Fleet Reallocated",
      "Reserve bus, detour vans, and rural autos deployed; exam students prioritized for on-time arrival."
    );
  };

  const redistributeBusToCorridor = (sourceBusId: string, targetVillageId: string) => {
    const targetVillage = villages.find((v) => v.id === targetVillageId) ?? villages[0];
    if (!targetVillage) return;
    setBuses((prev) =>
      prev.map((b) =>
        b.id === sourceBusId
          ? {
              ...b,
              originVillageId: targetVillage.id,
              originName: targetVillage.name,
              destinationName: targetVillage.primaryInstitution,
              status: "On Time",
              occupiedSeats: 0,
            }
          : b
      )
    );
    setScenario((prev) => ({ ...prev, govtBusCount: prev.govtBusCount + 1, appliedPlanSummary: undefined }));
    appendLog("Government Authority", "Bus Redistributed", `Reallocated bus to ${targetVillage.name}.`);
    markStepCompleted("step_authority", "Government Bus Redistributed", `Added bus to ${targetVillage.name}.`);
  };

  const toggleBusStatus = (busId: string) => {
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId
          ? {
              ...b,
              status: b.status === "Cancelled" ? "On Time" : "Cancelled",
              occupiedSeats: b.status === "Cancelled" ? Math.min(b.totalSeats, 28) : 0,
            }
          : b
      )
    );
    setScenario((prev) => ({ ...prev, appliedPlanSummary: undefined }));
    appendLog("Fleet Status", "Bus Availability Updated", `Toggled operational status for bus ${busId}.`);
  };

  const applyForecastSolutionToPool = (plan: ForecastSolutionPlan) => {
    const depotSlotsNeeded = plan.villagePlans.flatMap((vp) =>
      Array.from({ length: vp.depotBusesAdded }, () => vp)
    );

    const baseBuses = buses.filter((b) => !b.id.startsWith("depot-reserve-"));
    const depotBuses: GovernmentBus[] = depotSlotsNeeded.map((vp, idx) => {
      const matchedVillage = villages.find((v) => v.id === vp.villageId) ?? villages[0];
      return {
        id: `depot-reserve-${idx + 1}`,
        routeNumber: `KSRTC-RES-${idx + 1}`,
        registration: `KA-42-DEP-${101 + idx}`,
        originVillageId: matchedVillage?.id ?? vp.villageId,
        originName: matchedVillage?.name ?? vp.villageName,
        destinationName: vp.institutionName || scenario.institutionName,
        departureTime: "07:38 AM",
        expectedArrival: vp.eta.replace(" (+12m Detour)", ""),
        totalSeats: 40,
        occupiedSeats: 0,
        status: "On Time",
        driverName: `Depot Reserve Driver ${idx + 1}`,
        lowFloorAccessible: true,
        waypoints: matchedVillage?.pickupPoints.map((pp) => pp.coords) ?? [],
      };
    });

    const nextBuses = [...baseBuses, ...depotBuses];
    setBuses(nextBuses);

    const activeBuses = nextBuses.filter((b) => b.status !== "Cancelled");
    const totalGovtSeatsAfter = plan.confirmedGovtSeats + plan.additionalDepotBusesRecommended * 40;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setScenario((prev) => ({
      ...prev,
      totalStudents: plan.totalPredictedDemand,
      govtBusCount: Math.max(1, activeBuses.length),
      seatsPerGovtBus: Math.round(totalGovtSeatsAfter / Math.max(1, activeBuses.length)),
      backupVansAvailable: plan.totalVansUsed,
      seatsPerBackupVan: 12,
      backupAutosAvailable: plan.totalAutosUsed,
      seatsPerAuto: 4,
      examCrisisActive: plan.horizon === "crisis" ? true : prev.examCrisisActive,
      crisisReallocated: plan.horizon === "crisis" ? true : prev.crisisReallocated,
      appliedPlanSummary: {
        predictedDemand: plan.totalPredictedDemand,
        totalGovtSeats: totalGovtSeatsAfter,
        shortageBefore: plan.shortageBefore,
        vansUsed: plan.totalVansUsed,
        autosUsed: plan.totalAutosUsed,
        depotBusesAdded: plan.additionalDepotBusesRecommended,
        totalDailyCostInr: plan.totalDailyCostInr,
        estimatedArrivalWindow: plan.estimatedArrivalWindow,
        appliedAt: nowTime,
      },
    }));

    const detail = `Applied AI plan: ${plan.totalAccommodatedAfter}/${plan.totalPredictedDemand} accommodated (+${plan.additionalDepotBusesRecommended} depot bus, ${plan.totalVansUsed} vans, ${plan.totalAutosUsed} autos).`;
    appendLog("AI Forecast Solver", "Applied Solution to Mobility Pool", detail);
    markStepCompleted("step_authority", "AI Plan Applied to Pool", detail);
  };

  const notifyCollegeShortage = (plan: ForecastSolutionPlan) => {
    const notice = `Notice sent to ${scenario.institutionName}: Initial ${plan.shortageBefore}-seat shortage mitigated to ${plan.shortageAfter} (${plan.totalAccommodatedAfter}/${plan.totalPredictedDemand} students accommodated via +${plan.additionalDepotBusesRecommended} Depot Bus, ${plan.totalVansUsed} Vans, ${plan.totalAutosUsed} Autos). Exam Priority ${plan.examStudentsAccommodated}/${plan.examStudentsTotal} secured · ETA ${plan.estimatedArrivalWindow}.`;
    setScenario((prev) => ({
      ...prev,
      collegeNotified: true,
      collegeNoticeMessage: notice,
    }));
    appendLog("College Coordination", "Shortage & ETA Advisory Sent", notice);
    markStepCompleted("step_arrival", "College Notified of Allocation", notice);
  };

  const advanceJourneyStage = (stage: JourneyStage) => {
    setScenario((prev) => ({ ...prev, journeyStage: stage }));
    if (stage === "Arrived at Institution") {
      setJourneyHistory((prev) => [
        {
          id: `jh-${Date.now()}`,
          date: "Today · Live",
          studentName: "Kavya N.",
          mode: "Verified Backup Van",
          vehicleReg: providers[0]?.registration ?? "KA-42-T-4421",
          pickupPoint: villages[0]?.pickupPoints[0]?.name ?? "Village Stop",
          institution: scenario.institutionName,
          boardingTime: "07:42 AM",
          arrivalTime: "08:22 AM",
          guardianVerified: true,
          status: "Completed",
        },
        ...prev,
      ]);
      markStepCompleted("step_arrival", "Journey Completed", `Arrived safely at ${scenario.institutionName}.`);
    }
  };

  const notifyCollegeArrival = () => {
    const notice = `ETA sent to ${scenario.institutionName}: ${poolAllocation.collegeEtaSummary}.`;
    setScenario((prev) => ({ ...prev, collegeNotified: true, collegeNoticeMessage: notice }));
    appendLog("College Coordination", "Principal Notified", `Sent ETA to ${scenario.institutionName}.`);
    markStepCompleted("step_arrival", "College Notified", `Principal notified with live ETA.`);
  };

  const triggerEmergencySos = (studentName: string, location: string) => {
    const msg = `SOS Alert raised for ${studentName} near ${location}. Nearest Panchayat Desk & Guardian notified.`;
    setSosAlertMessage(msg);
    appendLog("Emergency SOS", "Safety Escalation", msg);
    markStepCompleted("step_disruption", "Emergency SOS Raised", msg);
  };

  const pushGuardianNotification = (
    title: string,
    detail: string,
    kind: GuardianSafetyNotification["kind"]
  ) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setGuardianNotifications((prev) => [
      { id: `gn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, timestamp: nowTime, title, detail, kind },
      ...prev.slice(0, 7),
    ]);
  };

  const toggleGuardianTrackingConsent = () => {
    setGuardianTrackingConsent((prev) => {
      const next = !prev;
      setWomenSafety((w) => ({
        ...w,
        guardianShareConsent: next,
        lastSharedAt: next ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Paused by student",
      }));
      appendLog(
        "Privacy Control",
        next ? "Guardian GPS Consent Enabled" : "Guardian GPS Consent Paused",
        next ? "Authorized guardian can view live trip location." : "Student paused live GPS sharing."
      );
      return next;
    });
  };

  const triggerSafetySos = (customLocation?: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const activeTrip = personTrips[0];
    const studentName = activeTrip?.personName || "Kavya N.";
    const locationName =
      customLocation ||
      poolAllocation.userAssignment?.fromPlace ||
      villages[0]?.pickupPoints[0]?.name ||
      villages[0]?.name ||
      selectedDistrict.name;
    const waypoints = buses[0]?.waypoints ?? [];
    const ptIdx = Math.min(
      Math.max(0, waypoints.length - 1),
      Math.floor((liveSim.busProgressPct / 100) * Math.max(1, waypoints.length))
    );
    const coords = waypoints[ptIdx] ?? villages[0]?.coords ?? selectedDistrict.center;
    const routeSummary = `${locationName} → ${poolAllocation.userAssignment?.toCollege || scenario.institutionName}`;

    const alertObj: SafetyEmergencyAlert = {
      id: `sos-${Date.now()}`,
      active: true,
      studentName,
      locationName,
      coords,
      vehicleReg: assignedSafetyDriver.vehicleReg,
      driverName: assignedSafetyDriver.driverName,
      driverPhoneMasked: assignedSafetyDriver.phoneMasked,
      routeSummary,
      status: "Alert Sent (Simulated)",
      triggeredAt: nowTime,
      notifiedContacts: [
        womenSafety.trustedGuardianName,
        `College Nodal Officer (${scenario.institutionName.split(",")[0]})`,
        "Women Helpline 181 & Patrol 112",
      ],
    };

    setEmergencyAlert(alertObj);
    setSosAlertMessage(
      `SOS ACTIVE: ${studentName} (${assignedSafetyDriver.vehicleReg} · ${assignedSafetyDriver.driverName}) at ${locationName}. Guardians & College Staff alerted.`
    );
    pushGuardianNotification(
      "URGENT SOS Alert Sent",
      `${studentName} near ${locationName} on ${assignedSafetyDriver.vehicleReg} (${assignedSafetyDriver.driverName}).`,
      "sos"
    );
    appendLog(
      "One-Tap SOS",
      "Emergency Alert Dispatched",
      `${studentName} · ${assignedSafetyDriver.vehicleReg} · ${locationName} · Guardians & College notified.`
    );
    markStepCompleted("step_disruption", "Emergency SOS Dispatched", `${studentName} alerted guardians & college.`);
  };

  const acknowledgeSafetySos = () => {
    setEmergencyAlert((prev) =>
      prev ? { ...prev, status: "Guardian & Nodal Acknowledged" } : null
    );
    appendLog("College Nodal Desk", "SOS Acknowledged", "Guardian & college safety desk confirmed live response.");
  };

  const clearSafetySos = () => {
    setEmergencyAlert(null);
    setSosAlertMessage(null);
    appendLog("Safety Resolution", "SOS Cleared", "Emergency alert marked safe and closed.");
  };

  const scanStudentQr = (
    action: "board" | "arrive",
    scannedVehicleReg?: string,
    scannedToken?: string
  ) => {
    const passKey = `${selectedDistrict.id}-${qrPass.studentName}-${qrPass.vehicleReg}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Prevent unauthorized token or wrong vehicle check-in
    if (scannedToken && scannedToken.trim() !== qrPass.qrToken) {
      setQrScanState((prev) => ({
        ...prev,
        passKey,
        scanGuardOk: false,
        scanGuardNotice: `Blocked unauthorized QR token (${scannedToken}). Expected ${qrPass.qrToken}.`,
      }));
      appendLog("QR Guard", "Unauthorized Scan Blocked", `Mismatched token ${scannedToken}.`);
      return;
    }

    if (scannedVehicleReg && scannedVehicleReg !== qrPass.vehicleReg) {
      setQrScanState((prev) => ({
        ...prev,
        passKey,
        scanGuardOk: false,
        scanGuardNotice: `Unauthorized vehicle (${scannedVehicleReg}). Assigned vehicle is ${qrPass.vehicleReg}.`,
      }));
      appendLog("QR Guard", "Vehicle Mismatch Blocked", `Attempted scan on ${scannedVehicleReg}; expected ${qrPass.vehicleReg}.`);
      return;
    }

    if (action === "board") {
      if (qrPass.boardedAt) {
        setQrScanState((prev) => ({
          ...prev,
          passKey,
          scanGuardOk: false,
          scanGuardNotice: `Duplicate boarding scan blocked — already scanned at ${qrPass.boardedAt}.`,
        }));
        return;
      }
      setQrScanState({
        passKey,
        boardedAt: nowTime,
        scanGuardOk: true,
        scanGuardNotice: `Boarded ${qrPass.vehicleReg} at ${nowTime}. Guardian auto-notified.`,
      });
      setStudentBoarded(true);
      setScenario((prev) => ({ ...prev, journeyStage: "Boarded Verified Vehicle" }));
      pushGuardianNotification(
        "QR Boarding Verified",
        `${qrPass.studentName} boarded ${qrPass.vehicleReg} (${assignedSafetyDriver.driverName}) at ${nowTime}.`,
        "boarding"
      );
      appendLog("QR Boarding", "Boarding Verified", `${qrPass.studentName} scanned onto ${qrPass.vehicleReg} at ${nowTime}.`);
      markStepCompleted("step_boarding", "QR Boarding Verified", `${qrPass.studentName} boarded ${qrPass.vehicleReg}.`);
      return;
    }

    // Arrival scan
    if (!qrPass.boardedAt) {
      setQrScanState((prev) => ({
        ...prev,
        passKey,
        scanGuardOk: false,
        scanGuardNotice: "Arrival scan blocked — student must complete boarding QR scan first.",
      }));
      return;
    }
    if (qrPass.arrivedAt) {
      setQrScanState((prev) => ({
        ...prev,
        passKey,
        scanGuardOk: false,
        scanGuardNotice: `Duplicate arrival scan blocked — arrived at ${qrPass.arrivedAt}.`,
      }));
      return;
    }

    setQrScanState((prev) => ({
      ...prev,
      passKey,
      arrivedAt: nowTime,
      scanGuardOk: true,
      scanGuardNotice: `Arrived at ${qrPass.collegeName} (${nowTime}). Guardian notified.`,
    }));
    advanceJourneyStage("Arrived at Institution");
    pushGuardianNotification(
      "Safe College Arrival",
      `${qrPass.studentName} reached ${qrPass.collegeName} at ${nowTime} via ${qrPass.vehicleReg}.`,
      "arrival"
    );
    appendLog("QR Arrival", "Campus Arrival Verified", `${qrPass.studentName} reached ${qrPass.collegeName} at ${nowTime}.`);
  };

  const toggleRoadHazard = (hazardId: string) => {
    if (hazardId === "haz-flood" && disruptions[0]) {
      toggleDisruption(disruptions[0].id);
      return;
    }
    const mapKey = hazardId === "haz-rain" ? "haz-rain" : "haz-accident";
    setHazardClearedIds((prev) => {
      const nextVal = !prev[mapKey];
      appendLog(
        "Hazard Monitor",
        nextVal ? "Hazard Cleared" : "Hazard Active",
        `${hazardId} marked ${nextVal ? "Cleared" : "Active"}.`
      );
      return { ...prev, [mapKey]: nextVal };
    });
  };

  const runAiHazardScan = () => {
    const activeList = roadHazards.filter((h) => h.status !== "Cleared");
    if (activeList.length === 0) {
      setAiHazardAdvice(`All ${selectedDistrict.name} corridors clear. Normal bus & van schedule safe.`);
      return;
    }
    const maxDelay = activeList.reduce((acc, h) => acc + h.estimatedDelayMins, 0);
    const primary = activeList[0];
    const msg = `AI Hazard Alert (${activeList.length} active): ${primary.title} at ${primary.location} (+${maxDelay}m total delay). Students & drivers advised: ${primary.recommendedDetour}.`;
    setAiHazardAdvice(msg);
    pushGuardianNotification("AI Route & Weather Advisory", msg, "hazard");
    appendLog("AI Hazard Engine", "Student & Driver Alerts Sent", msg);
  };

  const toggleWomenVerifiedPriority = () => {
    setWomenSafety((prev) => {
      const next = !prev.prioritizeVerifiedOnly;
      appendLog(
        "Women Safety",
        next ? "Verified-Only Priority Enabled" : "Standard Fleet Priority",
        next ? "Female riders restricted strictly to police-verified high-score drivers." : "Standard roster active."
      );
      return { ...prev, prioritizeVerifiedOnly: next };
    });
  };

  const toggleWomenTripShare = () => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setWomenSafety((prev) => {
      const nextConsent = !prev.guardianShareConsent;
      setGuardianTrackingConsent(nextConsent);
      if (nextConsent) {
        pushGuardianNotification(
          "Women Safety Live Share",
          `Active trip (${assignedSafetyDriver.vehicleReg} · ${assignedSafetyDriver.driverName}) shared with ${prev.trustedGuardianName}.`,
          "women_share"
        );
      }
      return {
        ...prev,
        guardianShareConsent: nextConsent,
        assistanceStatus: nextConsent ? "Live Companion Active" : "Standby",
        lastSharedAt: nextConsent ? nowTime : "Paused",
      };
    });
  };

  const requestWomenJourneyAssistance = () => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setWomenSafety((prev) => ({
      ...prev,
      guardianShareConsent: true,
      assistanceStatus: "Assistance Requested",
      lastSharedAt: nowTime,
    }));
    setGuardianTrackingConsent(true);
    pushGuardianNotification(
      "Women Journey Assistance Requested",
      `${qrPass.studentName} requested live safety escort check-in on ${assignedSafetyDriver.vehicleReg} (${assignedSafetyDriver.driverName}).`,
      "women_share"
    );
    appendLog(
      "Women Student Safety",
      "Journey Assistance Requested",
      `Safety check-in alerted for ${qrPass.studentName} on ${assignedSafetyDriver.vehicleReg}.`
    );
  };

  const confirmStudentBoarding = (pinInput: string) => {
    if (pinInput.trim() === boardingPin) {
      scanStudentQr("board", qrPass.vehicleReg, qrPass.qrToken);
      return true;
    }
    return false;
  };

  const importExternalDataset = (villagesInput: Village[], busesInput?: GovernmentBus[]) => {
    if (villagesInput.length > 0) setVillages(villagesInput);
    if (busesInput && busesInput.length > 0) setBuses(busesInput);
    appendLog("Dataset Adapter", "External Feed Applied", `Loaded ${villagesInput.length} villages.`);
  };

  const resetDemoScenario = () => {
    const d0 = DISTRICT_DATASETS[0];
    setSelectedDistrictId(d0.id);
    setVillages(d0.villages);
    setBuses(d0.buses);
    setProviders(d0.providers);
    setPersonTrips(buildDefaultPersonTrips(d0));
    setScenario(INITIAL_SCENARIO);
    setGuardianRequests(INITIAL_GUARDIAN_REQUESTS);
    setDisruptions(INITIAL_DISRUPTIONS);
    setStudentBoarded(false);
    setEmergencyAlert(null);
    setSosAlertMessage(null);
    setQrScanState({ passKey: "" });
    setHazardClearedIds({});
    setAiHazardAdvice(null);
    setGuardianTrackingConsent(true);
    setLiveSim(INITIAL_LIVE_SIM);
    setCoPilotMessages(INITIAL_COPILOT_MESSAGES);
    setDestinationArrival(null);
    void fetch("/api/state/reset", { method: "POST" }).catch(() => {});
  };

  // End the ride & trigger destination-reached popup whenever user's active traveling vehicle hits 100%
  useEffect(() => {
    const activeTrip = personTrips[0];
    const mode = activeTrip?.selectedMode ?? "govt_bus";
    const currentPct =
      mode === "govt_bus"
        ? liveSim.busProgressPct
        : mode === "pool_van"
        ? liveSim.vanProgressPct
        : liveSim.autoProgressPct;

    if (prevActivePctRef.current < 100 && currentPct >= 100) {
      const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const destName = activeTrip?.destination || scenario.institutionName;
      const personName = activeTrip?.personName || "Kavya N.";
      const distanceKm = activeTrip
        ? computeRouteDistanceKm(
            activeTrip,
            villages,
            buses,
            selectedDistrict.center,
            selectedDistrict.destinations,
            scenario.disruptionActive
          )
        : 15;
      const possibilitiesList = activeTrip ? getTransportPossibilities(activeTrip) : [];
      const activePoss = possibilitiesList.find((p) => p.mode === mode);
      const fareLabel = activePoss?.fareLabel ?? `₹${distanceKm * (mode === "govt_bus" ? 3 : mode === "pool_van" ? 5 : 10)}`;
      const vehicleLabel =
        activePoss?.vehicleLabel ||
        poolAllocation.userAssignment?.assignedVehicleLabel ||
        assignedSafetyDriver.vehicleReg;

      // End the ride cleanly: stop simulation & mark rideEnded
      setLiveSim((prev) => ({
        ...prev,
        running: false,
        rideEnded: true,
        busProgressPct: mode === "govt_bus" ? 100 : prev.busProgressPct,
        vanProgressPct: mode === "pool_van" ? 100 : prev.vanProgressPct,
        autoProgressPct: mode === "verified_auto" ? 100 : prev.autoProgressPct,
      }));

      setDestinationArrival({
        id: `arr-${Date.now()}`,
        personName,
        destination: destName,
        vehicleLabel,
        mode,
        distanceKm,
        fareLabel,
        arrivedAt: nowTime,
      });

      setScenario((prev) => ({ ...prev, journeyStage: "Arrived at Institution" }));
      setJourneyHistory((prev) => [
        {
          id: `jh-${Date.now()}`,
          date: `Today · ${nowTime}`,
          studentName: personName,
          mode: mode === "govt_bus" ? "Government Bus" : "Verified Backup Van",
          vehicleReg: vehicleLabel,
          pickupPoint: activePoss?.pickupPoint ?? villages[0]?.name ?? "Pickup Stop",
          institution: destName,
          boardingTime: activePoss?.departureTime ?? "07:35 AM",
          arrivalTime: nowTime,
          guardianVerified: true,
          status: "Completed",
        },
        ...prev,
      ]);
      pushGuardianNotification(
        "Ride Ended · Reached Destination",
        `${personName} reached ${destName} (${distanceKm} km · ${fareLabel}) via ${vehicleLabel} at ${nowTime}.`,
        "arrival"
      );
      markStepCompleted("step_arrival", "Ride Ended at Destination", `${personName} arrived at ${destName}.`);
    }
    prevActivePctRef.current = currentPct;
  }, [
    liveSim.busProgressPct,
    liveSim.vanProgressPct,
    liveSim.autoProgressPct,
    personTrips,
    scenario.institutionName,
    scenario.disruptionActive,
    poolAllocation.userAssignment,
    buses,
    villages,
    selectedDistrict,
    assignedSafetyDriver.vehicleReg,
    getTransportPossibilities,
    markStepCompleted,
  ]);

  const simulateReachDestination = () => {
    const activeTrip = personTrips[0];
    const mode = activeTrip?.selectedMode ?? "govt_bus";
    setLiveSim((prev) => ({
      ...prev,
      running: false,
      busProgressPct: mode === "govt_bus" ? 100 : prev.busProgressPct,
      vanProgressPct: mode === "pool_van" ? 100 : prev.vanProgressPct,
      autoProgressPct: mode === "verified_auto" ? 100 : prev.autoProgressPct,
    }));
  };

  const dismissDestinationArrival = () => {
    setDestinationArrival(null);
    setLiveSim((prev) => ({ ...prev, running: false, rideEnded: true }));
  };

  const startNewRide = () => {
    setDestinationArrival(null);
    prevActivePctRef.current = 0;
    setLiveSim((prev) => ({
      ...prev,
      running: true,
      rideEnded: false,
      busProgressPct: 12,
      vanProgressPct: 8,
      autoProgressPct: 18,
    }));
    setScenario((prev) => ({ ...prev, journeyStage: "En Route to College" }));
  };

  const sendCoPilotChat = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setCoPilotMessages((prev) => [
      ...prev.slice(-18),
      { id: `usr-${Date.now()}`, sender: "user", timestamp: nowLabel, text: trimmed },
    ]);
    setCoPilotLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          language,
          contextSnapshot: {
            district: selectedDistrict.name,
            personTrips,
            scenario,
            poolAllocation,
            completedSteps: liveSim.completedSteps,
            buses: buses.map((b) => ({
              route: b.routeNumber,
              reg: b.registration,
              to: b.destinationName,
              seats: `${b.occupiedSeats}/${b.totalSeats}`,
              status: b.status,
            })),
          },
        }),
      });
      const data = await res.json();
      const replyText = res.ok
        ? data.reply
        : `Offline summary (${selectedDistrict.name}): ${personTrips.length} person trips configured; ${poolAllocation.shortageCount} seat overflow covered by verified pool.`;
      setCoPilotMessages((prev) => [
        ...prev.slice(-18),
        { id: `bot-${Date.now()}`, sender: "assistant", timestamp: nowLabel, text: replyText },
      ]);
      speakIfEnabled(replyText);
    } catch {
      setCoPilotMessages((prev) => [
        ...prev.slice(-18),
        { id: `bot-${Date.now()}`, sender: "assistant", timestamp: nowLabel, text: "Offline coordination active." },
      ]);
    } finally {
      setCoPilotLoading(false);
    }
  };

  return (
    <MobilityContext.Provider
      value={{
        activePage,
        setActivePage,
        role,
        setRole,
        language,
        setLanguage,
        lowDataMode,
        setLowDataMode,
        assistantOpen,
        setAssistantOpen,
        districts: DISTRICT_DATASETS,
        selectedDistrict,
        selectDistrict,
        personTrips,
        addPersonTrip,
        updatePersonTrip,
        removePersonTrip,
        getTransportPossibilities,
        villages,
        buses,
        providers,
        guardianRequests,
        disruptions,
        journeyHistory,
        auditLogs,
        scenario,
        updateScenario,
        poolAllocation,
        approveGuardianRequest,
        toggleProviderAvailability,
        verifyProviderDriver,
        toggleDisruption,
        triggerExamDayCrisis,
        reallocateCrisisFleet,
        redistributeBusToCorridor,
        toggleBusStatus,
        applyForecastSolutionToPool,
        notifyCollegeShortage,
        advanceJourneyStage,
        notifyCollegeArrival,
        triggerEmergencySos,
        importExternalDataset,
        resetDemoScenario,
        boardingPin,
        studentBoarded,
        confirmStudentBoarding,
        sosAlertMessage,
        dismissSosAlert: () => setSosAlertMessage(null),
        liveSim,
        toggleLiveSimulation: () => setLiveSim((p) => ({ ...p, running: !p.running })),
        setLiveSpeed: (speed) => setLiveSim((p) => ({ ...p, speed })),
        toggleAutoReact: () => setLiveSim((p) => ({ ...p, autoReactEnabled: !p.autoReactEnabled })),
        toggleAutoSpeak: () => setLiveSim((p) => ({ ...p, autoSpeakEnabled: !p.autoSpeakEnabled })),
        coPilotMessages,
        coPilotLoading,
        sendCoPilotChat,
        markStepCompleted,
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
        destinationArrival,
        simulateReachDestination,
        dismissDestinationArrival,
        startNewRide,
      }}
    >
      {children}
    </MobilityContext.Provider>
  );
};

export function useMobility() {
  const ctx = useContext(MobilityContext);
  if (!ctx) throw new Error("useMobility must be used inside MobilityProvider");
  return ctx;
}
