import { Language } from "../types/mobility";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
};

export interface UITranslations {
  brandName: string;
  liveNetwork: string;
  liveAi: string;
  lowData: string;
  nav: {
    home: string;
    routes: string;
    pool: string;
    forecast: string;
    safety: string;
  };
  home: {
    badge: string;
    villages: string;
    campuses: string;
    title: string;
    subtitle: string;
    govtSeats: string;
    backupRides: string;
    districtSelector: string;
    startJourney: string;
    examCrisisMode: string;
    safetyPin: string;
  };
  routes: {
    routeOptions: string;
    emergencyDetour: string;
    person: string;
    aiCompare: string;
    thinking: string;
    enterName: string;
    fromPrefix: string;
    toPrefix: string;
    customAddress: string;
    womanFree: string;
    manPay: string;
    govtPass: string;
    examPriority: string;
    customFrom: string;
    simulateCrisis: string;
    clearCrisis: string;
    aiReallocate: string;
    floodDetour: string;
    restoreRoad: string;
    nextPool: string;
    govtBus: string;
    poolVan: string;
    ruralAuto: string;
    liveTracking: string;
    yourRide: string;
    reachedTitle: string;
    reachedSubtitle: string;
    reachDestBtn: string;
    okDismiss: string;
    enRoute: string;
    rideEnded: string;
    startNewRide: string;
  };
  pool: {
    headerSuffix: string;
    examCrisis: string;
    clearCrisis: string;
    reset: string;
    students: string;
    surge: string;
    busSeats: string;
    vans: string;
    autos: string;
    examLabel: string;
    govtBus: string;
    pickupsTitle: string;
    nextForecast: string;
  };
  forecast: {
    aiForecast: string;
    busRedist: string;
    tomorrow: string;
    market: string;
    exam: string;
    crisis: string;
    demandAdj: string;
    predicted: string;
    confBus: string;
    confFleet: string;
    shortage: string;
    generateAi: string;
    solving: string;
    applyToPool: string;
    notifyCollege: string;
    notified: string;
    openPool: string;
    aiSolution: string;
    nextSafety: string;
  };
  safety: {
    student: string;
    guardian: string;
    driver: string;
    admin: string;
    sos: string;
    womenSafe: string;
    liveGps: string;
    qrPass: string;
    hazards: string;
    womenHeader: string;
    verifiedOnlyOn: string;
    standard: string;
    voice: string;
    shareTrip: string;
    tripShared: string;
    journeyAssist: string;
    womenHelpline: string;
    police: string;
    consentOn: string;
    paused: string;
    board: string;
    arrive: string;
    testMismatch: string;
    verifyPin: string;
    alertRidersDrivers: string;
    hazardsTitle: string;
    hazardAlertsCount: string;
  };
}

