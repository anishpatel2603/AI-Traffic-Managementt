import React from 'react';
import { LaneStats, LaneDirection, SystemConfig, AppTheme } from '../types/traffic';
import { BarChart3 } from 'lucide-react';

interface DensityBarChartProps {
  stats: Record<LaneDirection, LaneStats>;
  config: SystemConfig;
  theme?: AppTheme;
}

export const DensityBarChart: React.FC<DensityBarChartProps> = ({ stats, config, theme = 'light' }) => {
  const lanes: { id: LaneDirection; label: string }[] = [
    { id: 'North', label: 'North' },
    { id: 'South', label: 'South' },
    { id: 'East', label: 'East' },
    { id: 'West', label: 'West' },
  ];

  // Maximum scale for chart visualization
  const vehicleCounts = Object.values(stats).map((s) => s.vehicles);
  const maxVehicleVal = Math.max(25, ...vehicleCounts);

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : 'bg-slate-900 border-slate-800 shadow-sm text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : 'text-slate-400';

  const trackBg =
    theme === 'light'
      ? 'bg-slate-100'
      : 'bg-slate-800';

  return (
    <div className={`${containerBg} border rounded-xl p-5 space-y-4 transition-colors`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            AI Traffic Density Analysis
          </h3>
          <p className={`text-[11px] ${subTextColor}`}>
            Approach queue distribution and threshold evaluation
          </p>
        </div>

        {/* Legend */}
        <div className={`hidden sm:flex items-center gap-3 text-[11px] ${subTextColor}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Low (0–{config.lowThreshold})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Med ({config.lowThreshold + 1}–{config.mediumThreshold})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600" /> High ({config.mediumThreshold + 1}+)
          </span>
        </div>
      </div>

      {/* Clean Density Bar Meters */}
      <div className="space-y-3 font-mono-numbers">
        {lanes.map(({ id, label }) => {
          const count = stats[id]?.vehicles || 0;
          const density = stats[id]?.density || 'LOW';
          const percent = Math.min(100, (count / maxVehicleVal) * 100);

          const barColor =
            density === 'HIGH'
              ? 'bg-red-500'
              : density === 'MEDIUM'
              ? 'bg-amber-500'
              : 'bg-blue-600';

          const densityTag =
            density === 'HIGH'
              ? 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
              : density === 'MEDIUM'
              ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';

          return (
            <div key={id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 w-16 text-xs">
                  {label}
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono-numbers font-bold text-sm text-slate-900 dark:text-slate-100">
                    {count} {count === 1 ? 'veh' : 'veh'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${densityTag}`}>
                    {density}
                  </span>
                </div>
              </div>

              {/* Progress bar with clean threshold markers */}
              <div className={`relative w-full h-2.5 rounded-full overflow-hidden ${trackBg}`}>
                {/* Low Threshold line marker */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-300 dark:bg-slate-600 z-10"
                  style={{ left: `${(config.lowThreshold / maxVehicleVal) * 100}%` }}
                  title={`Low Threshold: ${config.lowThreshold}`}
                />
                {/* Medium Threshold line marker */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-400 dark:bg-slate-500 z-10"
                  style={{ left: `${(config.mediumThreshold / maxVehicleVal) * 100}%` }}
                  title={`Medium Threshold: ${config.mediumThreshold}`}
                />

                {/* Animated bar fill */}
                <div
                  className={`h-full transition-all duration-300 rounded-full ${barColor}`}
                  style={{ width: `${Math.max(3, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
