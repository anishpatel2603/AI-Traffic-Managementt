import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VehicleDetection,
  LaneStats,
  SignalDecision,
  SystemConfig,
  ScenarioPreset,
  LaneDirection,
  AppTheme,
  EmergencyVehicleType,
} from './types/traffic';
import { TrafficIntersectionSimulator } from './utils/trafficSimulation';
import { soundFx } from './utils/audioFeedback';
import { VideoCanvas } from './components/VideoCanvas';
import { TrafficLights } from './components/TrafficLights';
import { LaneStatsCards } from './components/LaneStatsCards';
import { SignalDecisionBanner } from './components/SignalDecisionBanner';
import { SimulationControls } from './components/SimulationControls';
import { DensityBarChart } from './components/DensityBarChart';
import { SummaryResultsTable } from './components/SummaryResultsTable';
import { EfficiencyBenchmark } from './components/EfficiencyBenchmark';
import { VehicleTypeStats } from './components/VehicleTypeStats';
import { ThemeToggle } from './components/ThemeToggle';
import { EmergencyPriorityBar } from './components/EmergencyPriorityBar';
import { SettingsModal } from './components/SettingsModal';
import {
  Settings2,
  AlertCircle,
  Volume2,
  VolumeX,
  Gauge,
  LayoutDashboard,
  Siren,
} from 'lucide-react';

const DEFAULT_CONFIG: SystemConfig = {
  lowThreshold: 5,
  mediumThreshold: 15,
  greenTimeLow: 15,
  greenTimeMedium: 30,
  greenTimeHigh: 45,
  boundaryCenterX: 0.5,
  boundaryCenterY: 0.5,
  confidenceThreshold: 0.35,
  enableTracking: true,
  showBoundingBoxes: true,
  showCentroids: true,
  showLaneBoundaries: true,
  showLabels: true,
  visionMode: 'day',
  weather: 'clear',
  audioFeedback: true,
  showScanlines: false,
  spawnRateNorth: 6,
  spawnRateSouth: 5,
  spawnRateEast: 2,
  spawnRateWest: 2,
  globalSpawnIntensity: 1.0,
};

