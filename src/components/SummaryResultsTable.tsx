import React from 'react';
import { LaneStats, LaneDirection, SignalDecision, AppTheme } from '../types/traffic';
import { Table, Download, Check, Sparkles } from 'lucide-react';

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
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border-amber-500/30 shadow-xl text-amber-100'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const exportBtn =
    theme === 'light'
      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
      : theme === 'thermal'
      ? 'bg-[#1b0a36] text-amber-200 hover:bg-[#250d4a] border-amber-500/40'
      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700';

  const tableHeaderBorder =
    theme === 'light' ? 'border-slate-200' : theme === 'thermal' ? 'border-amber-500/20' : 'border-slate-800';

  const exportCSV = () => {
    const headers = ['Lane', 'Vehicles', 'Density', 'Signal_State', 'Cars', 'Buses', 'Trucks', 'Motorcycles', 'Recommended_Corridor', 'Recommended_Green_Time_Sec'];
    const rows = lanes.map((l) => {
      const s = stats[l];
      return [
        l,
        s.vehicles,
        s.density,
        decision.lampStates[l],
        s.classes.Car,
        s.classes.Bus,
        s.classes.Truck,
        s.classes.Motorcycle,
        decision.recommendedSignal,
        decision.recommendedGreenTime,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `traffic_signal_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`${containerBg} border rounded-2xl p-5 transition-colors`}>
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b mb-4 gap-2 ${tableHeaderBorder}`}>
        <div>
          <h3 className={`text-sm font-bold tracking-wide flex items-center gap-2 ${
            theme === 'light' ? 'text-slate-900' : 'text-slate-100'
          }`}>
            <Table className="w-4 h-4 text-emerald-500" />
            Adaptive Decision Results & Lane Audit
          </h3>
          <p className={`text-xs ${subTextColor} mt-0.5`}>
            Total active vehicles: <strong className={theme === 'light' ? 'text-slate-900' : 'text-slate-200'}>{totalDetections}</strong> · Highest demand lane: <strong className="text-sky-500 font-bold">{decision.highestLane} ({decision.highestCount})</strong>
          </p>
        </div>

        <button
          onClick={exportCSV}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${exportBtn}`}
          title="Export CSV analysis for project report"
        >
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          Export CSV Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b ${tableHeaderBorder} ${subTextColor} uppercase tracking-wider text-[11px]`}>
              <th className="py-2.5 px-3 font-semibold">Lane</th>
              <th className="py-2.5 px-3 font-semibold text-right">Vehicles</th>
              <th className="py-2.5 px-3 font-semibold">Density Tier</th>
              <th className="py-2.5 px-3 font-semibold">Signal State</th>
              <th className="py-2.5 px-3 font-semibold">Vehicle Breakdown</th>
              <th className="py-2.5 px-3 font-semibold text-right">Phase Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            theme === 'light' ? 'divide-slate-100' : theme === 'thermal' ? 'divide-amber-500/10' : 'divide-slate-800/60'
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
                    theme === 'light' ? 'hover:bg-slate-50' : theme === 'thermal' ? 'hover:bg-amber-500/5' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className={`py-3 px-3 font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>
                    {lane}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono-numbers font-bold ${
                    theme === 'light' ? 'text-slate-900' : theme === 'thermal' ? 'text-amber-300' : 'text-slate-100'
                  }`}>
                    {s.vehicles}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        s.density === 'HIGH'
                          ? 'text-rose-500'
                          : s.density === 'MEDIUM'
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {s.density}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold font-mono-numbers ${
                        isGreen
                          ? 'text-emerald-500'
                          : isYellow
                          ? 'text-amber-500'
                          : 'text-rose-500'
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
                  <td className={`py-3 px-3 font-mono-numbers text-[11px] ${subTextColor}`}>
                    Cars: {s.classes.Car} · Bus: {s.classes.Bus} · Trk: {s.classes.Truck} · Moto: {s.classes.Motorcycle}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {decision.recommendedSignal.includes(lane.toUpperCase()) ? (
                      <span className="text-emerald-500 font-bold text-[11px]">
                        Priority Granted
                      </span>
                    ) : (
                      <span className={`text-[11px] ${subTextColor}`}>
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
