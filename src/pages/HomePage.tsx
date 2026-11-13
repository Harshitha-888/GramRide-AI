import React from "react";
import { AlertTriangle, ArrowRight, ChevronDown, Compass, MapPin, ShieldCheck, Users } from "lucide-react";
import { useMobility } from "../context/MobilityContext";
import { HERO_TRANSIT_IMAGE } from "../data/initialMobilityData";
import { TRANSLATIONS } from "../i18n/translations";

export const HomePage: React.FC = () => {
  const {
    setActivePage,
    districts,
    selectedDistrict,
    selectDistrict,
    villages,
    buses,
    providers,
    lowDataMode,
    markStepCompleted,
    scenario,
    triggerExamDayCrisis,
    language,
  } = useMobility();

  const t = TRANSLATIONS[language];

  const freeSeats = buses
    .filter((b) => b.status !== "Cancelled")
    .reduce((acc, b) => acc + Math.max(0, b.totalSeats - b.occupiedSeats), 0);

  const verifiedCount = providers.filter((p) => p.policeVerified && p.available).length;

  const handleStartJourney = () => {
    markStepCompleted(
      "step_demand",
      `Selected ${selectedDistrict.name}`,
      `${freeSeats} govt bus seats and ${verifiedCount} verified backup vehicles active across ${villages.length} villages.`
    );
    setActivePage("planner");
  };

  const handleLaunchExamCrisis = () => {
    triggerExamDayCrisis(true);
    setActivePage("emergency");
  };

  return (
    <div className="h-full flex flex-col justify-center max-w-xl mx-auto">
      <div className="bg-white/95 border border-sky-100 rounded-2xl overflow-hidden shadow-xs">
        {/* Compact Light Visual Header */}
        {!lowDataMode && (
          <div className="relative h-24 sm:h-36 w-full overflow-hidden bg-sky-50">
            <img
              src={HERO_TRANSIT_IMAGE}
              alt="Rural students boarding verified village mobility transit"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/35 to-transparent" />
            <div className="absolute bottom-2 left-3.5 right-3.5 flex items-end justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-900 bg-white/90 px-2 py-0.5 rounded-md border border-sky-100">
                {t.home.badge}
              </span>
            </div>
          </div>
        )}

        {/* Minimalist Main Content */}
        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
              {t.home.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.home.subtitle}
            </p>
          </div>

          {/* Prominent District Selector Dropdown */}
          <div className="space-y-1">
            <label
              htmlFor="home-district-selector"
              className="block text-[11px] font-bold uppercase tracking-wider text-teal-900"
            >
              {t.home.districtSelector}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-teal-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="home-district-selector"
                value={selectedDistrict.id}
                onChange={(e) => selectDistrict(e.target.value)}
                className="w-full min-h-[48px] pl-10 pr-10 py-2.5 bg-sky-50/70 hover:bg-sky-50 border-2 border-sky-200 focus:border-teal-700 rounded-xl text-sm sm:text-base font-bold text-slate-900 appearance-none cursor-pointer transition-colors"
              >
                {districts.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {language === "kn" ? dist.kannadaName : dist.name} ({dist.destinations.length} {t.home.campuses})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-teal-800 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Primary Start Journey Action */}
          <button
            onClick={handleStartJourney}
            className="w-full min-h-[48px] px-5 py-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-sm sm:text-base font-bold rounded-xl inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Compass className="w-4 h-4" />
            {t.home.startJourney}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Compact Secondary Shortcuts */}
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-semibold">
            <button
              onClick={() => setActivePage("pool")}
              className="py-1 text-teal-800 inline-flex items-center gap-1 hover:underline"
            >
              <Users className="w-3.5 h-3.5" /> {t.nav.pool}
            </button>
            <button
              onClick={handleLaunchExamCrisis}
              className={`py-1 inline-flex items-center gap-1 hover:underline ${
                scenario.examCrisisActive ? "text-red-700" : "text-amber-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> {t.home.examCrisisMode}
            </button>
            <button
              onClick={() => setActivePage("student")}
              className="py-1 text-teal-800 inline-flex items-center gap-1 hover:underline"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> {t.home.safetyPin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
