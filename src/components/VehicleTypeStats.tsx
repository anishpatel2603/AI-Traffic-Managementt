import React from 'react';
import { LaneStats, LaneDirection, AppTheme, WeatherCondition } from '../types/traffic';
import { Car, Bus, Truck, Bike, ShieldCheck } from 'lucide-react';

interface VehicleTypeStatsProps {
  stats: Record<LaneDirection, LaneStats>;
  weather?: WeatherCondition;
  theme?: AppTheme;
  emergencyActive?: boolean;
  emergencyType?: 'Ambulance' | 'Fire Brigade' | null;
  emergencyLane?: LaneDirection | null;
  emergencyElapsedSec?: number;
}

export const VehicleTypeStats: React.FC<VehicleTypeStatsProps> = ({
  stats,
  weather = 'clear',
  theme = 'light',
  emergencyActive = false,
  emergencyType = null,
  emergencyLane = null,
  emergencyElapsedSec = 0,
}) => {
  const totals = {
    Car: 0,
    Bus: 0,
    Truck: 0,
    Motorcycle: 0,
  };

  Object.values(stats).forEach((lane) => {
    totals.Car += lane.classes.Car || 0;
    totals.Bus += lane.classes.Bus || 0;
    totals.Truck += lane.classes.Truck || 0;
    totals.Motorcycle += lane.classes.Motorcycle || 0;
  });

  const totalActive = totals.Car + totals.Bus + totals.Truck + totals.Motorcycle;
  const confPercent = weather === 'fog' ? 83 : weather === 'rain' ? 89 : 94;

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : 'bg-slate-900 border-slate-800 shadow-sm text-slate-100';

  const cardBg =
    theme === 'light'
      ? 'bg-slate-50 border-slate-200'
      : 'bg-slate-950/70 border-slate-800';

  const subTextColor =
    theme === 'light' ? 'text-slate-600' : 'text-slate-400';

  const vehicleCards = [
    {
      type: 'Passenger Cars',
      icon: <Car className="w-4 h-4 text-blue-600" />,
      count: totals.Car,
      share: totalActive > 0 ? Math.round((totals.Car / totalActive) * 100) : 0,
      badge: 'Light Vehicles',
    },
    {
      type: 'Transit Buses',
      icon: <Bus className="w-4 h-4 text-amber-600" />,
      count: totals.Bus,
      share: totalActive > 0 ? Math.round((totals.Bus / totalActive) * 100) : 0,
      badge: 'Public Transit',
    },
    {
      type: 'Freight Trucks',
      icon: <Truck className="w-4 h-4 text-slate-700 dark:text-slate-300" />,
      count: totals.Truck,
      share: totalActive > 0 ? Math.round((totals.Truck / totalActive) * 100) : 0,
      badge: 'Commercial Fleet',
    },
    {
      type: 'Motorcycles',
      icon: <Bike className="w-4 h-4 text-emerald-600" />,
      count: totals.Motorcycle,
      share: totalActive > 0 ? Math.round((totals.Motorcycle / totalActive) * 100) : 0,
      badge: 'Two-Wheelers',
    },
  ];

  return (
    <div className={`${containerBg} border rounded-xl p-5 space-y-4 transition-colors`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-2 ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-slate-100">
            Vehicle Classification Breakdown
          </h3>
          <p className={`text-[11px] font-medium ${subTextColor}`}>
            Traffic composition across cars, public transit, commercial, and two-wheelers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {emergencyActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-red-50 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-xs font-bold">
              <span>{emergencyType || 'Emergency'} Corridor Active</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-xs">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Total Detected:</span>
            <span className="font-bold text-[11px] text-slate-950 dark:text-slate-100">
              {totalActive} vehicles
            </span>
          </div>
        </div>
      </div>

      {/* 4 Clean Vehicle Type Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {vehicleCards.map((vc) => (
          <div
            key={vc.type}
            className={`${cardBg} border rounded-lg p-3.5 flex flex-col justify-between transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {vc.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${subTextColor}`}>
                {vc.badge}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs font-semibold block text-slate-950 dark:text-slate-200">
                {vc.type}
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono-numbers text-2xl font-extrabold text-slate-950 dark:text-slate-100">
                  {vc.count}
                </span>
                <span className={`text-[11px] font-mono-numbers font-medium ${subTextColor}`}>
                  ({vc.share}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
