import React from 'react';
import { SystemConfig, WeatherCondition } from '../types/traffic';
import { X, Sliders, RotateCcw, Check, Sun, CloudRain, CloudFog, AlertCircle, Gauge } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  onSave: (newConfig: SystemConfig) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onResetDefaults,
}) => {
  const [localConfig, setLocalConfig] = React.useState<SystemConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">
              System Configuration & Calibration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm">
          {/* Section: Density Thresholds */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Traffic Density Classification Tiers
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Low Density Limit (Vehicles)
                </label>
                <input
                  type="number"
                  min={1}
                  max={localConfig.mediumThreshold - 1}
                  value={localConfig.lowThreshold}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, lowThreshold: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">0 to this value is LOW</span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Medium Density Limit (Vehicles)
                </label>
                <input
                  type="number"
                  min={localConfig.lowThreshold + 1}
                  max={50}
                  value={localConfig.mediumThreshold}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      mediumThreshold: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Above Low up to this is MEDIUM; beyond is HIGH</span>
              </div>
            </div>
          </div>

          {/* Section: Green Durations */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Adaptive Green Time Durations (Seconds)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Low Density</label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={localConfig.greenTimeLow}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, greenTimeLow: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Default: 15s</span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Medium Density</label>
                <input
                  type="number"
                  min={15}
                  max={60}
                  value={localConfig.greenTimeMedium}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      greenTimeMedium: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Default: 30s</span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">High Density</label>
                <input
                  type="number"
                  min={30}
                  max={90}
                  value={localConfig.greenTimeHigh}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      greenTimeHigh: parseInt(e.target.value) || 45,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Default: 45s</span>
              </div>
            </div>
          </div>

          {/* Section: Weather Condition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Weather Condition & Road Dynamics
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                Active: {localConfig.weather}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Clear */}
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, weather: 'clear' })}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  localConfig.weather === 'clear'
                    ? 'bg-emerald-500/15 border-emerald-500 text-slate-100 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Sun className={`w-5 h-5 ${localConfig.weather === 'clear' ? 'text-amber-400' : 'text-slate-500'}`} />
                    {localConfig.weather === 'clear' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <h4 className="font-bold text-xs mt-2 text-slate-200">Clear Weather</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dry pavement & normal friction</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5 font-mono text-slate-400">
                  <div>Speed: <strong className="text-slate-200">100%</strong></div>
                  <div>Buffer: <strong className="text-slate-200">14px</strong></div>
                </div>
              </button>

              {/* Rain */}
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, weather: 'rain' })}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  localConfig.weather === 'rain'
                    ? 'bg-sky-500/15 border-sky-500 text-slate-100 ring-2 ring-sky-500/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <CloudRain className={`w-5 h-5 ${localConfig.weather === 'rain' ? 'text-sky-400' : 'text-slate-500'}`} />
                    {localConfig.weather === 'rain' && (
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                    )}
                  </div>
                  <h4 className="font-bold text-xs mt-2 text-slate-200">Rain Weather</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Wet asphalt & reduced grip</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5 font-mono text-slate-400">
                  <div>Speed: <strong className="text-amber-300">78%</strong> (-22%)</div>
                  <div>Buffer: <strong className="text-sky-300">22px</strong> (+57%)</div>
                </div>
              </button>

              {/* Fog */}
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, weather: 'fog' })}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  localConfig.weather === 'fog'
                    ? 'bg-purple-500/15 border-purple-500 text-slate-100 ring-2 ring-purple-500/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <CloudFog className={`w-5 h-5 ${localConfig.weather === 'fog' ? 'text-purple-400' : 'text-slate-500'}`} />
                    {localConfig.weather === 'fog' && (
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <h4 className="font-bold text-xs mt-2 text-slate-200">Dense Fog</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Low visibility & caution speed</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] space-y-0.5 font-mono text-slate-400">
                  <div>Speed: <strong className="text-amber-300">70%</strong> (-30%)</div>
                  <div>Buffer: <strong className="text-purple-300">26px</strong> (+85%)</div>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              {localConfig.weather === 'clear' &&
                'Clear Weather: Vehicles cruise at nominal cruising speeds with standard road friction and crisp sensor visibility.'}
              {localConfig.weather === 'rain' &&
                'Rain Weather: Simulates reduced tire-asphalt traction. Vehicles accelerate gently, slow down earlier, and maintain a wider 22px queue buffer.'}
              {localConfig.weather === 'fog' &&
                'Fog Weather: Simulates low atmospheric visibility. Drivers exercise extreme caution with a 30% speed reduction, 95px deceleration distance, and a 26px safety buffer.'}
            </p>
          </div>

          {/* Section: Lane Calibration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. Lane Boundary Intersection Calibration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Center X Ratio ({localConfig.boundaryCenterX.toFixed(2)})
                </label>
                <input
                  type="range"
                  min={0.2}
                  max={0.8}
                  step={0.05}
                  value={localConfig.boundaryCenterX}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      boundaryCenterX: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Center Y Ratio ({localConfig.boundaryCenterY.toFixed(2)})
                </label>
                <input
                  type="range"
                  min={0.2}
                  max={0.8}
                  step={0.05}
                  value={localConfig.boundaryCenterY}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      boundaryCenterY: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Adapts North/South/East/West quadrant geometry to various camera angles.
            </p>
          </div>

          {/* Section: Tracking & Detections */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              5. AI Tracking & Visualization Settings
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={localConfig.enableTracking}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, enableTracking: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                Enable ByteTrack Vehicle ID Tracking (prevents double counting)
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={localConfig.showLabels}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, showLabels: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                Show Vehicle Class & Confidence Labels on Video
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={localConfig.audioFeedback}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, audioFeedback: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                Acoustic Chime on Signal Phase Change & Emergency Alert
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={localConfig.showScanlines}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, showScanlines: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                CCTV Monitor Scanline Grid Overlay
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to College Defaults
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
