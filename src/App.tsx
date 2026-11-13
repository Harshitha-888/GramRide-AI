import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MobilityProvider, useMobility } from "./context/MobilityContext";
import { AppShell } from "./components/AppShell";
import { GramRideLogo } from "./components/GramRideLogo";
import { TRANSLATIONS } from "./i18n/translations";
import { HomePage } from "./pages/HomePage";
import { RoutesView } from "./pages/RoutesView";
import { VillageMobilityPoolPage } from "./pages/VillageMobilityPoolPage";
import { ForecastAuthorityView } from "./pages/ForecastAuthorityView";
import { SafetyRolesView } from "./pages/SafetyRolesView";

const PageRouter: React.FC = () => {
  const { activePage } = useMobility();

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage />;
      case "planner":
      case "emergency":
        return <RoutesView />;
      case "pool":
        return <VillageMobilityPoolPage />;
      case "predictions":
      case "authority":
        return <ForecastAuthorityView />;
      case "student":
      case "parent":
      case "provider":
      case "admin":
        return <SafetyRolesView />;
      default:
        return <HomePage />;
    }
  };

  // Group transition key by top-level slide so switching between primary tabs animates smoothly
  const transitionKey =
    activePage === "home"
      ? "home"
      : activePage === "planner" || activePage === "emergency"
      ? "routes"
      : activePage === "pool"
      ? "pool"
      : activePage === "predictions" || activePage === "authority"
      ? "forecast"
      : "safety";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
};

const RootWithLogoIntro: React.FC = () => {
  const { language } = useMobility();
  const [showLogoIntro, setShowLogoIntro] = useState(true);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (!showLogoIntro) return;
    const timer = window.setTimeout(() => setShowLogoIntro(false), 1500);
    return () => window.clearTimeout(timer);
  }, [showLogoIntro]);

  return (
    <AnimatePresence mode="wait">
      {showLogoIntro ? (
        <motion.div
          key="gramride-logo-intro"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setShowLogoIntro(false)}
          className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50/70 px-6 cursor-pointer"
        >
          <div className="bg-transparent flex flex-col items-center gap-3">
            <GramRideLogo size="lg" brandName={t.brandName} />
            <p className="text-xs sm:text-sm font-medium text-slate-600 tracking-wide">
              {t.liveNetwork}
            </p>
            <button
              type="button"
              onClick={() => setShowLogoIntro(false)}
              className="mt-2 px-4 py-1.5 text-xs font-semibold text-[#0F2942] bg-white/80 hover:bg-white border border-emerald-200 rounded-lg transition-colors"
            >
              {t.home.startJourney} →
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="gramride-app-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          <AppShell>
            <PageRouter />
          </AppShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <MobilityProvider>
      <RootWithLogoIntro />
    </MobilityProvider>
  );
}
