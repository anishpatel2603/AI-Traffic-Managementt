import React from 'react';
import { LaneStats, LaneDirection, LightColor, AppTheme } from '../types/traffic';
import { Car, Bus, Truck, Bike } from 'lucide-react';

interface LaneStatsCardsProps {
  stats: Record<LaneDirection, LaneStats>;
  lampStates: Record<LaneDirection, LightColor>;
  theme?: AppTheme;
}

export const LaneStatsCards: React.FC<LaneStatsCardsProps> = ({
  stats,
  lampStates,
  theme = 'light',
}) => {
  const lanes: { id: LaneDirection; label: string; compass: string }[] = [
    { id: 'North', label: 'North Approach', compass: 'Southbound Inbound' },
    { id: 'South', label: 'South Approach', compass: 'Northbound Inbound' },
    { id: 'East',  label: 'East Approach',  compass: 'Westbound Inbound' },
    { id: 'West',  label: 'West Approach',  compass: 'Eastbound Inbound' },
  ];

  const cardBg =
    theme === 'light'
      ? 'bg-white border-slate-200/90 text-slate-950 shadow-xs'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs';

  const subTextColor =
    theme === 'light' ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {lanes.map(({ id, label, compass }) => {
        const laneData = stats[id] || {
          lane: id,
          vehicles: 0,
          density: 'LOW',
          classes: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
          waitingTimeAvgSec: 0,
        };

        const signal = lampStates[id] || 'RED';
        const isGreen = signal === 'GREEN';
        const isYellow = signal === 'YELLOW';

        // Capacity calculation (assume 25 is lane saturation queue)
        const capacityPct = Math.min(100, Math.round((laneData.vehicles / 25) * 100));

        const signalLabel = isGreen
          ? 'Green · Free Flow'
          : isYellow
          ? 'Yellow · Clearing'
          : 'Red · Queuing';

        const signalColor = isGreen
          ? 'text-emerald-800 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
          : isYellow
          ? 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
          : 'text-slate-900 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';

        const densityLabel =
          laneData.density === 'HIGH'
            ? 'Heavy Queue'
            : laneData.density === 'MEDIUM'
            ? 'Moderate Traffic'
            : 'Light Flow';

        const densityColor =
          laneData.density === 'HIGH'
            ? 'text-red-700 dark:text-red-400'
            : laneData.density === 'MEDIUM'
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-emerald-700 dark:text-emerald-400';

        return (
          <div
            key={id}
            className={`${cardBg} border rounded-xl p-4 transition-all flex flex-col justify-between`}
          >
            <div>
              {/* Header: Approach Direction & Signal State */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100">
                    {label}
                  </h3>
                  <p className={`text-[11px] font-medium ${subTextColor}`}>
                    {compass}
                  </p>
                </div>

                <div className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1.5 ${signalColor}`}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isGreen ? 'bg-emerald-600' : isYellow ? 'bg-amber-500' : 'bg-red-600'
                    }`}
                  />
                  <span>{signalLabel}</span>
                </div>
              </div>

              {/* Main Queue Count */}
              <div className="mt-3.5 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {laneData.vehicles}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      vehicles queued
                    </span>
                  </div>
                  <div className={`text-[11px] mt-0.5 font-bold ${densityColor}`}>
                    {densityLabel}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400">
                    Est. Delay
                  </div>
                  <div className="text-xs font-bold text-slate-950 dark:text-slate-100 mt-0.5">
                    ~{laneData.waitingTimeAvgSec}s wait
                  </div>
                </div>
              </div>

              {/* Approach Queue Capacity Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Approach Capacity</span>
                  <span className="text-slate-900 dark:text-slate-100">{capacityPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      capacityPct >= 70
                        ? 'bg-red-600'
                        : capacityPct >= 40
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.max(4, capacityPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Type Breakdown */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1" title="Passenger Cars">
                <Car className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-950 dark:text-slate-100">{laneData.classes.Car}</span>
              </span>
              <span className="flex items-center gap-1" title="Transit Buses">
                <Bus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-950 dark:text-slate-100">{laneData.classes.Bus}</span>
              </span>
              <span className="flex items-center gap-1" title="Commercial Trucks">
                <Truck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-950 dark:text-slate-100">{laneData.classes.Truck}</span>
              </span>
              <span className="flex items-center gap-1" title="Two-Wheelers / Motorcycles">
                <Bike className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="font-bold text-slate-950 dark:text-slate-100">{laneData.classes.Motorcycle}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
