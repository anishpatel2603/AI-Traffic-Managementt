import React from 'react';
import {
  SystemConfig,
  ScenarioPreset,
  AppTheme,
} from '../types/traffic';
import {
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  config: SystemConfig;
  onUpdateConfig: (partial: Partial<SystemConfig>) => void;
  currentPreset: ScenarioPreset;
  onSelectPreset: (preset: ScenarioPreset) => void;
  theme?: AppTheme;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onToggleRunning,
  onReset,
  speedMultiplier,
  onSpeedChange,
  config,
  onUpdateConfig,
  currentPreset,
  onSelectPreset,
  theme = 'light',
}) => {
  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-xs text-slate-900'
      : 'bg-slate-900 border-slate-800 shadow-xs text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`${containerBg} border rounded-xl p-5 space-y-4 transition-colors`}>
      {/* Top Header: Controls & Status */}
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-3 ${
        theme === 'light' ? 'border-slate-100' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Traffic Flow & Demand Simulation
            </h3>
            <p className={`text-[11px] ${subTextColor}`}>
              Adjust real-time traffic generation rates to test adaptive signal reaction
            </p>
          </div>
        </div>

        {/* Action Buttons & Speed */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleRunning}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isRunning
                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Simulation</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 shadow-xs"
            title="Reset vehicles and timing"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 text-xs">
            {[0.5, 1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  speedMultiplier === s
                    ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Scenarios Presets */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          Preset Traffic Scenarios:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              onSelectPreset('heavy-ns');
              onUpdateConfig({ spawnRateNorth: 6, spawnRateSouth: 5, spawnRateEast: 2, spawnRateWest: 2 });
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'heavy-ns'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            🌅 Morning Commute (Heavy North-South)
          </button>

          <button
            onClick={() => {
              onSelectPreset('heavy-ew');
              onUpdateConfig({ spawnRateNorth: 2, spawnRateSouth: 2, spawnRateEast: 6, spawnRateWest: 5 });
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'heavy-ew'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            🌇 Evening Commute (Heavy East-West)
          </button>

          <button
            onClick={() => {
              onSelectPreset('balanced');
              onUpdateConfig({ spawnRateNorth: 4, spawnRateSouth: 4, spawnRateEast: 4, spawnRateWest: 4 });
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'balanced'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            🚗 Balanced 4-Way Traffic
          </button>

          <button
            onClick={() => {
              onSelectPreset('off-peak');
              onUpdateConfig({ spawnRateNorth: 1, spawnRateSouth: 1, spawnRateEast: 1, spawnRateWest: 1 });
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'off-peak'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            🌙 Late Night / Off-Peak
          </button>
        </div>
      </div>

      {/* Sliders: Approach Volume Adjustments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs">
        {/* Slider 1: Global Generation Rate */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              Overall City Traffic Density
            </span>
            <span className="text-slate-900 dark:text-slate-100 font-semibold text-xs">
              {config.globalSpawnIntensity.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={config.globalSpawnIntensity}
            onChange={(e) =>
              onUpdateConfig({ globalSpawnIntensity: parseFloat(e.target.value) })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
          <p className={`text-[10px] ${subTextColor}`}>
            Scales vehicle arrivals across all approaches simultaneously
          </p>
        </div>

        {/* Slider 2: North-South Inbound Spawn Rate */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              North-South Corridor Demand
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
              Level {config.spawnRateNorth} of 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={config.spawnRateNorth}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateConfig({ spawnRateNorth: val, spawnRateSouth: Math.max(1, val - 1) });
            }}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <p className={`text-[10px] ${subTextColor}`}>
            Inflow volume for northbound and southbound avenues
          </p>
        </div>

        {/* Slider 3: East-West Inbound Spawn Rate */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              East-West Corridor Demand
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
              Level {config.spawnRateEast} of 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={config.spawnRateEast}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateConfig({ spawnRateEast: val, spawnRateWest: Math.max(1, val - 1) });
            }}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <p className={`text-[10px] ${subTextColor}`}>
            Inflow volume for eastbound and westbound cross-streets
          </p>
        </div>
      </div>
    </div>
  );
};
