import React from 'react';
import { LaneStats, LaneDirection, SignalDecision, AppTheme } from '../types/traffic';
import { Table } from 'lucide-react';

interface SummaryResultsTableProps {
  stats: Record<LaneDirection, LaneStats>;
  decision: SignalDecision;
  totalDetections: number;
  theme?: AppTheme;
}

export const SummaryResultsTable: React.FC<SummaryResultsTableProps> = ({
  stats,
  decision,
  totalDetections,
  theme = 'dark',
}) => {
  const lanes: LaneDirection[] = ['North', 'South', 'East', 'West'];

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-950'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-600' : 'text-slate-400';

  const tableHeaderBorder =
    theme === 'light' ? 'border-slate-200' : 'border-slate-800';

  return (
    <div className={`${containerBg} border rounded-2xl p-5 transition-colors`}>
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b mb-4 gap-2 ${tableHeaderBorder}`}>
        <div>
          <h3 className="text-sm font-bold tracking-wide flex items-center gap-2 text-slate-950 dark:text-slate-100">
            <Table className="w-4 h-4 text-emerald-600" />
            Adaptive Decision Results & Lane Audit
          </h3>
          <p className={`text-xs ${subTextColor} font-medium mt-0.5`}>
            Total active vehicles: <strong className={theme === 'light' ? 'text-slate-950 font-bold' : 'text-slate-200'}>{totalDetections}</strong> · Highest demand lane: <strong className="text-blue-700 dark:text-blue-400 font-bold">{decision.highestLane} ({decision.highestCount})</strong>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b ${tableHeaderBorder} text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]`}>
              <th className="py-2.5 px-3 font-bold">Lane</th>
              <th className="py-2.5 px-3 font-bold text-right">Vehicles</th>
              <th className="py-2.5 px-3 font-bold">Density Tier</th>
              <th className="py-2.5 px-3 font-bold">Signal State</th>
              <th className="py-2.5 px-3 font-bold">Vehicle Breakdown</th>
              <th className="py-2.5 px-3 font-bold text-right">Phase Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'
          } font-medium`}>
            {lanes.map((lane) => {
              const s = stats[lane] || {
                lane,
                vehicles: 0,
                density: 'LOW',
                classes: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
                waitingTimeAvgSec: 0,
              };
              const signal = decision.lampStates[lane] || 'RED';
              const isGreen = signal === 'GREEN';
              const isYellow = signal === 'YELLOW';

              return (
                <tr
                  key={lane}
                  className={`transition-colors ${
                    theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-slate-950 dark:text-slate-200">
                    {lane}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers font-extrabold text-slate-950 dark:text-slate-100">
                    {s.vehicles}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        s.density === 'HIGH'
                          ? 'text-red-700 dark:text-red-400'
                          : s.density === 'MEDIUM'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {s.density}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold font-mono-numbers ${
                        isGreen
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : isYellow
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isGreen
                            ? 'bg-emerald-600'
                            : isYellow
                            ? 'bg-amber-500'
                            : 'bg-red-600'
                        }`}
                      />
                      {signal}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono-numbers text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Cars: {s.classes.Car} · Bus: {s.classes.Bus} · Trk: {s.classes.Truck} · Moto: {s.classes.Motorcycle}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {decision.recommendedSignal.includes(lane.toUpperCase()) ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                        Priority Granted
                      </span>
                    ) : (
                      <span className={`text-[11px] font-semibold ${subTextColor}`}>
                        Held
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
