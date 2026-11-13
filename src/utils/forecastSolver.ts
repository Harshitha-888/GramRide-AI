import {
  ForecastSolutionPlan,
  GovernmentBus,
  VerifiedProviderVehicle,
  Village,
  VillageForecastAllocation,
} from "../types/mobility";

export function computeForecastSolutionPlan(params: {
  districtName: string;
  villages: Village[];
  buses: GovernmentBus[];
  providers: VerifiedProviderVehicle[];
  horizon: "tomorrow" | "market" | "exam" | "crisis";
  disruptionActive: boolean;
  demandOverrideDelta?: number;
}): ForecastSolutionPlan {
  const {
    districtName,
    villages,
    buses,
    providers,
    horizon,
    disruptionActive,
    demandOverrideDelta = 0,
  } = params;

  const multiplier =
    horizon === "crisis" ? 1.4 : horizon === "exam" ? 1.28 : horizon === "market" ? 1.15 : 1;
  const examRatio = horizon === "exam" || horizon === "crisis" ? 0.42 : 0.25;

  const confirmedVansCount = providers.filter(
    (p) => p.policeVerified && p.available && p.vehicleType !== "Verified Rural Auto"
  ).length;
  const confirmedAutosCount = providers.filter(
    (p) => p.policeVerified && p.available && p.vehicleType === "Verified Rural Auto"
  ).length;
  const confirmedBackupSeats = confirmedVansCount * 12 + confirmedAutosCount * 4;

  // Track remaining confirmed partner vehicles as we allocate across villages
  let remainingConfirmedVans = confirmedVansCount;
  let remainingConfirmedAutos = confirmedAutosCount;

  // Prioritize villages with highest shortage & exam demand first
  const rawEntries = villages.map((v) => {
    const basePredicted = Math.round(v.predictedTomorrowDemand * multiplier);
    const predictedDemand = Math.max(10, basePredicted + demandOverrideDelta);
    const examStudents = Math.min(predictedDemand, Math.round(predictedDemand * examRatio));
    const activeVillageBuses = buses.filter(
      (b) => b.originVillageId === v.id && b.status !== "Cancelled"
    );
    const confirmedBusSeats = activeVillageBuses.reduce((acc, b) => acc + b.totalSeats, 0);
    const govtAccommodated = Math.min(predictedDemand, confirmedBusSeats);
    const shortageBefore = Math.max(0, predictedDemand - govtAccommodated);
    const routeLabel =
      activeVillageBuses[0]?.routeNumber ??
      buses.find((b) => b.originVillageId === v.id)?.routeNumber ??
      `${v.taluk} Corridor`;

    return {
      village: v,
      predictedDemand,
      examStudents,
      confirmedBusSeats,
      shortageBefore,
      routeLabel,
    };
  });

  // Sort by highest shortage descending so critical corridors receive confirmed resources first
  const sorted = [...rawEntries].sort((a, b) => b.shortageBefore - a.shortageBefore);

  const planByVillageId = new Map<string, VillageForecastAllocation>();

  for (const entry of sorted) {
    const { village, predictedDemand, examStudents, confirmedBusSeats, shortageBefore, routeLabel } =
      entry;

    let remaining = shortageBefore;
    let depotBusesAdded = 0;
    let vansAssigned = 0;
    let autosAssigned = 0;

    // 1. Recommend additional Government Bus (40 seats) from nearest depot for large shortages (>= 24)
    while (remaining >= 24) {
      depotBusesAdded += 1;
      remaining = Math.max(0, remaining - 40);
    }

    // 2. Allocate backup vans (12 seats each), preferring confirmed available vans first
    while (remaining > 4) {
      vansAssigned += 1;
      if (remainingConfirmedVans > 0) remainingConfirmedVans -= 1;
      remaining = Math.max(0, remaining - 12);
    }

    // 3. Allocate shared rural autos (4 seats each) for remaining small clusters (1-4 students)
    while (remaining > 0) {
      autosAssigned += 1;
      if (remainingConfirmedAutos > 0) remainingConfirmedAutos -= 1;
      remaining = Math.max(0, remaining - 4);
    }

    // Mathematical consistency invariant: accommodated NEVER exceeds totalCapacityAfter
    const totalCapacityAfter =
      confirmedBusSeats + depotBusesAdded * 40 + vansAssigned * 12 + autosAssigned * 4;
    const studentsAccommodated = Math.min(predictedDemand, totalCapacityAfter);
    const examStudentsAccommodated = Math.min(examStudents, studentsAccommodated);
    const shortageAfter = Math.max(0, predictedDemand - studentsAccommodated);

    // Exact passenger distribution across allocated vehicles (capped strictly by each vehicle's seats)
    const busAndDepotSeats = confirmedBusSeats + depotBusesAdded * 40;
    const afterBus = Math.max(0, studentsAccommodated - busAndDepotSeats);
    const vanPassengers = Math.min(afterBus, vansAssigned * 12);
    const afterVan = Math.max(0, afterBus - vanPassengers);
    const autoPassengers = Math.min(afterVan, autosAssigned * 4);
    const costInr = vanPassengers * 15 + autoPassengers * 20;

    const pickupNames = village.pickupPoints.map((pp) => pp.name.split(" ")[0]).join(" → ");
    const pickupSequence = pickupNames || village.name;
    const eta = disruptionActive ? "08:32 AM (+12m Detour)" : "08:18 AM";

    const parts: string[] = [];
    if (depotBusesAdded > 0) parts.push(`+${depotBusesAdded} Depot Bus`);
    if (vansAssigned > 0) parts.push(`${vansAssigned} Van${vansAssigned > 1 ? "s" : ""}`);
    if (autosAssigned > 0) parts.push(`${autosAssigned} Auto${autosAssigned > 1 ? "s" : ""}`);
    const recommendationText =
      shortageBefore === 0
        ? "Confirmed Govt Bus capacity sufficient."
        : `${parts.join(" + ")} · Exam priority (${examStudentsAccommodated}/${examStudents})`;

    planByVillageId.set(village.id, {
      villageId: village.id,
      villageName: village.name,
      routeLabel,
      institutionName: village.primaryInstitution,
      predictedDemand,
      examStudents,
      confirmedBusSeats,
      shortageBefore,
      depotBusesAdded,
      vansAssigned,
      autosAssigned,
      totalCapacityAfter,
      studentsAccommodated,
      examStudentsAccommodated,
      shortageAfter,
      pickupSequence,
      eta,
      costInr,
      recommendationText,
    });
  }

  // Preserve original village display order
  const villagePlans = villages
    .map((v) => planByVillageId.get(v.id)!)
    .filter(Boolean);

  const totalPredictedDemand = villagePlans.reduce((a, p) => a + p.predictedDemand, 0);
  const confirmedGovtSeats = villagePlans.reduce((a, p) => a + p.confirmedBusSeats, 0);
  const shortageBefore = villagePlans.reduce((a, p) => a + p.shortageBefore, 0);
  const additionalDepotBusesRecommended = villagePlans.reduce((a, p) => a + p.depotBusesAdded, 0);
  const totalVansUsed = villagePlans.reduce((a, p) => a + p.vansAssigned, 0);
  const totalAutosUsed = villagePlans.reduce((a, p) => a + p.autosAssigned, 0);
  const additionalVansNeeded = Math.max(0, totalVansUsed - confirmedVansCount);
  const additionalAutosNeeded = Math.max(0, totalAutosUsed - confirmedAutosCount);
  const totalCapacityAfter = villagePlans.reduce((a, p) => a + p.totalCapacityAfter, 0);
  const totalAccommodatedAfter = villagePlans.reduce((a, p) => a + p.studentsAccommodated, 0);
  const shortageAfter = villagePlans.reduce((a, p) => a + p.shortageAfter, 0);
  const shortageReductionPct =
    shortageBefore > 0
      ? Math.round(((shortageBefore - shortageAfter) / shortageBefore) * 100)
      : 100;
  const examStudentsTotal = villagePlans.reduce((a, p) => a + p.examStudents, 0);
  const examStudentsAccommodated = villagePlans.reduce(
    (a, p) => a + p.examStudentsAccommodated,
    0
  );
  const totalDailyCostInr = villagePlans.reduce((a, p) => a + p.costInr, 0);
  const shiftedCount = Math.max(0, totalAccommodatedAfter - confirmedGovtSeats - additionalDepotBusesRecommended * 40);
  const avgCostPerShiftedStudentInr =
    shiftedCount > 0 ? Math.round(totalDailyCostInr / shiftedCount) : 0;

  return {
    horizon,
    districtName,
    totalPredictedDemand,
    confirmedGovtSeats,
    confirmedBackupVans: confirmedVansCount,
    confirmedBackupAutos: confirmedAutosCount,
    confirmedBackupSeats,
    shortageBefore,
    additionalDepotBusesRecommended,
    totalVansUsed,
    totalAutosUsed,
    additionalVansNeeded,
    additionalAutosNeeded,
    totalCapacityAfter,
    totalAccommodatedAfter,
    shortageAfter,
    shortageReductionPct,
    examStudentsTotal,
    examStudentsAccommodated,
    totalDailyCostInr,
    avgCostPerShiftedStudentInr,
    estimatedArrivalWindow: disruptionActive ? "08:25 – 08:36 AM (Detour)" : "08:15 – 08:24 AM",
    villagePlans,
  };
}
