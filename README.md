#prompt   
Build GramRide AI, a light-themed, responsive web application for rural student mobility, multi-modal route planning, village ride pooling, AI shortage resolution, and student/women safety across all 31 districts of Karnataka.
1. Tech Stack & Architecture
Frontend: React + TypeScript + Tailwind CSS v4 + Lucide icons + Motion animations + Leaflet interactive maps.
Backend & AI: Express server (server.ts) mounting Vite in development and exposing server-side Gemini AI endpoints (/api/ai/plan-journey, /api/ai/predict, /api/ai/copilot) using @google/genai (with graceful offline/deterministic fallbacks).
Multilingual Support (en, kn, hi): Header language switcher dynamically translates navigation, labels, titles, and controls across English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी).
2. Brand Identity, Launch Intro & App Shell
Custom Logo (GramRideLogo): Minimal transparent-background SVG icon combining a dark-blue (#0F2942) location pin, front-facing bus cabin, and emerald-green (#059669 / #10B981) dashed road with clean bold typography (GramRide AI).
Launch Intro Screen: Displays the GramRide AI logo and tagline for 1.5 seconds (or click/button to enter immediately) before transitioning into the main app shell.
Top Header & Navigation:
GramRide AI logo button (returns to Home), current district switcher dropdown, Low Data mode toggle, Language selector (English, ಕನ್ನಡ, हिन्दी), and slide-out Live AI Co-Pilot assistant drawer.
5 primary navigation tabs: Home, Routes, Pool, Forecast, and Safety.
3. Karnataka Coverage (All 31 Districts)
Include all 31 districts of Karnataka (Ramanagara as default, plus Bagalkot, Ballari, Belagavi, Bengaluru Rural, Bengaluru Urban, Bidar, Chamarajanagar, Chikkaballapura, Chikkamagaluru, Chitradurga, Dakshina Kannada, Davanagere, Dharwad, Gadag, Haveri, Kalaburagi, Kodagu, Kolar, Koppal, Mandya, Mysuru, Raichur, Shivamogga, Tumakuru, Udupi, Uttara Kannada, Vijayanagara, Vijayapura, and Yadgir).
Each district provides coordinates, Kannada district name, regional colleges/campuses, rural village clusters with pickup stops, regional RTC buses (KSRTC / NWKRTC / KKRTC / BMTC) with RTO numbers, and police-verified backup vans and rural autos.
4. Pages & Core Features
Home (HomePage):
Compact hero card with transit photo (hidden when Low Data mode is on), topic badge (Karnataka Rural Student Transit), title/subtitle, prominent 31-District Selector, primary Start Journey CTA, and quick shortcuts to Pool, Exam Crisis Mode, and Safety PIN.
Routes & Live Tracking (RoutesView + RouteMap):
Route Options & Emergency Detour tabs; support adding multiple student/person trips.
Per-Trip Controls: Rider name, From (district village clusters, pickup stops, or + Custom From address), To (district colleges/destinations), traveler category (Woman (Aadhaar Free) vs Man (Pay / Pass)), Govt Pass toggle, Exam < 2h Priority toggle, and AI Compare button.
Distance-Based Dynamic Fares: Calculate Haversine-derived road distance (From → To, +3 km when flood detour is active) and dynamically update fare across all 3 transport modes:
Govt Bus: ₹3/km (₹0 / Free for women with Aadhaar or valid Govt Pass).
Mini Shuttle Van: ₹5/km.
Verified Rural Auto: ₹10/km.
Interactive Leaflet Live Map & Simulation:
Track active buses, backup shuttle van, and rural auto live along route waypoints with 1x / 5x speed toggle and manual Reach Dest button.
Automatically stop simulation (rideEnded: true, 100% progress, Ride Ended) and display a Reached Destination! modal popup showing rider, vehicle, pickup → destination, distance, and fare, with Start New Ride / dismiss actions.
Emergency Detour Tab: Toggle Simulate Exam Crisis, AI Reallocate Fleet, and Flood Detour Only.
Village Mobility Pool (VillageMobilityPoolPage):
Synced district destination selector, Exam Crisis simulation & AI Reallocate Fleet controls, and live active trip assignment banner.
Interactive demand/fleet adjustments (student count, surge %, bus seats, vans [12 seats], autos [4 seats], exam <2h priority count).
Displays Govt Bus vs pooled pickup points, vehicle allocation, pickup times, and ETAs.
AI Forecast & Bus Redistribution (ForecastAuthorityView):
AI Forecast and Bus Redistribution tabs with horizon selectors (Tomorrow, Market Day, Exam Day, Crisis +40%) and demand adjustment controls (+/-).
Mathematically consistent deterministic solver (computeForecastSolutionPlan) that automatically recalculates whenever demand or vehicle availability changes—never assigning more students than confirmed vehicle capacity, clearly separating Predicted Demand from Confirmed Bus / Fleet Availability, and prioritizing exam candidates.
Outputs village-wise shortage reduction, before-and-after comparisons, recommended additional depot buses, backup vans & rural autos, optimized pickup routes, ETAs, and daily transportation cost.
Interactive actions: Generate AI Solution (calls /api/ai/predict), Apply to Mobility Pool, and Notify College.
Compact AI Solution summary card positioned cleanly at the bottom without forcing vertical clutter.
Intelligent Student & Women Safety (SafetyRolesView):
Role views (Student, Guardian, Driver, Admin) plus persistent 181 Helpline link and One-Tap SOS button (sends alert with location, assigned vehicle registration, driver details, emergency contacts, and status tracking: Active / Acknowledged / Cleared).
Women Student Safety (Default View): Prioritizes police-verified drivers/vehicles, shows verified driver profile & vehicle details pre-boarding, one-tap Share Trip w/ Guardian, Journey Assistance request, and quick access to 181 & 112.
Live Vehicle Tracking: Consent-gated live GPS map with trip progress, pickup point, ETA, and automatic guardian boarding/arrival notifications.
QR-Based Boarding Verification: Unique per-student/trip QR code (QrCodeMatrix), driver/staff scan simulation for Board and Arrive, duplicate-scan & mismatched-vehicle prevention, plus guardian PIN boarding verification and CSV export.
AI Road Hazard, Accident & Weather Alerts: Simulated roadblock/flood/heavy-rainfall alert feed with severity, delay estimate, safer alternative route recommendations, and Alert Riders & Drivers toggle.
