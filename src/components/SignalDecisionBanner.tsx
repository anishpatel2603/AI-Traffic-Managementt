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
      ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : 'text-slate-400';

  const isNS = decision.recommendedSignal === 'NORTH-SOUTH';
  const activeCount = isNS ? decision.northSouthCount : decision.eastWestCount;
  const opposingCount = isNS ? decision.eastWestCount : decision.northSouthCount;

  return (
    <div className={`${containerBg} border rounded-xl p-5 space-y-4 transition-colors`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        theme === 'light' ? 'border-slate-100' : 'border-slate-800'
      }`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Signal Timing & Phase Status
          </h3>
          <p className={`text-[11px] ${subTextColor} mt-0.5`}>
            Dynamic cycle adjustment based on measured queue volume
          </p>
        </div>

        {decision.emergencyActive && (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Emergency Hold</span>
          </span>
        )}
      </div>

      {/* Primary Timing Details */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Active Phase Corridor */}
        <div className={`p-3 rounded-lg border ${
          theme === 'light' ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${subTextColor}`}>
            Active Green Corridor
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {decision.currentSignal === 'NORTH-SOUTH' ? 'North ↔ South' : 'East ↔ West'}
            </span>
          </div>
          <div className={`text-[11px] mt-1.5 ${subTextColor}`}>
            Corridor load: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCount} veh</span> vs {opposingCount} veh cross
          </div>
        </div>

        {/* Phase Duration */}
        <div className={`p-3 rounded-lg border ${
          theme === 'light' ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${subTextColor}`}>
            Green Window Duration
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {decision.recommendedGreenTime}s
            </span>
            <span className={`text-xs ${subTextColor}`}>allocated</span>
          </div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium`}>
            <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{countdown ?? 0}s remaining in phase</span>
          </div>
        </div>
      </div>

      {/* Controller Decision Explanation */}
      <div className={`p-3.5 rounded-lg border text-xs ${
        theme === 'light' ? 'bg-blue-50/40 border-blue-100 text-slate-700' : 'bg-blue-950/20 border-blue-900/40 text-slate-300'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-[11px] text-blue-900 dark:text-blue-300">
            Timing Rationale
          </span>
          <span className="text-[10px] text-slate-500">
            Peak: {decision.highestLane} ({decision.highestCount} vehicles)
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
          {decision.reason}
        </p>
      </div>
    </div>
  );
};