export default function App() {
  // Default to professional light theme as specified in design direction
  const [theme, setTheme] = useState<AppTheme>('light');
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [currentPreset, setCurrentPreset] = useState<ScenarioPreset>('heavy-ns');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'benchmark'>('dashboard');
  const [selectedEmergencyLane, setSelectedEmergencyLane] = useState<LaneDirection>('North');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Refs
  const simulatorRef = useRef<TrafficIntersectionSimulator | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const prevCorridorRef = useRef<'NORTH-SOUTH' | 'EAST-WEST'>('NORTH-SOUTH');
  const lastSirenTimeRef = useRef<number>(0);

  // Sync theme with body class
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    if (newTheme === 'thermal') {
      setConfig((prev) => ({ ...prev, visionMode: 'thermal' }));
    } else if (newTheme === 'light') {
      setConfig((prev) => ({ ...prev, visionMode: 'day' }));
    }
  };

  // Simulation output state
  const [detections, setDetections] = useState<VehicleDetection[]>([]);
  const [laneStats, setLaneStats] = useState<Record<LaneDirection, LaneStats>>({
    North: { lane: 'North', vehicles: 12, density: 'MEDIUM', classes: { Car: 8, Bus: 2, Truck: 1, Motorcycle: 1 }, waitingTimeAvgSec: 22 },
    South: { lane: 'South', vehicles: 8,  density: 'LOW',    classes: { Car: 5, Bus: 1, Truck: 1, Motorcycle: 1 }, waitingTimeAvgSec: 14 },
    East:  { lane: 'East',  vehicles: 18, density: 'HIGH',   classes: { Car: 11, Bus: 3, Truck: 2, Motorcycle: 2 }, waitingTimeAvgSec: 32 },
    West:  { lane: 'West',  vehicles: 5,  density: 'LOW',    classes: { Car: 3, Bus: 1, Truck: 0, Motorcycle: 1 }, waitingTimeAvgSec: 8 },
  });
  const [decision, setDecision] = useState<SignalDecision>({
    currentSignal: 'EAST-WEST',
    recommendedSignal: 'EAST-WEST',
    recommendedGreenTime: 45,
    highestLane: 'East',
    highestCount: 18,
    highestDensity: 'HIGH',
    northSouthCount: 20,
    eastWestCount: 23,
    lampStates: { North: 'RED', South: 'RED', East: 'GREEN', West: 'GREEN' },
    emergencyActive: false,
    emergencyLane: null,
    reason: 'East-West queue (23 veh) exceeds North-South (20 veh). High traffic volume detected on East arm.',
  });
  const [countdown, setCountdown] = useState<number>(30);
  const [isYellow, setIsYellow] = useState<boolean>(false);

  // Initialize simulator
  useEffect(() => {
    simulatorRef.current = new TrafficIntersectionSimulator();
    simulatorRef.current.resetScenario('heavy-ns');
  }, []);

  // Update scenario
  const handleSelectPreset = (preset: ScenarioPreset) => {
    setCurrentPreset(preset);
    setErrorMessage(null);
    if (simulatorRef.current) {
      simulatorRef.current.resetScenario(preset);
    }
  };

  // Emergency vehicle preemption handlers
  const handleDispatchEmergency = (type: EmergencyVehicleType, lane: LaneDirection = 'North') => {
    if (simulatorRef.current) {
      simulatorRef.current.dispatchEmergency(type, lane);
      if (type === 'Ambulance') {
        soundFx.playAmbulanceSiren(config.audioFeedback);
      } else {
        soundFx.playFireBrigadeSiren(config.audioFeedback);
      }
    }
  };

  const handleCancelEmergency = () => {
    if (simulatorRef.current) {
      simulatorRef.current.cancelEmergency();
    }
  };

  // Main animation / simulation tick loop
  const updateTick = useCallback(
    (now: number) => {
      const deltaSec = Math.min(0.08, (now - lastTimeRef.current) / 1000) * speedMultiplier;
      lastTimeRef.current = now;

      const sim = simulatorRef.current;
      if (sim && isRunning) {
        sim.step(config, deltaSec);
        const results = sim.getDetections(config);

        // Check if corridor changed to play audio chime
        if (results.decision.currentSignal !== prevCorridorRef.current) {
          prevCorridorRef.current = results.decision.currentSignal;
          soundFx.playSignalChange(config.audioFeedback);
        }

        // Periodic siren sound while emergency vehicle preemption is active
        if (results.decision.emergencyActive && config.audioFeedback) {
          if (now - lastSirenTimeRef.current > 1500) {
            lastSirenTimeRef.current = now;
            if (results.decision.emergencyType === 'Ambulance') {
              soundFx.playAmbulanceSiren(true);
            } else {
              soundFx.playFireBrigadeSiren(true);
            }
          }
        }

        setDetections(results.detections);
        setLaneStats(results.laneStats);
        setDecision(results.decision);
        setCountdown(sim.getPhaseCountdown());
        setIsYellow(sim.isYellow());
      }

      animFrameRef.current = requestAnimationFrame(updateTick);
    },
    [isRunning, speedMultiplier, config]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [updateTick]);

  const handleToggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (simulatorRef.current) {
      simulatorRef.current.resetScenario(currentPreset);
    }
    setErrorMessage(null);
  };

  // Theme-derived background classes
  const mainBgClass =
    theme === 'light'
      ? 'bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white'
      : theme === 'thermal'
      ? 'bg-[#070314] text-amber-100 selection:bg-amber-500 selection:text-black'
      : 'bg-[#0b0f19] text-slate-100 selection:bg-blue-600 selection:text-white';

  const headerBgClass =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#090318] border-amber-500/30 text-amber-200'
      : 'bg-slate-900 border-slate-800 text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`min-h-screen ${mainBgClass} flex flex-col font-sans transition-colors duration-200`}>
      {/* PROFESSIONAL CONTROL-ROOM HEADER */}
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xs ${headerBgClass}`}>
        {/* Wordmark and System Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                City Traffic Operations
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
              <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 font-normal">
                4th & Grand Intersection (#104)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
              <span>Adaptive Signal Control</span>
              <span aria-hidden="true">·</span>
              <span>Dynamic Queue Balancing</span>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <nav className={`hidden md:flex items-center gap-1 p-1 rounded-lg border text-xs ${
          theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 font-semibold shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Live Intersection
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-white text-slate-900 font-semibold shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            Efficiency & Delay Audit
          </button>
        </nav>

        {/* Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setConfig((prev) => ({ ...prev, audioFeedback: !prev.audioFeedback }))}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            title={config.audioFeedback ? 'Chimes Enabled' : 'Muted'}
          >
            {config.audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            title="Calibration Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />
        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 font-semibold cursor-pointer hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Approach Traffic & Queue Monitor */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs px-0.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Approach Traffic & Queue Status
              </h2>
              <p className={`text-[11px] ${subTextColor}`}>
                Real-time queue length and signal clearance status on all four approaches
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Total Inbound Queue: <strong className="text-slate-900 dark:text-slate-100">{detections.length} vehicles</strong>
            </div>
          </div>
          <LaneStatsCards stats={laneStats} lampStates={decision.lampStates} theme={theme} />
        </section>

        {activeTab === 'dashboard' ? (
          <>
            {/* EMERGENCY PRIORITY PREEMPTION (Placed directly above the Intersection Monitor) */}
            <section>
              <EmergencyPriorityBar
                selectedLane={selectedEmergencyLane}
                onSelectLane={setSelectedEmergencyLane}
                onDispatch={handleDispatchEmergency}
                onCancel={handleCancelEmergency}
                emergencyActive={decision.emergencyActive}
                emergencyType={decision.emergencyType}
                emergencyLane={decision.emergencyLane}
                emergencyElapsedSec={decision.emergencyElapsedSec}
                theme={theme}
              />
            </section>

            {/* SECTION 2: LIVE INTERSECTION MONITOR & AI DECISION PANEL */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Main 4-Way Traffic Simulation Canvas (8 cols) */}
              <div className="lg:col-span-8 space-y-2">
                <VideoCanvas
                  detections={detections}
                  config={config}
                  onUpdateConfig={(p) => setConfig((prev) => ({ ...prev, ...p }))}
                  isRunning={isRunning}
                  lampStates={decision.lampStates}
                  decision={decision}
                  theme={theme}
                  canvasRef={canvasRef}
                />
              </div>

              {/* AI Signal Recommendation & Traffic Lights (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <SignalDecisionBanner
                  decision={decision}
                  stats={laneStats}
                  countdown={countdown}
                  isRunning={isRunning}
                  theme={theme}
                />

                <TrafficLights
                  lampStates={decision.lampStates}
                  countdown={countdown}
                  currentCorridor={decision.currentSignal}
                  isYellow={isYellow}
                  emergencyActive={decision.emergencyActive}
                  theme={theme}
                />
              </div>
            </section>

            {/* Emergency Preemption Alert Box (when active) */}
            {decision.emergencyActive && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800 text-red-900 dark:text-red-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Siren className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wide text-red-800 dark:text-red-300">
                        Emergency Priority Preemption Active
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-800 font-mono font-semibold dark:bg-red-900 dark:text-red-200">
                        {(decision.emergencyElapsedSec ?? 0).toFixed(1)}s elapsed
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono font-medium dark:bg-slate-800 dark:text-slate-300">
                        {(decision.emergencyElapsedSec ?? 0) < 6
                          ? `Hold Lock: ${(6.0 - (decision.emergencyElapsedSec ?? 0)).toFixed(1)}s remaining`
                          : 'Min 6s hold satisfied · Clearing junction'}
                      </span>
                    </div>
                    <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                      Approach: <strong>{decision.emergencyLane || 'NORTH'} CORRIDOR</strong> · All conflicting crossroads locked to RED until vehicle clearance.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCancelEmergency}
                  className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs cursor-pointer transition-colors shadow-xs"
                >
                  Release Preemption
                </button>
              </div>
            )}

            {/* SECTION 3: SIMULATION CONTROLS */}
            <section>
              <SimulationControls
                isRunning={isRunning}
                onToggleRunning={handleToggleRunning}
                onReset={handleReset}
                speedMultiplier={speedMultiplier}
                onSpeedChange={(s) => setSpeedMultiplier(s)}
                config={config}
                onUpdateConfig={(p) => setConfig((prev) => ({ ...prev, ...p }))}
                currentPreset={currentPreset}
                onSelectPreset={handleSelectPreset}
                theme={theme}
              />
            </section>

            {/* SECTION 4: AI TRAFFIC ANALYSIS & VEHICLE CLASSIFICATION */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5">
                <DensityBarChart stats={laneStats} config={config} theme={theme} />
              </div>
              <div className="lg:col-span-7">
                <VehicleTypeStats
                  stats={laneStats}
                  weather={config.weather}
                  emergencyActive={decision.emergencyActive}
                  emergencyType={decision.emergencyType}
                  emergencyLane={decision.emergencyLane}
                  emergencyElapsedSec={decision.emergencyElapsedSec}
                  theme={theme}
                />
              </div>
            </section>
          </>
        ) : (
          /* SECTION 5: CONTROLLER BENCHMARK & RESULTS AUDIT TAB */
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Performance Benchmark & Comparative Audit
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Comparing Real-Time AI Adaptive Signal Timing against Conventional Fixed-Timer Controllers (Webster's Delay Model & HCM Standards).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium cursor-pointer transition-colors shadow-xs"
              >
                Return to Operations Monitor →
              </button>
            </div>

            <EfficiencyBenchmark decision={decision} stats={laneStats} theme={theme} />
            <SummaryResultsTable
              stats={laneStats}
              decision={decision}
              totalDetections={detections.length}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* Professional Municipal Footer */}
      <footer className={`mt-auto border-t py-4 px-6 text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-500'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">City Traffic Operations Center</span>
          <span>·</span>
          <span>Adaptive Signal Controller</span>
          <span>·</span>
          <span>Intersection #104 (4th & Grand)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Demand-responsive signal cycles · Dynamic queue balancing
        </div>
      </footer>

      {/* CALIBRATION & SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={(newCfg) => setConfig(newCfg)}
        onResetDefaults={() => setConfig(DEFAULT_CONFIG)}
      />
    </div>
  );
}
