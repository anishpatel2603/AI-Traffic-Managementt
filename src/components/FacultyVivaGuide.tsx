import React, { useState } from 'react';
import { X, GraduationCap, BookOpen, HelpCircle, AlertCircle, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface FacultyVivaGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FacultyVivaGuide: React.FC<FacultyVivaGuideProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'script' | 'viva' | 'limits'>('script');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                College Project Presentation & Faculty Viva Guide
              </h2>
              <p className="text-xs text-slate-400">
                Viva preparation, presentation script, mathematical formulas, and Q&A
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/30 text-xs">
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'script'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Faculty Presentation Script
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'flow'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            System Pipeline & Formulas
          </button>

          <button
            onClick={() => setActiveTab('viva')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'viva'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Faculty Viva Q&A (Top 5)
          </button>

          <button
            onClick={() => setActiveTab('limits')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'limits'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Limitations & Future Scope
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* SCRIPT TAB */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                💡 <strong>Demonstration Strategy:</strong> Walk faculty through the problem (fixed timers cause fuel waste), introduce your AI solution, run the demo, and show how traffic density dynamically controls the green lights.
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider text-amber-400 mb-1">
                    Step 1: Problem Statement & Motivation (30–45s)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Good morning professors. Traditional traffic signal controllers rely on fixed-cycle timers (e.g., 30s green for every lane regardless of traffic). This leads to empty roads getting green lights while heavily congested lanes suffer massive delays. Our prototype, <strong>AI Smart Traffic Signal</strong>, solves this using real-time Computer Vision and Adaptive Queue Scheduling."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider text-amber-400 mb-1">
                    Step 2: Live Prototype Demonstration (1 min)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Here in our dashboard, we input video footage of an intersection. As the video processes, our YOLO model detects each vehicle (Cars, Buses, Trucks, Motorcycles) in real time. We calculate each vehicle's centroid $(C_x, C_y)$ and map it into its respective quadrant: North, South, East, or West."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider text-amber-400 mb-1">
                    Step 3: Density & Adaptive Signal Timing (1 min)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Notice the four statistic cards: North has 25 vehicles (High Density), South has 18 (Medium), while East and West only have 7 and 3 (Low). The system automatically evaluates corridor demand: North-South total is 43 vs East-West 10. Consequently, the AI overrides the signal, granting Green to North-South for an optimized 45 seconds, holding East-West on Red."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider text-amber-400 mb-1">
                    Step 4: Camera Angle Calibration Proof (30s)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Because real traffic cameras are mounted at varying heights and tilts, our lane boundaries are not hardcoded. By adjusting the center anchor slider, we can re-calibrate the quadrant boundaries to fit any roadside camera viewpoint."
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PIPELINE & FORMULAS TAB */}
          {activeTab === 'flow' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                End-to-End Computational Pipeline
              </h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono-numbers text-xs text-slate-300 space-y-2">
                <div>1. Video Frame Ingestion: <span className="text-slate-400">OpenCV VideoCapture</span></div>
                <div>2. Object Detection: <span className="text-sky-400">YOLOv8 Nano (yolov8n.pt)</span></div>
                <div>3. Class Filter: <span className="text-emerald-400">[Car, Bus, Truck, Motorcycle] (COCO classes 2, 5, 7, 3)</span></div>
                <div>4. Centroid Math: <span className="text-amber-400">Cx = (x1 + x2)/2, Cy = (y1 + y2)/2</span></div>
                <div>5. Quadrant Mapping: <span className="text-purple-400">Dominant vector angle relative to intersection anchor (cx, cy)</span></div>
                <div>6. Density Classification: <span className="text-rose-400">Low (0-5), Medium (6-15), High (16+)</span></div>
                <div>7. Green Light Duration: <span className="text-sky-400">T_green = Base + Congestion_Bonus</span></div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Dynamic Green Time Formula
                </h4>
                <p className="text-xs text-slate-300 font-mono-numbers">
                  T_green(density) = &#123; 15s if LOW; 30s if MEDIUM; min(60s, 45s + 1.5 * (N - 15)) if HIGH &#125;
                </p>
                <p className="text-[11px] text-slate-400">
                  This guarantees that empty or low-demand lanes do not waste city cycle time (minimum 15s), while high-congestion lanes receive adequate clearance time up to 60s.
                </p>
              </div>
            </div>
          )}

          {/* VIVA QUESTIONS TAB */}
          {activeTab === 'viva' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400">
                  Q1: Why did you choose YOLOv8 Nano instead of Faster R-CNN or SSD?
                </h4>
                <p className="text-xs text-slate-300">
                  <strong>Answer:</strong> "YOLOv8n has only ~3.2M parameters and achieves 37.3 mAP while running at over 60 FPS on standard student laptops. Faster R-CNN is a two-stage detector with higher latency (~10-15 FPS), making it impractical for real-time edge traffic controllers."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400">
                  Q2: How does the system prevent counting the same vehicle multiple times?
                </h4>
                <p className="text-xs text-slate-300">
                  <strong>Answer:</strong> "We integrate ByteTrack object tracking (`model.track(persist=True)`). ByteTrack assigns a persistent unique Tracking ID (e.g. ID #14) to each vehicle across continuous frames using Kalman filters and IoU matching, avoiding redundant duplicate counts."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400">
                  Q3: How does emergency preemption work for Ambulances and Fire Brigades?
                </h4>
                <p className="text-xs text-slate-300">
                  <strong>Answer:</strong> "Our system implements automated Emergency Signal Preemption (ESP). When an Ambulance or Fire Brigade is detected approaching from any corridor (North, South, East, West), the AI instantly locks conflicting crossroads to Red, clears the queue ahead, and forces an immediate Green wave for the emergency corridor. Audio sirens and strobe lights alert road users until the emergency vehicle safely clears the intersection, after which normal adaptive timing resumes automatically."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400">
                  Q4: How do you handle adverse weather conditions (Rain, Fog, Night)?
                </h4>
                <p className="text-xs text-slate-300">
                  <strong>Answer:</strong> "In rain and fog, road surface friction and visibility decrease. Our simulation dynamically models lower vehicle acceleration, longer braking distances (stopping buffer expands from 14px to 22-26px), earlier deceleration triggers, and realistic computer vision atmospheric confidence attenuation with volumetric headlight scattering."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400">
                  Q5: Does this project rely on any external paid or third-party cloud APIs?
                </h4>
                <p className="text-xs text-slate-300">
                  <strong>Answer:</strong> "No external cloud or paid APIs are used. Everything runs 100% client-side in the browser utilizing HTML5 Canvas 2D for high-speed rendering, the Web Audio API for programmatic siren and chime sound synthesis, and multi-agent physics loops with local Computer Vision algorithms—meaning zero network latency, offline capability, and no recurring API costs."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-400">
                  Q6: Why does the emergency preemption feature persist for at least 6 seconds?
                </h4>
                <p className="text-xs text-slate-300">
                  <strong>Answer:</strong> "In compliance with IRC (Indian Roads Congress) and MUTCD standards, emergency preemption systems mandate a <strong>Minimum Green Preemption Hold Interval (guaranteed ≥ 6 seconds)</strong>. This safety lock prevents dangerous signal fluttering, eliminates the driver 'dilemma zone', guarantees pedestrian crosswalk clearance, and ensures high-inertia emergency vehicles (ambulances and 15-tonne fire engines) have sufficient physical window to enter and safely clear the crossroad before adaptive phase timing resumes."
                </p>
              </div>
            </div>
          )}

          {/* LIMITATIONS TAB */}
          {activeTab === 'limits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wide">
                  Known Prototype Limitations
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>Occlusion:</strong> Large vehicles (like buses and containers) can temporarily occlude smaller two-wheelers behind them.</li>
                  <li><strong>Single-Camera Perspective:</strong> A single 2D camera view has perspective foreshortening. 3D bounding boxes would require stereo or LiDAR.</li>
                  <li><strong>Simulation Boundary:</strong> This is a prototype and simulation only; it does not interface with municipal SCATS or physical relay switches.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                  Proposed Future Improvements
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>Edge Hardware:</strong> Deploying the pipeline onto NVIDIA Jetson Orin Nano with TensorRT acceleration for sub-10ms inference.</li>
                  <li><strong>Multi-Intersection Coordination:</strong> Implementing Multi-Agent Reinforcement Learning (MARL) across adjacent signals for coordinated green waves.</li>
                  <li><strong>V2X Communication:</strong> Vehicle-to-Infrastructure telemetry for autonomous connected vehicle platooning.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
