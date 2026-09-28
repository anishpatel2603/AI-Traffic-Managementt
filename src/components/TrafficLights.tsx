import React from 'react';
import { LaneDirection, LightColor, AppTheme } from '../types/traffic';

interface TrafficLightsProps {
  lampStates: Record<LaneDirection, LightColor>;
  countdown: number;
  currentCorridor: 'NORTH-SOUTH' | 'EAST-WEST';
  isYellow: boolean;
  emergencyActive?: boolean;
  theme?: AppTheme;
}

export const TrafficLights: React.FC<TrafficLightsProps> = ({
  lampStates,
  countdown,
  currentCorridor,
  isYellow,
  emergencyActive,
  theme = 'light',
}) => {
  const lanes: { id: LaneDirection; label: string; approach: string }[] = [
    { id: 'North', label: 'North', approach: 'SB' },
    { id: 'South', label: 'South', approach: 'NB' },
    { id: 'East',  label: 'East',  approach: 'WB' },
    { id: 'West',  label: 'West',  approach: 'EB' },
  ];

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs';

  const lightPodBg =
    theme === 'light'
      ? 'bg-slate-50 border-slate-200'
      : 'bg-slate-950/60 border-slate-800';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : 'text-slate-400';

  const activeCorridorLabel = currentCorridor === 'NORTH-SOUTH' ? 'North ↔ South' : 'East ↔ West';

  return (
    <div className={`${containerBg} border rounded-xl p-5 space-y-4 transition-colors`}>
      {/* Active Phase Countdown Banner */}
      <div className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
        emergencyActive
          ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900 dark:text-red-200'
          : isYellow
          ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              emergencyActive ? 'bg-red-600 animate-ping' : isYellow ? 'bg-amber-500' : 'bg-emerald-600'
            }`} />
            <span className="font-bold text-xs uppercase tracking-wide">
              {emergencyActive ? 'Emergency Corridor Priority' : `${activeCorridorLabel} Green Phase`}
            </span>
          </div>
          <span className="text-[11px] block mt-0.5 text-slate-700 dark:text-slate-300 font-medium">
            {emergencyActive
              ? 'Clearing junction for emergency vehicle'
              : isYellow
              ? 'Yellow amber transition · Vehicles clearing junction'
              : 'Holding green signal for active queue'}
          </span>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className={`text-2xl font-extrabold font-mono-numbers ${
            emergencyActive
              ? 'text-red-700 dark:text-red-400'
              : isYellow
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}>
            {countdown}
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">sec</span>
        </div>
      </div>

      {/* 4 Realistic Signal Heads */}
      <div className="grid grid-cols-4 gap-2.5">
        {lanes.map(({ id, label, approach }) => {
          const state = lampStates[id];
          const isRed = state === 'RED';
          const isYellowState = state === 'YELLOW';
          const isGreen = state === 'GREEN';

          return (
            <div
              key={id}
              className={`flex flex-col items-center p-3 rounded-lg border ${lightPodBg}`}
            >
              <div className="text-center mb-2.5">
                <div className="text-xs font-bold text-slate-950 dark:text-slate-100">
                  {label}
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  {approach}
                </div>
              </div>

              {/* Realistic Traffic Signal Head Enclosure */}
              <div className="w-11 bg-neutral-900 border-2 border-neutral-700 rounded-xl p-1.5 flex flex-col items-center gap-2 shadow-md relative">
                {/* Red Lamp with visor hood */}
                <div className="relative flex flex-col items-center">
                  <div className="w-7 h-2 bg-neutral-800 rounded-t-sm -mb-0.5 z-10 opacity-90" />
                  <div
                    className={`w-7 h-7 rounded-full transition-all duration-150 border flex items-center justify-center relative ${
                      isRed
                        ? 'bg-red-600 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                        : 'bg-red-950/30 border-neutral-800 opacity-20'
                    }`}
                  >
                    {isRed && (
                      <div className="w-2.5 h-2.5 rounded-full bg-red-100/60" />
                    )}
                  </div>
                </div>

                {/* Amber Lamp with visor hood */}
                <div className="relative flex flex-col items-center">
                  <div className="w-7 h-2 bg-neutral-800 rounded-t-sm -mb-0.5 z-10 opacity-90" />
                  <div
                    className={`w-7 h-7 rounded-full transition-all duration-150 border flex items-center justify-center relative ${
                      isYellowState
                        ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                        : 'bg-amber-950/30 border-neutral-800 opacity-20'
                    }`}
                  >
                    {isYellowState && (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-100/60" />
                    )}
                  </div>
                </div>

                {/* Green Lamp with visor hood */}
                <div className="relative flex flex-col items-center">
                  <div className="w-7 h-2 bg-neutral-800 rounded-t-sm -mb-0.5 z-10 opacity-90" />
                  <div
                    className={`w-7 h-7 rounded-full transition-all duration-150 border flex items-center justify-center relative ${
                      isGreen
                        ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                        : 'bg-emerald-950/30 border-neutral-800 opacity-20'
                    }`}
                  >
                    {isGreen && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-100/60" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status Label */}
              <div className="mt-2 text-center">
                <span
                  className={`text-[11px] font-bold ${
                    isGreen
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isYellowState
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {state}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
