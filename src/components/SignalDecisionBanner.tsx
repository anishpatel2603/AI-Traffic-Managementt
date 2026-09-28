import React from 'react';
import { SignalDecision, LaneStats, LaneDirection, AppTheme } from '../types/traffic';
import { Clock, ArrowRightLeft, ShieldAlert } from 'lucide-react';

interface SignalDecisionBannerProps {
  decision: SignalDecision;
  stats: Record<LaneDirection, LaneStats>;
  countdown?: number;
  isRunning: boolean;
  theme?: AppTheme;
}

export const SignalDecisionBanner: React.FC<SignalDecisionBannerProps> = ({
  decision,
  countdown,
  theme = 'light',
}) => {
  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200/90 text-slate-950 shadow-xs'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs';

  const subTextColor =
    theme === 'light' ? 'text-slate-600' : 'text-slate-400';

  const isNS = decision.recommendedSignal === 'NORTH-SOUTH';
  const activeCount = isNS ? decision.northSouthCount : decision.eastWestCount;
  const opposingCount = isNS ? decision.eastWestCount : decision.northSouthCount;

  return (
    <div className={`${containerBg} border rounded-xl p-5 space-y-4 transition-colors`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-slate-100">
            Signal Timing & Phase Status
          </h3>
          <p className={`text-[11px] font-medium ${subTextColor} mt-0.5`}>
            Dynamic cycle adjustment based on measured queue volume
          </p>
        </div>

        {decision.emergencyActive && (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Emergency Hold</span>
          </span>
        )}
      </div>

      {/* Primary Timing Details */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Active Phase Corridor */}
        <div className={`p-3 rounded-lg border ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${subTextColor}`}>
            Active Green Corridor
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-sm text-slate-950 dark:text-slate-100">
              {decision.currentSignal === 'NORTH-SOUTH' ? 'North ↔ South' : 'East ↔ West'}
            </span>
          </div>
          <div className={`text-[11px] mt-1.5 font-medium ${subTextColor}`}>
            Corridor load: <span className="font-bold text-slate-950 dark:text-slate-100">{activeCount} veh</span> vs {opposingCount} veh cross
          </div>
        </div>

        {/* Phase Duration */}
        <div className={`p-3 rounded-lg border ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${subTextColor}`}>
            Green Window Duration
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white">
              {decision.recommendedGreenTime}s
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">allocated</span>
          </div>
          <div className="text-[11px] mt-1 flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>{countdown ?? 0}s remaining in phase</span>
          </div>
        </div>
      </div>

      {/* Controller Decision Explanation */}
      <div className={`p-3.5 rounded-lg border text-xs ${
        theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-[11px] text-slate-950 dark:text-slate-100">
            Timing Rationale
          </span>
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Peak: {decision.highestLane} ({decision.highestCount} vehicles)
          </span>
        </div>
        <p className="text-[11px] leading-relaxed font-medium text-slate-700 dark:text-slate-300">
          {decision.reason}
        </p>
      </div>
    </div>
  );
};
