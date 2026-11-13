import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Coordinates, GovernmentBus, RouteDisruption, TransportModeKey, Village } from "../types/mobility";
import { useMobility } from "../context/MobilityContext";

interface RouteMapProps {
  villages: Village[];
  buses: GovernmentBus[];
  disruption?: RouteDisruption;
  heightClass?: string;
  focusVillageId?: string;
  activeMode?: TransportModeKey;
  customFromLabel?: string;
  activeVehicleLabel?: string;
  onSimulateArrival?: () => void;
  onStartNewRide?: () => void;
  reachDestLabel?: string;
  rideEndedLabel?: string;
  startNewRideLabel?: string;
}

function interpolateAlongPath(points: Coordinates[], pct: number): Coordinates | null {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];
  const clamped = Math.max(0, Math.min(100, pct)) / 100;
  const totalSegments = points.length - 1;
  const scaled = clamped * totalSegments;
  const idx = Math.min(totalSegments - 1, Math.floor(scaled));
  const localT = scaled - idx;
  const a = points[idx];
  const b = points[idx + 1];
  return {
    lat: a.lat + (b.lat - a.lat) * localT,
    lng: a.lng + (b.lng - a.lng) * localT,
  };
}

function createVehicleIcon(type: "bus" | "van" | "auto", highlighted: boolean, cancelled = false): L.DivIcon {
  const bg =
    type === "bus"
      ? cancelled
        ? "#DC2626"
        : "#0F766E"
      : type === "van"
      ? "#D97706"
      : "#0284C7";
  const ring = highlighted ? "0 0 0 3px #FFFFFF, 0 3px 8px rgba(15,23,42,0.4)" : "0 2px 5px rgba(15,23,42,0.32)";
  const size = highlighted ? 32 : 26;

  const svgSymbol =
    type === "bus"
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`
      : type === "van"
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15h14l2-4-3-5H7L4 11v4Z"/><path d="M9 6v5"/><path d="M14 6v5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;

  return L.divIcon({
    className: "gramride-vehicle-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:2px solid #ffffff;box-shadow:${ring};display:flex;align-items:center;justify-content:center;">${svgSymbol}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createMapPinIcon(kind: "destination" | "stop"): L.DivIcon {
  if (kind === "destination") {
    return L.divIcon({
      className: "gramride-dest-pin",
      html: `<svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.82 20.18 0 13 0Z" fill="#EA4335"/><circle cx="13" cy="13" r="5" fill="#FFFFFF"/></svg>`,
      iconSize: [26, 34],
      iconAnchor: [13, 34],
      popupAnchor: [0, -30],
    });
  }
  return L.divIcon({
    className: "gramride-stop-pin",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#FFFFFF;border:3px solid #1A73E8;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export const RouteMap: React.FC<RouteMapProps> = ({
  villages,
  buses,
  disruption,
  heightClass = "h-[230px] sm:h-[268px]",
  focusVillageId,
  activeMode = "govt_bus",
  customFromLabel,
  activeVehicleLabel,
  onSimulateArrival,
  onStartNewRide,
  reachDestLabel = "Reach Dest",
  rideEndedLabel = "Ride Ended",
  startNewRideLabel = "Start New Ride",
}) => {
  const { lowDataMode, liveSim, setLiveSpeed, selectedDistrict, scenario } = useMobility();
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vehicleLayerRef = useRef<L.LayerGroup | null>(null);

  const isDisrupted = Boolean(disruption?.active || scenario.disruptionActive);
  const primaryWaypoints = buses[0]?.waypoints ?? [];
  const activeDetourCoords: Coordinates[] =
    selectedDistrict.id === "dist-ramanagara" && (disruption?.detourRoute?.length ?? 0) >= 2
      ? disruption!.detourRoute
      : primaryWaypoints.length >= 2
      ? [
          primaryWaypoints[0],
          {
            lat: (primaryWaypoints[0].lat + primaryWaypoints[primaryWaypoints.length - 1].lat) / 2 + 0.025,
            lng: (primaryWaypoints[0].lng + primaryWaypoints[primaryWaypoints.length - 1].lng) / 2 + 0.028,
          },
          primaryWaypoints[primaryWaypoints.length - 1],
        ]
      : [];
  const activeBlockedCoords: Coordinates[] =
    selectedDistrict.id === "dist-ramanagara" && (disruption?.blockedSegment?.length ?? 0) >= 2
      ? disruption!.blockedSegment
      : primaryWaypoints.length >= 2
      ? primaryWaypoints.slice(0, Math.min(2, primaryWaypoints.length))
      : [];

  useEffect(() => {
    if (lowDataMode) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        vehicleLayerRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      vehicleLayerRef.current = null;
    }

    const focusVillage =
      villages.find((v) => v.id === focusVillageId) ??
      villages.find((v) => v.pickupPoints.some((pp) => pp.id === focusVillageId));
    const focusPickup = villages.flatMap((v) => v.pickupPoints).find((pp) => pp.id === focusVillageId);

    const centerLat = focusPickup?.coords.lat ?? focusVillage?.coords.lat ?? selectedDistrict.center.lat;
    const centerLng = focusPickup?.coords.lng ?? focusVillage?.coords.lng ?? selectedDistrict.center.lng;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 11,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: false,
    });

    const tileUrl =
      mapStyle === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

    const allPoints: [number, number][] = [];

    // Draw clean Maps-style navigation route lines and red destination drop-pins
    buses.forEach((bus, idx) => {
      if (bus.waypoints.length < 2) return;
      const latlngs = bus.waypoints.map((w) => [w.lat, w.lng] as [number, number]);
      latlngs.forEach((pt) => allPoints.push(pt));
      const isCancelled = bus.status === "Cancelled";

      L.polyline(latlngs, {
        color: isCancelled ? "#64748B" : "#174EA6",
        weight: 6.5,
        opacity: 0.9,
      }).addTo(map);

      L.polyline(latlngs, {
        color: isCancelled ? "#CBD5E1" : idx === 0 ? "#1A73E8" : "#4285F4",
        weight: 4,
        dashArray: isCancelled ? "6 6" : undefined,
        opacity: 1,
      }).addTo(map);

      const dest = bus.waypoints[bus.waypoints.length - 1];
      L.marker([dest.lat, dest.lng], { icon: createMapPinIcon("destination") })
        .bindPopup(`<strong>${bus.destinationName}</strong><br/>${bus.routeNumber}`)
        .addTo(map);
    });

    villages.forEach((village) => {
      village.pickupPoints.forEach((pp) => {
        allPoints.push([pp.coords.lat, pp.coords.lng]);
        L.marker([pp.coords.lat, pp.coords.lng], {
          icon: createMapPinIcon("stop"),
        })
          .bindPopup(`<strong>${pp.name}</strong><br/>${pp.landmark}`)
          .addTo(map);
      });
    });

    if (isDisrupted && activeBlockedCoords.length >= 2) {
      L.polyline(
        activeBlockedCoords.map((c) => [c.lat, c.lng] as [number, number]),
        { color: "#EA4335", weight: 5, dashArray: "7 5" }
      )
        .bindPopup("<strong>Road Flood Blockage</strong>")
        .addTo(map);
    }
    if (isDisrupted && activeDetourCoords.length >= 2) {
      L.polyline(
        activeDetourCoords.map((c) => [c.lat, c.lng] as [number, number]),
        { color: "#34A853", weight: 4.5 }
      )
        .bindPopup("<strong>Alternative Detour Corridor</strong>")
        .addTo(map);
    }

    if (allPoints.length >= 2) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [26, 26], maxZoom: 12 });
    }

    const vLayer = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    vehicleLayerRef.current = vLayer;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        vehicleLayerRef.current = null;
      }
    };
  }, [lowDataMode, villages, buses, disruption, focusVillageId, selectedDistrict, mapStyle, isDisrupted]);

  useEffect(() => {
    if (lowDataMode || !vehicleLayerRef.current) return;
    const layer = vehicleLayerRef.current;
    layer.clearLayers();

    const primaryBus = buses[0];
    const secondaryBus = buses[1] ?? primaryBus;

    // Plot ALL active buses along their routes so multiple buses are live-tracked
    buses.forEach((bus, idx) => {
      if (bus.waypoints.length < 2) return;
      const pct = idx === 0 ? liveSim.busProgressPct : (liveSim.busProgressPct + idx * 24) % 100;
      const busCoord = interpolateAlongPath(bus.waypoints, pct);
      if (!busCoord) return;
      const isUserBus = activeMode === "govt_bus" && idx === 0;
      L.marker([busCoord.lat, busCoord.lng], {
        icon: createVehicleIcon("bus", isUserBus, bus.status === "Cancelled"),
      })
        .bindTooltip(
          bus.status === "Cancelled"
            ? `Breakdown · ${bus.routeNumber}`
            : `${isUserBus ? "YOU · " : ""}Bus ${bus.routeNumber} (${Math.round(pct)}%)`
        )
        .addTo(layer);
    });

    const vanPath =
      isDisrupted && activeDetourCoords.length >= 2
        ? activeDetourCoords
        : primaryBus?.waypoints ?? [];
    if (vanPath.length >= 2) {
      const vanCoord = interpolateAlongPath(vanPath, liveSim.vanProgressPct);
      if (vanCoord) {
        L.marker([vanCoord.lat, vanCoord.lng], {
          icon: createVehicleIcon("van", activeMode === "pool_van"),
        })
          .bindTooltip(
            `${activeMode === "pool_van" ? "YOU · " : ""}Backup Van (${Math.round(liveSim.vanProgressPct)}%)`
          )
          .addTo(layer);
      }
    }

    const autoPath = secondaryBus?.waypoints?.length >= 2 ? secondaryBus.waypoints : vanPath;
    if (autoPath.length >= 2) {
      const autoCoord = interpolateAlongPath(autoPath, liveSim.autoProgressPct);
      if (autoCoord) {
        L.marker([autoCoord.lat, autoCoord.lng], {
          icon: createVehicleIcon("auto", activeMode === "verified_auto"),
        })
          .bindTooltip(
            `${activeMode === "verified_auto" ? "YOU · " : ""}Rural Auto (${Math.round(liveSim.autoProgressPct)}%)`
          )
          .addTo(layer);
      }
    }
  }, [
    lowDataMode,
    buses,
    disruption,
    liveSim.busProgressPct,
    liveSim.vanProgressPct,
    liveSim.autoProgressPct,
    selectedDistrict.id,
    activeMode,
  ]);

  if (lowDataMode) {
    const busX = 50 + (liveSim.busProgressPct / 100) * 540;
    const vanX = 50 + (liveSim.vanProgressPct / 100) * 540;
    const autoX = 50 + (liveSim.autoProgressPct / 100) * 540;
    const firstVillage = customFromLabel || villages[0]?.name || "Origin";
    const firstStop = villages[0]?.pickupPoints[0]?.name ?? "Pickup #1";
    const destLabel = selectedDistrict.destinations[0]?.split(",")[0] ?? "College";

    return (
      <div
        className={`w-full ${heightClass} bg-sky-50/70 text-slate-900 rounded-xl border border-sky-200 p-3 flex flex-col justify-between`}
        role="region"
        aria-label="Low-data schematic route diagram"
      >
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-semibold truncate">{selectedDistrict.name} (2G Map)</span>
          <span className="font-mono text-teal-800 shrink-0">
            Bus {Math.round(liveSim.busProgressPct)}% · Van {Math.round(liveSim.vanProgressPct)}%
          </span>
        </div>

        <svg viewBox="0 0 640 130" className="w-full flex-1" aria-hidden="true">
          <line x1="50" y1="64" x2="590" y2="64" stroke="#1A73E8" strokeWidth="3.5" />
          {[
            { x: 50, label: firstVillage.slice(0, 14) },
            { x: 310, label: firstStop.slice(0, 16) },
            { x: 590, label: destLabel.slice(0, 16) },
          ].map((node, i) => (
            <g key={node.label}>
              <circle cx={node.x} cy="64" r={i === 2 ? 7 : 5} fill={i === 2 ? "#EA4335" : "#1A73E8"} />
              <text x={node.x} y="116" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="600">
                {node.label}
              </text>
            </g>
          ))}
          <g transform={`translate(${busX}, 40)`}>
            <rect x="-15" y="-8" width="30" height="14" rx="4" fill="#0F766E" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
              BUS
            </text>
          </g>
          <g transform={`translate(${vanX}, 82)`}>
            <rect x="-15" y="-8" width="30" height="14" rx="4" fill="#D97706" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
              VAN
            </text>
          </g>
          <g transform={`translate(${autoX}, 22)`}>
            <rect x="-17" y="-8" width="34" height="14" rx="4" fill="#0284C7" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
              AUTO
            </text>
          </g>
        </svg>
      </div>
    );
  }

  const activePct =
    activeMode === "govt_bus"
      ? liveSim.busProgressPct
      : activeMode === "pool_van"
      ? liveSim.vanProgressPct
      : liveSim.autoProgressPct;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />
      {/* Native floating Maps layer toggle */}
      <div className="absolute top-2.5 right-2.5 z-[400] flex bg-white/95 rounded-md shadow-sm border border-slate-300 overflow-hidden text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setMapStyle("street")}
          className={`px-2.5 py-1 ${
            mapStyle === "street" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setMapStyle("satellite")}
          className={`px-2.5 py-1 border-l border-slate-200 ${
            mapStyle === "satellite" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Live Vehicle Tracking Overlay Bar */}
      <div className="bg-white/95 backdrop-blur border-t border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-teal-900 truncate">
            {activeVehicleLabel ? `${activeVehicleLabel}` : activeMode === "govt_bus" ? "Govt Bus" : activeMode === "pool_van" ? "Pool Van" : "Rural Auto"} ·{" "}
            {liveSim.rideEnded ? `${rideEndedLabel} (100%)` : `${Math.round(activePct)}%`}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-600">
            Bus {Math.round(liveSim.busProgressPct)}% · Van {Math.round(liveSim.vanProgressPct)}% · Auto {Math.round(liveSim.autoProgressPct)}%
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!liveSim.rideEnded ? (
            <>
              <button
                type="button"
                onClick={() => setLiveSpeed(liveSim.speed === 1 ? 5 : 1)}
                className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded font-mono text-[10px] font-bold text-teal-900"
              >
                {liveSim.speed}x
              </button>
              {onSimulateArrival && (
                <button
                  type="button"
                  onClick={onSimulateArrival}
                  className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-semibold"
                >
                  {reachDestLabel}
                </button>
              )}
            </>
          ) : (
            onStartNewRide && (
              <button
                type="button"
                onClick={onStartNewRide}
                className="px-2 py-0.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-[10px] font-semibold"
              >
                {startNewRideLabel}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
