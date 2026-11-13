export type Language = "en" | "kn" | "hi";

export type UserRole =
  | "student"
  | "parent"
  | "provider"
  | "authority"
  | "admin";

export type PageId =
  | "home"
  | "student"
  | "planner"
  | "pool"
  | "predictions"
  | "emergency"
  | "parent"
  | "provider"
  | "authority"
  | "admin";

export type JourneyStage =
  | "Pool Matched"
  | "Guardian Approval Pending"
  | "Guardian Approved"
  | "Boarded Verified Vehicle"
  | "En Route to College"
  | "Arrived at Institution";

export type LiveStepId =
  | "step_demand"
  | "step_pool"
  | "step_guardian"
  | "step_boarding"
  | "step_disruption"
  | "step_authority"
  | "step_arrival";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PickupPoint {
  id: string;
  villageId: string;
  name: string;
  landmark: string;
  coords: Coordinates;
  assignedStudents: number;
  accessibleShelter: boolean;
}

export interface Village {
  id: string;
  name: string;
  kannadaName: string;
  taluk: string;
  coords: Coordinates;
  dailyStudentDemand: number;
  predictedTomorrowDemand: number;
  examWeekDemand: number;
  pickupPoints: PickupPoint[];
  shortageRisk: "Low" | "Moderate" | "Critical";
  primaryInstitution: string;
}

export interface GovernmentBus {
  id: string;
  routeNumber: string;
  registration: string;
  originVillageId: string;
  originName: string;
  destinationName: string;
  departureTime: string;
  expectedArrival: string;
  totalSeats: number;
  occupiedSeats: number;
  status: "On Time" | "Delayed" | "Cancelled" | "Full";
  driverName: string;
  lowFloorAccessible: boolean;
  waypoints: Coordinates[];
}

export interface VerifiedProviderVehicle {
  id: string;
  operatorName: string;
  vehicleType: "Mini Shuttle Van" | "Authorized Tempo" | "Verified Rural Auto";
  registration: string;
  seatCapacity: number;
  available: boolean;
  policeVerified: boolean;
  permitExpiry: string;
  safetyScore: string;
  phoneMasked: string;
  baseVillageId: string;
  subsidizedFareInr: number;
  photoUrl?: string;
}

export interface DistrictDataset {
  id: string;
  name: string;
  kannadaName: string;
  center: Coordinates;
  destinations: string[];
  villages: Village[];
  buses: GovernmentBus[];
  providers: VerifiedProviderVehicle[];
}

export type TransportModeKey = "govt_bus" | "pool_van" | "verified_auto";

export interface PersonTripRequest {
  id: string;
  personName: string;
  gender?: "female" | "male";
  hasBusPass?: boolean;
  examCandidate?: boolean;
  examInMins?: number;
  isMinor: boolean;
  originVillageId: string;
  customFromAddress?: string;
  destination: string;
  selectedMode: TransportModeKey;
}

export interface TransportPossibility {
  mode: TransportModeKey;
  title: string;
  vehicleLabel: string;
  pickupPoint: string;
  departureTime: string;
  eta: string;
  fareLabel: string;
  fareRuleBadge?: string;
  distanceKm?: number;
  ratePerKmInr?: number;
  availabilityLabel: string;
  available: boolean;
  recommended: boolean;
  note: string;
}

export interface GuardianApprovalRequest {
  id: string;
  studentName: string;
  studentAge: number;
  institution: string;
  guardianName: string;
  pickupPointName: string;
  assignedVehicleReg: string;
  driverName: string;
  departureTime: string;
  estimatedArrival: string;
  fareInr: number;
  reason: string;
  status: "Pending" | "Approved" | "Declined";
  createdAt: string;
}

export interface RouteDisruption {
  id: string;
  corridorName: string;
  affectedBusId: string;
  cause: "Road Culvert Flooding" | "Landslide Clearance" | "Mechanical Breakdown" | "Driver Unavailable";
  severity: "High" | "Medium";
  active: boolean;
  blockedSegment: Coordinates[];
  detourRoute: Coordinates[];
  detourEtaDelayMins: number;
  alternatePickupName: string;
  affectedStudentsCount: number;
}

export interface JourneyHistoryRecord {
  id: string;
  date: string;
  studentName: string;
  mode: "Government Bus" | "Verified Backup Van";
  vehicleReg: string;
  pickupPoint: string;
  institution: string;
  boardingTime: string;
  arrivalTime: string;
  guardianVerified: boolean;
  status: "Completed" | "Active";
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: string;
  action: string;
  detail: string;
}

export interface ScenarioConfig {
  villageName: string;
  institutionName: string;
  totalStudents: number;
  govtBusCount: number;
  seatsPerGovtBus: number;
  backupVansAvailable: number;
  seatsPerBackupVan: number;
  backupAutosAvailable: number;
  seatsPerAuto: number;
  disruptionActive: boolean;
  examCrisisActive?: boolean;
  crisisReallocated?: boolean;
  demandSurgePct?: number;
  brokenDownBusCount?: number;
  journeyStage: JourneyStage;
  collegeNotified: boolean;
  collegeNoticeMessage?: string;
  appliedPlanSummary?: {
    predictedDemand: number;
    totalGovtSeats: number;
    shortageBefore: number;
    vansUsed: number;
    autosUsed: number;
    depotBusesAdded: number;
    totalDailyCostInr: number;
    estimatedArrivalWindow: string;
    appliedAt: string;
  };
}