export const TRANSLATIONS: Record<Language, UITranslations> = {
  en: {
    brandName: "GramRide AI",
    liveNetwork: "Live Rural Mobility Network",
    liveAi: "Live AI",
    lowData: "Low Data",
    nav: {
      home: "Home",
      routes: "Routes",
      pool: "Pool",
      forecast: "Forecast",
      safety: "Safety",
    },
    home: {
      badge: "Karnataka Rural Student Transit",
      villages: "Villages",
      campuses: "Campuses",
      title: "Smart Rural Student Mobility",
      subtitle: "Pick a district to coordinate buses, backup vans, and verified autos.",
      govtSeats: "Govt Seats",
      backupRides: "Backup Rides",
      districtSelector: "District Selector",
      startJourney: "Start Journey",
      examCrisisMode: "Exam Crisis Mode",
      safetyPin: "Safety PIN",
    },
    routes: {
      routeOptions: "Route Options",
      emergencyDetour: "Emergency Detour",
      person: "Person",
      aiCompare: "AI Compare",
      thinking: "Thinking...",
      enterName: "Enter your name",
      fromPrefix: "From",
      toPrefix: "To",
      customAddress: "+ Type Custom Address...",
      womanFree: "Woman (Aadhaar Free)",
      manPay: "Man (Pay / Pass)",
      govtPass: "Govt Pass",
      examPriority: "Exam < 2h Priority",
      customFrom: "+ Custom From",
      simulateCrisis: "Simulate Exam Crisis",
      clearCrisis: "Clear Exam Crisis",
      aiReallocate: "AI Reallocate Fleet",
      floodDetour: "Flood Detour Only",
      restoreRoad: "Restore Road",
      nextPool: "Next: Mobility Pool",
      govtBus: "Government Bus",
      poolVan: "Pooled Backup Van",
      ruralAuto: "Verified Rural Auto",
      liveTracking: "Live Tracking",
      yourRide: "Currently Traveling",
      reachedTitle: "Reached Destination!",
      reachedSubtitle: "You have safely arrived at",
      reachDestBtn: "Reach Dest",
      okDismiss: "OK, Got It",
      enRoute: "En Route",
      rideEnded: "Ride Ended",
      startNewRide: "Start New Ride",
    },
    pool: {
      headerSuffix: "Nearby Villages → Same College",
      examCrisis: "Exam Crisis",
      clearCrisis: "Clear Crisis",
      reset: "Reset",
      students: "Students",
      surge: "Surge (+40%)",
      busSeats: "Bus Seats",
      vans: "Vans (12)",
      autos: "Autos (4)",
      examLabel: "Exam <2h",
      govtBus: "Govt Bus",
      pickupsTitle: "Pickup Locations, Vehicle Assignments & ETA",
      nextForecast: "Next: AI Forecast",
    },
    forecast: {
      aiForecast: "AI Forecast",
      busRedist: "Bus Redistribution",
      tomorrow: "Tomorrow",
      market: "Market",
      exam: "Exam",
      crisis: "Crisis +40%",
      demandAdj: "Demand Adj:",
      predicted: "Predicted",
      confBus: "Conf. Bus",
      confFleet: "Conf. Fleet",
      shortage: "Shortage",
      generateAi: "Generate AI Solution",
      solving: "Solving...",
      applyToPool: "Apply to Mobility Pool",
      notifyCollege: "Notify College",
      notified: "Notified",
      openPool: "Open Pool →",
      aiSolution: "AI Solution",
      nextSafety: "Next: Safety",
    },
    safety: {
      student: "Student",
      guardian: "Guardian",
      driver: "Driver",
      admin: "Admin",
      sos: "SOS",
      womenSafe: "Women Safe",
      liveGps: "Live GPS",
      qrPass: "QR Pass",
      hazards: "Hazards",
      womenHeader: "Women Safety · Pre-Boarding Verification",
      verifiedOnlyOn: "Verified Only: ON",
      standard: "Standard",
      voice: "Voice",
      shareTrip: "Share Trip w/ Guardian",
      tripShared: "Live Trip Shared ✓",
      journeyAssist: "Journey Assistance",
      womenHelpline: "Women Helpline 181",
      police: "Police 112",
      consentOn: "Consent ON",
      paused: "Paused",
      board: "Board",
      arrive: "Arrive",
      testMismatch: "Test Mismatch",
      verifyPin: "Verify PIN",
      alertRidersDrivers: "Alert Riders & Drivers",
      hazardsTitle: "Road & Weather Alerts (Simulated Feed)",
      hazardAlertsCount: "Hazard Alerts",
    },
  },
  kn: {
    brandName: "ಗ್ರಾಮ್‌ರೈಡ್ AI",
    liveNetwork: "ನೇರ ಗ್ರಾಮೀಣ ಸಾರಿಗೆ ಜಾಲ",
    liveAi: "ಲೈವ್ AI",
    lowData: "ಕಡಿಮೆ ಡೇಟಾ",
    nav: {
      home: "ಮುಖಪುಟ",
      routes: "ಮಾರ್ಗಗಳು",
      pool: "ಪೂಲ್",
      forecast: "ಮುನ್ಸೂಚನೆ",
      safety: "ಸುರಕ್ಷತೆ",
    },
    home: {
      badge: "ಕರ್ನಾಟಕ ಗ್ರಾಮೀಣ ವಿದ್ಯಾರ್ಥಿ ಸಾರಿಗೆ",
      villages: "ಗ್ರಾಮಗಳು",
      campuses: "ಕಾಲೇಜುಗಳು",
      title: "ಸ್ಮಾರ್ಟ್ ಗ್ರಾಮೀಣ ವಿದ್ಯಾರ್ಥಿ ಸಾರಿಗೆ",
      subtitle: "ಬಸ್, ಬ್ಯಾಕಪ್ ವ್ಯಾನ್ ಮತ್ತು ಪರಿಶೀಲಿತ ಆಟೋಗಳನ್ನು ಸಂಯೋಜಿಸಲು ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      govtSeats: "ಸರ್ಕಾರಿ ಆಸನ",
      backupRides: "ಬದಲಿ ವಾಹನ",
      districtSelector: "ಜಿಲ್ಲೆ ಆಯ್ಕೆ",
      startJourney: "ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ",
      examCrisisMode: "ಪರೀಕ್ಷಾ ತುರ್ತು ಸ್ಥಿತಿ",
      safetyPin: "ಸುರಕ್ಷತೆ PIN",
    },
    routes: {
      routeOptions: "ಮಾರ್ಗ ಆಯ್ಕೆಗಳು",
      emergencyDetour: "ತುರ್ತು ಪರ್ಯಾಯ",
      person: "ವ್ಯಕ್ತಿ",
      aiCompare: "AI ಹೋಲಿಕೆ",
      thinking: "ಯೋಚಿಸುತ್ತಿದೆ...",
      enterName: "ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ",
      fromPrefix: "ಇಂದ",
      toPrefix: "ಗೆ",
      customAddress: "+ ಸ್ವಂತ ವಿಳಾಸ ಟೈಪ್ ಮಾಡಿ...",
      womanFree: "ಮಹಿಳೆ (ಆಧಾರ್ ಉಚಿತ)",
      manPay: "ಪುರುಷ (ಟಿಕೆಟ್ / ಪಾಸ್)",
      govtPass: "ಸರ್ಕಾರಿ ಪಾಸ್",
      examPriority: "ಪರೀಕ್ಷೆ <2ಗಂ ಆದ್ಯತೆ",
      customFrom: "+ ಸ್ವಂತ ಸ್ಥಳ",
      simulateCrisis: "ಪರೀಕ್ಷಾ ತುರ್ತು ಪರೀಕ್ಷಿಸಿ",
      clearCrisis: "ತುರ್ತು ಸ್ಥಿತಿ ತೆರವು",
      aiReallocate: "AI ವಾಹನ ಮರುಹಂಚಿಕೆ",
      floodDetour: "ಪ್ರವಾಹ ಪರ್ಯಾಯ ಮಾರ್ಗ",
      restoreRoad: "ರಸ್ತೆ ಮರುಸ್ಥಾಪಿಸಿ",
      nextPool: "ಮುಂದೆ: ಮೊಬಿಲಿಟಿ ಪೂಲ್",
      govtBus: "ಸರ್ಕಾರಿ ಬಸ್",
      poolVan: "ಪೂಲ್ ಬ್ಯಾಕಪ್ ವ್ಯಾನ್",
      ruralAuto: "ಪರಿಶೀಲಿತ ಗ್ರಾಮೀಣ ಆಟೋ",
      liveTracking: "ನೇರ ಟ್ರ್ಯಾಕಿಂಗ್",
      yourRide: "ಪ್ರಸ್ತುತ ಪ್ರಯಾಣ",
      reachedTitle: "ಗಮ್ಯಸ್ಥಾನ ತಲುಪಲಾಗಿದೆ!",
      reachedSubtitle: "ನೀವು ಸುರಕ್ಷಿತವಾಗಿ ತಲುಪಿದ್ದೀರಿ",
      reachDestBtn: "ತಲುಪಿದ ಸ್ಥಿತಿ",
      okDismiss: "ಸರಿ",
      enRoute: "ಮಾರ್ಗದಲ್ಲಿದೆ",
      rideEnded: "ಪ್ರಯಾಣ ಮುಕ್ತಾಯವಾಗಿದೆ",
      startNewRide: "ಹೊಸ ಪ್ರಯಾಣ",
    },
    pool: {
      headerSuffix: "ಹತ್ತಿರದ ಗ್ರಾಮಗಳು → ಒಂದೇ ಕಾಲೇಜು",
      examCrisis: "ಪರೀಕ್ಷಾ ತುರ್ತು",
      clearCrisis: "ತೆರವುಗೊಳಿಸಿ",
      reset: "ಮರುಹೊಂದಿಸಿ",
      students: "ವಿದ್ಯಾರ್ಥಿಗಳು",
      surge: "ಹೆಚ್ಚಳ (+40%)",
      busSeats: "ಬಸ್ ಆಸನ",
      vans: "ವ್ಯಾನ್ (12)",
      autos: "ಆಟೋ (4)",
      examLabel: "ಪರೀಕ್ಷೆ <2ಗಂ",
      govtBus: "ಸರ್ಕಾರಿ ಬಸ್",
      pickupsTitle: "ಪಿಕಪ್ ಸ್ಥಳಗಳು, ವಾಹನ ಹಂಚಿಕೆ ಮತ್ತು ETA",
      nextForecast: "ಮುಂದೆ: AI ಮುನ್ಸೂಚನೆ",
    },
    forecast: {
      aiForecast: "AI ಮುನ್ಸೂಚನೆ",
      busRedist: "ಬಸ್ ಮರುಹಂಚಿಕೆ",
      tomorrow: "ನಾಳೆ",
      market: "ಸಂತೆ ದಿನ",
      exam: "ಪರೀಕ್ಷೆ",
      crisis: "ತುರ್ತು +40%",
      demandAdj: "ಬೇಡಿಕೆ:",
      predicted: "ಅಂದಾಜು",
      confBus: "ದೃಢ ಬಸ್",
      confFleet: "ದೃಢ ವಾಹನ",
      shortage: "ಕೊರತೆ",
      generateAi: "AI ಪರಿಹಾರ ರಚಿಸಿ",
      solving: "ಲೆಕ್ಕಹಾಕುತ್ತಿದೆ...",
      applyToPool: "ಪೂಲ್‌ಗೆ ಅನ್ವಯಿಸಿ",
      notifyCollege: "ಕಾಲೇಜಿಗೆ ತಿಳಿಸಿ",
      notified: "ತಿಳಿಸಲಾಗಿದೆ",
      openPool: "ಪೂಲ್ ತೆರೆಯಿರಿ →",
      aiSolution: "AI ಪರಿಹಾರ",
      nextSafety: "ಮುಂದೆ: ಸುರಕ್ಷತೆ",
    },
    safety: {
      student: "ವಿದ್ಯಾರ್ಥಿ",
      guardian: "ಪೋಷಕರು",
      driver: "ಚಾಲಕ",
      admin: "ಆಡಳಿತ",
      sos: "SOS",
      womenSafe: "ಮಹಿಳಾ ಸುರಕ್ಷತೆ",
      liveGps: "ಲೈವ್ GPS",
      qrPass: "QR ಪಾಸ್",
      hazards: "ಅಪಾಯ ಎಚ್ಚರಿಕೆ",
      womenHeader: "ಮಹಿಳಾ ಸುರಕ್ಷತೆ · ಬೋರ್ಡಿಂಗ್ ಪೂರ್ವ ಪರಿಶೀಲನೆ",
      verifiedOnlyOn: "ಪರಿಶೀಲಿತ ಚಾಲಕರು: ON",
      standard: "ಸಾಮಾನ್ಯ",
      voice: "ಧ್ವನಿ",
      shareTrip: "ಪೋಷಕರೊಂದಿಗೆ ಹಂಚಿರಿ",
      tripShared: "ಲೈವ್ ಹಂಚಲಾಗಿದೆ ✓",
      journeyAssist: "ಪ್ರಯಾಣ ಸಹಾಯ",
      womenHelpline: "ಮಹಿಳಾ ಸಹಾಯವಾಣಿ 181",
      police: "ಪೊಲೀಸ್ 112",
      consentOn: "ಒಪ್ಪಿಗೆ ON",
      paused: "ವಿರಾಮ",
      board: "ಬೋರ್ಡ್",
      arrive: "ತಲುಪಿದೆ",
      testMismatch: "ತಪ್ಪು ವಾಹನ ಪರೀಕ್ಷೆ",
      verifyPin: "PIN ಪರಿಶೀಲಿಸಿ",
      alertRidersDrivers: "ಚಾಲಕರಿಗೆ ಎಚ್ಚರಿಕೆ ನೀಡಿ",
      hazardsTitle: "ರಸ್ತೆ ಮತ್ತು ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ",
      hazardAlertsCount: "ಎಚ್ಚರಿಕೆಗಳು",
    },
  },
  hi: {
    brandName: "ग्रामराइड AI",
    liveNetwork: "लाइव ग्रामीण परिवहन नेटवर्क",
    liveAi: "लाइव AI",
    lowData: "कम डेटा",
    nav: {
      home: "होम",
      routes: "मार्ग",
      pool: "पूल",
      forecast: "पूर्वानुमान",
      safety: "सुरक्षा",
    },
    home: {
      badge: "कर्नाटक ग्रामीण छात्र परिवहन नेटवर्क",
      villages: "गाँव",
      campuses: "कॉलेज",
      title: "स्मार्ट ग्रामीण छात्र परिवहन",
      subtitle: "बस, बैकअप वैन और सत्यापित ऑटो समन्वय के लिए अपना जिला चुनें।",
      govtSeats: "सरकारी सीटें",
      backupRides: "बैकअप वाहन",
      districtSelector: "जिला चुनें",
      startJourney: "यात्रा शुरू करें",
      examCrisisMode: "परीक्षा संकट मोड",
      safetyPin: "सुरक्षा PIN",
    },
    routes: {
      routeOptions: "मार्ग विकल्प",
      emergencyDetour: "आपातकालीन मार्ग",
      person: "व्यक्ति",
      aiCompare: "AI तुलना",
      thinking: "सोच रहा है...",
      enterName: "अपना नाम दर्ज करें",
      fromPrefix: "कहाँ से",
      toPrefix: "कहाँ तक",
      customAddress: "+ अपना पता लिखें...",
      womanFree: "महिला (आधार मुफ़्त)",
      manPay: "पुरुष (भुगतान / पास)",
      govtPass: "सरकारी पास",
      examPriority: "परीक्षा <2घं प्राथमिकता",
      customFrom: "+ कस्टम पता",
      simulateCrisis: "परीक्षा संकट चलाएं",
      clearCrisis: "संकट हटाएं",
      aiReallocate: "AI वाहन पुनर्वितरण",
      floodDetour: "बाढ़ वैकल्पिक मार्ग",
      restoreRoad: "मार्ग बहाल करें",
      nextPool: "आगे: मोबिलिटी पूल",
      govtBus: "सरकारी बस",
      poolVan: "पूल्ड बैकअप वैन",
      ruralAuto: "सत्यापित ग्रामीण ऑटो",
      liveTracking: "लाइव ट्रैकिंग",
      yourRide: "वर्तमान यात्रा",
      reachedTitle: "गंतव्य पर पहुँच गए!",
      reachedSubtitle: "आप सुरक्षित रूप से पहुँच गए हैं",
      reachDestBtn: "गंतव्य पहुँचें",
      okDismiss: "ठीक है",
      enRoute: "रास्ते में",
      rideEnded: "यात्रा समाप्त",
      startNewRide: "नई यात्रा शुरू करें",
    },
    pool: {
      headerSuffix: "पास के गाँव → एक ही कॉलेज",
      examCrisis: "परीक्षा संकट",
      clearCrisis: "संकट हटाएं",
      reset: "रीसेट",
      students: "छात्र",
      surge: "वृद्धि (+40%)",
      busSeats: "बस सीटें",
      vans: "वैन (12)",
      autos: "ऑटो (4)",
      examLabel: "परीक्षा <2घं",
      govtBus: "सरकारी बस",
      pickupsTitle: "पिकअप स्थान, वाहन आवंटन और ETA",
      nextForecast: "आगे: AI पूर्वानुमान",
    },
    forecast: {
      aiForecast: "AI पूर्वानुमान",
      busRedist: "बस पुनर्वितरण",
      tomorrow: "कल",
      market: "बाज़ार",
      exam: "परीक्षा",
      crisis: "संकट +40%",
      demandAdj: "मांग:",
      predicted: "अनुमानित",
      confBus: "पुष्ट बस",
      confFleet: "पुष्ट वाहन",
      shortage: "कमी",
      generateAi: "AI समाधान बनाएं",
      solving: "हल कर रहा है...",
      applyToPool: "पूल में लागू करें",
      notifyCollege: "कॉलेज को सूचित करें",
      notified: "सूचित",
      openPool: "पूल खोलें →",
      aiSolution: "AI समाधान",
      nextSafety: "आगे: सुरक्षा",
    },
    safety: {
      student: "छात्र",
      guardian: "अभिभावक",
      driver: "चालक",
      admin: "एडमिन",
      sos: "SOS",
      womenSafe: "महिला सुरक्षा",
      liveGps: "लाइव GPS",
      qrPass: "QR पास",
      hazards: "खतरा चेतावनी",
      womenHeader: "महिला सुरक्षा · बोर्डिंग पूर्व सत्यापन",
      verifiedOnlyOn: "सत्यापित चालक: ON",
      standard: "सामान्य",
      voice: "आवाज़",
      shareTrip: "अभिभावक से साझा करें",
      tripShared: "लाइव साझा ✓",
      journeyAssist: "यात्रा सहायता",
      womenHelpline: "महिला हेल्पलाइन 181",
      police: "पुलिस 112",
      consentOn: "सहमति ON",
      paused: "रुका",
      board: "बोर्ड",
      arrive: "पहुँचे",
      testMismatch: "गलत वाहन जांच",
      verifyPin: "PIN जांचें",
      alertRidersDrivers: "छात्रों व चालकों को चेतावनी",
      hazardsTitle: "सड़क और मौसम चेतावनी",
      hazardAlertsCount: "सक्रिय चेतावनी",
    },
  },
};
