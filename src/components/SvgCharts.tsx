import React from "react";
import { GovernmentBus, Village } from "../types/mobility";

export const DemandCapacityChart: React.FC<{
  villages: Village[];
  buses: GovernmentBus[];
  multiplier?: number;
  demandDelta?: number;
  compact?: boolean;
}> = ({ villages, buses, multiplier = 1, demandDelta = 0, compact = false }) => {
  const rows = villages.map((v) => {
    const demand = Math.max(10, Math.round(v.predictedTomorrowDemand * multiplier) + demandDelta);
    const busCap = buses
      .filter((b) => b.originVillageId === v.id && b.status !== "Cancelled")
      .reduce((acc, b) => acc + b.totalSeats, 0);
    const maxVal = Math.max(demand, busCap, 80);
    return {
      id: v.id,
      name: v.name,
      demand,
      busCap,
      shortage: Math.max(0, demand - busCap),
      maxVal,
    };
  });

  const globalMax = Math.max(...rows.map((r) => r.maxVal), 80);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-4"}>
      <div className={`flex flex-wrap items-center justify-between gap-2 text-slate-600 ${compact ? "text-[10px]" : "text-xs"}`}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className={`${compact ? "w-2 h-2" : "w-3 h-3"} rounded-xs bg-teal-800 inline-block`} /> Govt Bus Seats
          </span>
          <span className="inline-flex items-center gap-1">
            <span className={`${compact ? "w-2 h-2" : "w-3 h-3"} rounded-xs bg-amber-600 inline-block`} /> Overflow Shortage
          </span>
        </div>
        <span className="font-mono text-slate-500">Seats</span>
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-3"}>
        {rows.map((row) => {
          const capPct = Math.round((row.busCap / globalMax) * 100);
          const shortagePct = Math.round((row.shortage / globalMax) * 100);
          return (
            <div key={row.id} className="space-y-0.5">
              <div className={`flex items-center justify-between ${compact ? "text-[11px]" : "text-sm"}`}>
                <span className="font-semibold text-slate-800 truncate pr-2">{row.name}</span>
                <span className={`font-mono text-slate-600 shrink-0 tabular-nums ${compact ? "text-[10px]" : "text-xs"}`}>
                  {row.demand} dem · {row.busCap} bus
                  {row.shortage > 0 ? (
                    <span className="text-amber-700 font-semibold"> · -{row.shortage}</span>
                  ) : (
                    <span className="text-emerald-700 font-medium"> · OK</span>
                  )}
                </span>
              </div>
              <div className={`${compact ? "h-2.5" : "h-5"} w-full bg-slate-100 rounded-sm overflow-hidden flex border border-slate-200`}>
                <div
                  style={{ width: `${capPct}%` }}
                  className="bg-teal-800 h-full transition-all duration-200"
                  title={`Government Bus Capacity: ${row.busCap}`}
                />
                {row.shortage > 0 && (
                  <div
                    style={{ width: `${shortagePct}%` }}
                    className="bg-amber-500 h-full transition-all duration-200"
                    title={`Unmet Shortage: ${row.shortage}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ShortageTrendChart: React.FC<{ baseDemand: number; baseCapacity: number }> = ({
  baseDemand,
  baseCapacity,
}) => {
  const days = [
    { day: "Mon", demand: baseDemand, cap: baseCapacity },
    { day: "Tue", demand: Math.round(baseDemand * 1.03), cap: baseCapacity },
    { day: "Wed", demand: Math.round(baseDemand * 1.08), cap: baseCapacity },
    { day: "Thu (Market)", demand: Math.round(baseDemand * 1.15), cap: baseCapacity },
    { day: "Fri", demand: Math.round(baseDemand * 1.05), cap: baseCapacity },
    { day: "Sat (Half-Day)", demand: Math.round(baseDemand * 0.88), cap: baseCapacity },
  ];

  const maxY = Math.max(...days.map((d) => d.demand), baseCapacity) + 12;
  const width = 560;
  const height = 190;
  const padX = 44;
  const padY = 24;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const toX = (i: number) => padX + (i / (days.length - 1)) * usableW;
  const toY = (val: number) => padY + usableH - (val / maxY) * usableH;

  const demandPoints = days.map((d, i) => `${toX(i)},${toY(d.demand)}`).join(" ");
  const capY = toY(baseCapacity);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[420px] h-48">
        {/* Horizontal gridlines */}
        {[0, 25, 50, 75].map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Government Bus Capacity Threshold */}
        <line
          x1={padX}
          y1={capY}
          x2={width - padX}
          y2={capY}
          stroke="#115E59"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <text
          x={width - padX}
          y={capY - 6}
          textAnchor="end"
          fill="#115E59"
          fontSize="10"
          fontWeight="600"
          fontFamily="monospace"
        >
          Govt Bus Cap ({baseCapacity})
        </text>

        {/* Demand polyline */}
        <polyline
          fill="none"
          stroke="#D97706"
          strokeWidth="2.5"
          points={demandPoints}
        />

        {days.map((d, i) => {
          const x = toX(i);
          const y = toY(d.demand);
          return (
            <g key={d.day}>
              <circle cx={x} cy={y} r="4" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
              <text
                x={x}
                y={y - 9}
                textAnchor="middle"
                fill="#92400E"
                fontSize="10"
                fontFamily="monospace"
              >
                {d.demand}
              </text>
              <text
                x={x}
                y={height - 6}
                textAnchor="middle"
                fill="#475569"
                fontSize="10"
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