export interface PoolAllocationResult {
  totalDemand: number;
  totalGovtSeats: number;
  govtSeatsAssigned: number;
  shortageCount: number;
  backupCapacityNeeded: number;
  backupVansDispatched: number;
  backupAutosDispatched: number;
  vanSeatsAllocated: number;
  autoSeatsAllocated: number;
  totalBackupSeatsAllocated: number;
  unaccommodatedStudents: number;
  examPriorityCount: number;
  examStudentsSecured: number;
  crisisActive: boolean;
  crisisReallocated: boolean;
  brokenDownBuses: number;
  demandSurgePct: number;
  onTimeRatePct: number;
  pickupClusters: Array<{
    pickupId: string;
    villageName: string;
    name: string;
    landmark: string;
    totalStudents: number;
    govtBusAssigned: number;
    vanAssigned: number;
    autoAssigned: number;
    backupPoolAssigned: number;
    assignedVehicle: string;
    pickupTime: string;
    estimatedArrival: string;
  }>;
  userAssignment?: {
    personName: string;
    fromPlace: string;
    toCollege: string;
    examPriority: boolean;
    requestedModeLabel: string;
    assignedVehicleLabel: string;
    fareLabel: string;
    pickupTime: string;
    estimatedArrival: string;
    statusNote: string;
  };
  collegeEtaSummary: string;
}

export interface CoPilotMessage {
  id: string;
  sender: "user" | "assistant" | "step-event";
  timestamp: string;
  text: string;
  suggestedPage?: PageId;
  suggestedActionLabel?: string;
}

export interface LiveSimulationState {
  running: boolean;
  speed: 1 | 5;
  busProgressPct: number;
  vanProgressPct: number;
  autoProgressPct: number;
  rideEnded?: boolean;
  completedSteps: LiveStepId[];
  autoReactEnabled: boolean;
  autoSpeakEnabled: boolean;
}

export interface DestinationArrivalNotice {
  id: string;
  personName: string;
  destination: string;
  vehicleLabel: string;
  mode: TransportModeKey;
  distanceKm: number;
  fareLabel: string;
  arrivedAt: string;
}

export interface VillageForecastAllocation {
  villageId: string;
  villageName: string;
  routeLabel: string;
  institutionName: string;
  predictedDemand: number;
  examStudents: number;
  confirmedBusSeats: number;
  shortageBefore: number;
  depotBusesAdded: number;
  vansAssigned: number;
  autosAssigned: number;
  totalCapacityAfter: number;
  studentsAccommodated: number;
  examStudentsAccommodated: number;
  shortageAfter: number;
  pickupSequence: string;
  eta: string;
  costInr: number;
  recommendationText: string;
}

export interface ForecastSolutionPlan {
  horizon: "tomorrow" | "market" | "exam" | "crisis";
  districtName: string;
  totalPredictedDemand: number;
  confirmedGovtSeats: number;
  confirmedBackupVans: number;
  confirmedBackupAutos: number;
  confirmedBackupSeats: number;
  shortageBefore: number;
  additionalDepotBusesRecommended: number;
  totalVansUsed: number;
  totalAutosUsed: number;
  additionalVansNeeded: number;
  additionalAutosNeeded: number;
  totalCapacityAfter: number;
  totalAccommodatedAfter: number;
  shortageAfter: number;
  shortageReductionPct: number;
  examStudentsTotal: number;
  examStudentsAccommodated: number;
  totalDailyCostInr: number;
  avgCostPerShiftedStudentInr: number;
  estimatedArrivalWindow: string;
  villagePlans: VillageForecastAllocation[];
}

export interface SafetyEmergencyAlert {
  id: string;
  active: boolean;
  studentName: string;
  locationName: string;
  coords: Coordinates;
  vehicleReg: string;
  driverName: string;
  driverPhoneMasked: string;
  routeSummary: string;
  status: "Alert Sent (Simulated)" | "Guardian & Nodal Acknowledged";
  triggeredAt: string;
  notifiedContacts: string[];
}

export interface SafetyQrPass {
  passId: string;
  qrToken: string;
  studentName: string;
  vehicleReg: string;
  routeLabel: string;
  pickupStop: string;
  collegeName: string;
  boardingStatus: "Not Boarded" | "Boarded" | "Arrived at College";
  boardedAt?: string;
  arrivedAt?: string;
  scanGuardNotice?: string;
  scanGuardOk?: boolean;
}

export interface RoadWeatherHazard {
  id: string;
  title: string;
  category: "Flooding" | "Heavy Rain" | "Accident" | "Roadblock";
  location: string;
  severity: "High" | "Moderate" | "Low";
  estimatedDelayMins: number;
  affectedRoutes: string[];
  recommendedDetour: string;
  status: "Active Alert" | "Monitoring" | "Cleared";
  sourceTag: "Simulated Sensor Feed";
}

export interface WomenSafetyProfile {
  prioritizeVerifiedOnly: boolean;
  guardianShareConsent: boolean;
  sharedTripLinkId: string;
  trustedGuardianName: string;
  trustedGuardianPhone: string;
  assistanceStatus: "Standby" | "Live Companion Active" | "Assistance Requested";
  lastSharedAt?: string;
}

export interface GuardianSafetyNotification {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  kind: "boarding" | "arrival" | "sos" | "women_share" | "hazard";
}

