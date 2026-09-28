import React from 'react';
import { LaneDirection, EmergencyVehicleType, AppTheme } from '../types/traffic';
import { Siren, XCircle } from 'lucide-react';

interface EmergencyPriorityBarProps {
  selectedLane: LaneDirection;
  onSelectLane: (lane: LaneDirection) => void;
  onDispatch: (type: EmergencyVehicleType, lane: LaneDirection) => void;
  onCancel: () => void;
  emergencyActive?: boolean;
  emergencyType?: EmergencyVehicleType | null;
  emergencyLane?: LaneDirection | null;
  emergencyElapsedSec?: number;
  theme?: AppTheme;
}

export const EmergencyPriorityBar: React.FC<EmergencyPriorityBarProps> = ({
  selectedLane,
  onSelectLane,
  onDispatch,
  onCancel,
  emergencyActive = false,
  emergencyType = null,
  emergencyLane = null,
  emergencyElapsedSec = 0,
  theme = 'light',
}) => {
  const lanes: { id: LaneDirection; label: string }[] = [
    { id: 'North', label: 'North Approach' },
    { id: 'South', label: 'South Approach' },
    { id: 'East',  label: 'East Approach' },
    { id: 'West',  label: 'West Approach' },
  ];

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200/90 text-slate-950 shadow-xs'
      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs';

  const subTextColor =
    theme === 'light' ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className={`w-full rounded-xl border p-4 transition-colors ${containerBg}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            emergencyActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            <Siren className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100">
                Emergency Vehicle Priority Override
              </h3>
              {emergencyActive && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                  ACTIVE: {emergencyType} ({emergencyElapsedSec.toFixed(1)}s hold)
                </span>
              )}
            </div>
            <p className={`text-xs ${subTextColor} font-medium mt-0.5`}>
              Preempts normal cycle to provide instant green corridor for approaching emergency fleet
            </p>
          </div>
        </div>

        {emergencyActive && (
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <XCircle className="w-3.5 h-3.5" />
            Release Override
          </button>
        )}
      </div>

      {/* Control Actions Row */}
      <div className="mt-3.5 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        {/* Lane Selector */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${subTextColor}`}>
            Inbound Corridor:
          </span>
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-xs">
            {lanes.map(({ id }) => {
              const isSelected = selectedLane === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectLane(id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dispatch Ambulance Button */}
          <button
            type="button"
            onClick={() => onDispatch('Ambulance', selectedLane)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
              emergencyActive && emergencyType === 'Ambulance'
                ? 'bg-sky-700 ring-2 ring-sky-300 dark:ring-sky-700'
                : 'bg-sky-700 hover:bg-sky-800 active:scale-98'
            }`}
            title={`Dispatch Ambulance approaching on ${selectedLane} corridor`}
          >
            <span>🚑 Dispatch Ambulance</span>
          </button>

          {/* Dispatch Fire Engine Button */}
          <button
            type="button"
            onClick={() => onDispatch('Fire Brigade', selectedLane)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
              emergencyActive && emergencyType === 'Fire Brigade'
                ? 'bg-rose-700 ring-2 ring-rose-300 dark:ring-rose-700'
                : 'bg-rose-700 hover:bg-rose-800 active:scale-98'
            }`}
            title={`Dispatch Fire Engine approaching on ${selectedLane} corridor`}
          >
            <span>🚒 Dispatch Fire Engine</span>
          </button>
        </div>
      </div>
    </div>
  );
};
