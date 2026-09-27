/**
 * Traffic system type definitions
 */

export type VehicleClass = 'Car' | 'Bus' | 'Truck' | 'Motorcycle';

export type LaneDirection = 'North' | 'South' | 'East' | 'West';

export type DensityTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type LightColor = 'RED' | 'YELLOW' | 'GREEN';

export type VisionMode = 'day' | 'night' | 'thermal';

export type WeatherCondition = 'clear' | 'rain' | 'fog';

export type AppTheme = 'dark' | 'thermal' | 'light';

export type EmergencyVehicleType = 'Ambulance' | 'Fire Brigade';

export interface VehicleDetection {
  id: number;
  class: VehicleClass;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  center: [number, number]; // [cx, cy]
  lane: LaneDirection;
  speed: number;
  isEmergency?: boolean;
  emergencyType?: EmergencyVehicleType;
}

export interface LaneStats {
  lane: LaneDirection;
  vehicles: number;
  density: DensityTier;
  classes: Record<VehicleClass, number>;
  waitingTimeAvgSec: number;
}

export interface SignalDecision {
  currentSignal: 'NORTH-SOUTH' | 'EAST-WEST';
  recommendedSignal: 'NORTH-SOUTH' | 'EAST-WEST';
  recommendedGreenTime: number; // in seconds
  highestLane: LaneDirection;
  highestCount: number;
  highestDensity: DensityTier;
  northSouthCount: number;
  eastWestCount: number;
  lampStates: Record<LaneDirection, LightColor>;
  emergencyActive: boolean;
  emergencyLane: LaneDirection | null;
  emergencyType?: EmergencyVehicleType | null;
  emergencyElapsedSec?: number;
  emergencyMinDuration?: number;
  reason: string;
}

export interface SystemConfig {
  lowThreshold: number;       // default 5
  mediumThreshold: number;    // default 15
  greenTimeLow: number;       // default 15
  greenTimeMedium: number;    // default 30
  greenTimeHigh: number;      // default 45
  boundaryCenterX: number;    // 0.0 - 1.0 (default 0.5)
  boundaryCenterY: number;    // 0.0 - 1.0 (default 0.5)
  confidenceThreshold: number;// default 0.35
  enableTracking: boolean;    // default true
  showBoundingBoxes: boolean;
  showCentroids: boolean;
  showLaneBoundaries: boolean;
  showLabels: boolean;
  visionMode: VisionMode;
  weather: WeatherCondition;
  audioFeedback: boolean;
  showScanlines: boolean;
  spawnRateNorth: number;     // 1 to 10 (higher = more vehicles)
  spawnRateSouth: number;
  spawnRateEast: number;
  spawnRateWest: number;
  globalSpawnIntensity: number; // 0.5 to 3.0
}

export type ScenarioPreset =
  | 'heavy-ns'
  | 'heavy-ew'
  | 'balanced'
  | 'off-peak'
  | 'emergency-priority'
  | 'emergency-ambulance'
  | 'emergency-fire-brigade'
  | 'custom-upload';
