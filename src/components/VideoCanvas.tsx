import React, { useRef, useEffect, useState } from 'react';
import {
  VehicleDetection,
  SystemConfig,
  SignalDecision,
  LightColor,
  LaneDirection,
  AppTheme,
} from '../types/traffic';
import {
  Layers,
  Crosshair,
  Sliders,
  Sun,
  Moon,
  Flame,
  Cpu,
  Activity,
  Compass,
  CloudRain,
  CloudFog,
} from 'lucide-react';

interface VideoCanvasProps {
  detections: VehicleDetection[];
  config: SystemConfig;
  onUpdateConfig: (partial: Partial<SystemConfig>) => void;
  isRunning: boolean;
  lampStates: Record<LaneDirection, LightColor>;
  decision: SignalDecision;
  theme?: AppTheme;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
  slant: number;
}

interface RainRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const CLASS_COLORS: Record<string, string> = {
  Car: '#38bdf8',
  Bus: '#f97316',
  Truck: '#c084fc',
  Motorcycle: '#34d399',
};

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  detections,
  config,
  onUpdateConfig,
  isRunning,
  lampStates,
  decision,
  theme = 'dark',
  canvasRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [latencyMs, setLatencyMs] = useState(13.8);
  const [fpsVal, setFpsVal] = useState(60.0);
  const [hoveredVehicle, setHoveredVehicle] = useState<VehicleDetection | null>(null);

  // Rain particle simulation state
  const rainDropsRef = useRef<RainDrop[]>([]);
  const ripplesRef = useRef<RainRipple[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Simulated CV runtime telemetry
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setLatencyMs(Number((12.5 + Math.random() * 2.5).toFixed(1)));
      setFpsVal(Number((59.2 + Math.random() * 1.5).toFixed(1)));
    }, 1200);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Main high-fidelity 4-way intersection rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const roadW = 180; // Total 4-way road width (2 lanes: 90px inbound, 90px outbound)
    const halfRoad = roadW / 2;
    const stopDist = halfRoad + 10;

    const isNight = config.visionMode === 'night';
    const isThermal = config.visionMode === 'thermal';
    const isRain = config.weather === 'rain';
    const isFog = config.weather === 'fog';

    // Delta time calculation for smooth atmospheric particles
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTimeRef.current) / 1000));
    lastFrameTimeRef.current = now;

    // Initialize multi-tier rain particle system if needed
    if (rainDropsRef.current.length === 0) {
      const drops: RainDrop[] = [];
      for (let i = 0; i < 220; i++) {
        const tier = i < 90 ? 1 : i < 180 ? 2 : 3;
        drops.push({
          x: Math.random() * (w + 200) - 100,
          y: Math.random() * (h + 100) - 50,
          speed: tier === 1 ? 650 + Math.random() * 250 : tier === 2 ? 950 + Math.random() * 300 : 1300 + Math.random() * 350,
          length: tier === 1 ? 16 + Math.random() * 12 : tier === 2 ? 30 + Math.random() * 16 : 48 + Math.random() * 20,
          width: tier === 1 ? 0.65 : tier === 2 ? 0.9 : 1.25,
          alpha: tier === 1 ? 0.18 + Math.random() * 0.12 : tier === 2 ? 0.28 + Math.random() * 0.16 : 0.38 + Math.random() * 0.22,
          slant: -0.16 + (Math.random() - 0.5) * 0.03,
        });
      }
      rainDropsRef.current = drops;
    }

    // 1. CLEAR & DRAW SURROUNDING TERRAIN / PAVEMENT
    ctx.clearRect(0, 0, w, h);

    if (isThermal) {
      ctx.fillStyle = '#080512';
    } else if (isNight) {
      ctx.fillStyle = isRain ? '#070a10' : '#0a0e17';
    } else if (isFog) {
      ctx.fillStyle = theme === 'light' ? '#cbd5e1' : '#1e2430';
    } else if (isRain) {
      ctx.fillStyle = theme === 'light' ? '#cbd5e1' : '#0a0e14';
    } else if (theme === 'light') {
      ctx.fillStyle = '#f1f5f9';
    } else {
      ctx.fillStyle = '#0f172a';
    }
    ctx.fillRect(0, 0, w, h);

    // Sidewalk curbs in corners
    const curbColor = isThermal
      ? '#160d2e'
      : isNight
      ? '#111827'
      : isFog
      ? (theme === 'light' ? '#94a3b8' : '#263040')
      : isRain
      ? (theme === 'light' ? '#94a3b8' : '#141c28')
      : theme === 'light'
      ? '#e2e8f0'
      : '#1e293b';
    ctx.fillStyle = curbColor;
    ctx.fillRect(0, 0, cx - halfRoad, cy - halfRoad);
    ctx.fillRect(cx + halfRoad, 0, w - (cx + halfRoad), cy - halfRoad);
    ctx.fillRect(0, cy + halfRoad, cx - halfRoad, h - (cy + halfRoad));
    ctx.fillRect(cx + halfRoad, cy + halfRoad, w - (cx + halfRoad), h - (cy + halfRoad));

    // Curb edge lines
    ctx.strokeStyle = isThermal
      ? '#f59e0b'
      : isNight
      ? '#1f2937'
      : isFog
      ? '#334155'
      : isRain
      ? (theme === 'light' ? '#64748b' : '#334155')
      : theme === 'light'
      ? '#cbd5e1'
      : '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, cx - halfRoad, cy - halfRoad);
    ctx.strokeRect(cx + halfRoad, 0, w - (cx + halfRoad), cy - halfRoad);
    ctx.strokeRect(0, cy + halfRoad, cx - halfRoad, h - (cy + halfRoad));
    ctx.strokeRect(cx + halfRoad, cy + halfRoad, w - (cx + halfRoad), h - (cy + halfRoad));

    // 2. ASPHALT ROADWAY (North-South & East-West Crossroad)
    const asphaltColor = isThermal
      ? '#120a24'
      : isNight
      ? (isRain ? '#090d14' : '#0b0f17')
      : isRain
      ? (theme === 'light' ? '#1e293b' : '#0f172a') // realistic wet dark slate asphalt
      : isFog
      ? (theme === 'light' ? '#475569' : '#222b38')
      : theme === 'light'
      ? '#334155' // realistic deep slate asphalt
      : '#1e2633';
    ctx.fillStyle = asphaltColor;
    // Vertical road (North-South)
    ctx.fillRect(cx - halfRoad, 0, roadW, h);
    // Horizontal road (East-West)
    ctx.fillRect(0, cy - halfRoad, w, roadW);

    // Subtle road edge borders
    ctx.strokeStyle = isThermal ? '#3b1d6e' : theme === 'light' ? '#475569' : '#273244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - halfRoad, 0); ctx.lineTo(cx - halfRoad, cy - halfRoad);
    ctx.moveTo(cx + halfRoad, 0); ctx.lineTo(cx + halfRoad, cy - halfRoad);
    ctx.moveTo(cx - halfRoad, cy + halfRoad); ctx.lineTo(cx - halfRoad, h);
    ctx.moveTo(cx + halfRoad, cy + halfRoad); ctx.lineTo(cx + halfRoad, h);
    ctx.moveTo(0, cy - halfRoad); ctx.lineTo(cx - halfRoad, cy - halfRoad);
    ctx.moveTo(0, cy + halfRoad); ctx.lineTo(cx - halfRoad, cy + halfRoad);
    ctx.moveTo(cx + halfRoad, cy - halfRoad); ctx.lineTo(w, cy - halfRoad);
    ctx.moveTo(cx + halfRoad, cy + halfRoad); ctx.lineTo(w, cy + halfRoad);
    ctx.stroke();

    // Junction center box
    ctx.fillStyle = asphaltColor;
    ctx.fillRect(cx - halfRoad, cy - halfRoad, roadW, roadW);

    // Wet Asphalt Pavement Sheen & Reflections (Rain Mode)
    if (isRain && !isThermal) {
      ctx.save();
      // Subtle wet pavement sheen on horizontal & vertical asphalt
      const sheenV = ctx.createLinearGradient(cx - halfRoad, 0, cx + halfRoad, 0);
      sheenV.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
      sheenV.addColorStop(0.5, 'rgba(224, 242, 254, 0.06)');
      sheenV.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
      ctx.fillStyle = sheenV;
      ctx.fillRect(cx - halfRoad, 0, roadW, h);

      const sheenH = ctx.createLinearGradient(0, cy - halfRoad, 0, cy + halfRoad);
      sheenH.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
      sheenH.addColorStop(0.5, 'rgba(224, 242, 254, 0.06)');
      sheenH.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
      ctx.fillStyle = sheenH;
      ctx.fillRect(0, cy - halfRoad, w, roadW);

      // Wet reflections of active signals onto wet road surface
      const drawWetSignalReflection = (x: number, y: number, col: string) => {
        const refGrad = ctx.createLinearGradient(x, y, x, y + 40);
        refGrad.addColorStop(0, col);
        refGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(x - 8, y, 16, 40);
      };

      const nsColor = decision.currentSignal === 'NORTH-SOUTH' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)';
      const ewColor = decision.currentSignal === 'EAST-WEST' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)';
      drawWetSignalReflection(cx + halfRoad - 20, cy - halfRoad, nsColor);
      drawWetSignalReflection(cx - halfRoad + 20, cy + halfRoad, nsColor);
      drawWetSignalReflection(cx - halfRoad, cy - halfRoad + 20, ewColor);
      drawWetSignalReflection(cx + halfRoad, cy + halfRoad - 20, ewColor);
      ctx.restore();
    }

    // 3. ROAD MARKINGS: Double solid yellow center divider lines
    ctx.strokeStyle = isThermal ? '#f59e0b' : '#eab308';
    ctx.lineWidth = 2;

    // North center divider
    ctx.beginPath();
    ctx.moveTo(cx - 2, 0);
    ctx.lineTo(cx - 2, cy - stopDist - 16);
    ctx.moveTo(cx + 2, 0);
    ctx.lineTo(cx + 2, cy - stopDist - 16);
    ctx.stroke();

    // South center divider
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + stopDist + 16);
    ctx.lineTo(cx - 2, h);
    ctx.moveTo(cx + 2, cy + stopDist + 16);
    ctx.lineTo(cx + 2, h);
    ctx.stroke();

    // West center divider
    ctx.beginPath();
    ctx.moveTo(0, cy - 2);
    ctx.lineTo(cx - stopDist - 16, cy - 2);
    ctx.moveTo(0, cy + 2);
    ctx.lineTo(cx - stopDist - 16, cy + 2);
    ctx.stroke();

    // East center divider
    ctx.beginPath();
    ctx.moveTo(cx + stopDist + 16, cy - 2);
    ctx.lineTo(w, cy - 2);
    ctx.moveTo(cx + stopDist + 16, cy + 2);
    ctx.lineTo(w, cy + 2);
    ctx.stroke();

    // 4. SOLID WHITE STOP LINES
    ctx.strokeStyle = isThermal ? '#fbbf24' : '#ffffff';
    ctx.lineWidth = 3;

    // North stop line (inbound: left side of North road, x from cx - halfRoad to cx)
    ctx.beginPath();
    ctx.moveTo(cx - halfRoad, cy - stopDist);
    ctx.lineTo(cx, cy - stopDist);
    ctx.stroke();

    // South stop line (inbound: right side of South road, x from cx to cx + halfRoad)
    ctx.beginPath();
    ctx.moveTo(cx, cy + stopDist);
    ctx.lineTo(cx + halfRoad, cy + stopDist);
    ctx.stroke();

    // East stop line (inbound: top side of East road, y from cy - halfRoad to cy)
    ctx.beginPath();
    ctx.moveTo(cx + stopDist, cy - halfRoad);
    ctx.lineTo(cx + stopDist, cy);
    ctx.stroke();

    // West stop line (inbound: bottom side of West road, y from cy to cy + halfRoad)
    ctx.beginPath();
    ctx.moveTo(cx - stopDist, cy);
    ctx.lineTo(cx - stopDist, cy + halfRoad);
    ctx.stroke();

    // 5. STANDARD ZEBRA CROSSWALKS
    ctx.fillStyle = isThermal ? '#8b5cf6' : '#ffffff';
    const stripeW = 8;
    const stripeGap = 6;
    // North crosswalk
    for (let x = cx - halfRoad + 4; x < cx + halfRoad - 4; x += stripeW + stripeGap) {
      ctx.fillRect(x, cy - stopDist - 16, stripeW, 12);
    }
    // South crosswalk
    for (let x = cx - halfRoad + 4; x < cx + halfRoad - 4; x += stripeW + stripeGap) {
      ctx.fillRect(x, cy + stopDist + 4, stripeW, 12);
    }
    // East crosswalk
    for (let y = cy - halfRoad + 4; y < cy + halfRoad - 4; y += stripeW + stripeGap) {
      ctx.fillRect(cx + stopDist + 4, y, 12, stripeW);
    }
    // West crosswalk
    for (let y = cy - halfRoad + 4; y < cy + halfRoad - 4; y += stripeW + stripeGap) {
      ctx.fillRect(cx - stopDist - 16, y, 12, stripeW);
    }

    // 6. ROAD DIRECTION ARROWS (Subtle traffic markings on asphalt)
    ctx.fillStyle = isThermal ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↓', cx - 45, cy - stopDist - 34);
    ctx.fillText('↑', cx + 45, cy + stopDist + 34);
    ctx.fillText('←', cx + stopDist + 34, cy - 45);
    ctx.fillText('→', cx - stopDist - 34, cy + 45);

    // 6.5 EMERGENCY CORRIDOR PREEMPTION OVERLAY (Clean CAD Hatch / Subtle Corridor Tint)
    if (decision.emergencyActive && decision.emergencyLane && !isThermal) {
      ctx.save();
      const el = decision.emergencyLane;
      const isAmbulanceAlert = decision.emergencyType === 'Ambulance';
      const corridorColor = isAmbulanceAlert ? 'rgba(14, 165, 233, 0.12)' : 'rgba(239, 68, 68, 0.12)';
      const accentBorder = isAmbulanceAlert ? 'rgba(14, 165, 233, 0.4)' : 'rgba(239, 68, 68, 0.4)';

      ctx.fillStyle = corridorColor;
      ctx.strokeStyle = accentBorder;
      ctx.lineWidth = 1;

      if (el === 'North') {
        ctx.fillRect(cx - halfRoad, 0, halfRoad, cy - stopDist);
        ctx.strokeRect(cx - halfRoad, 0, halfRoad, cy - stopDist);
      } else if (el === 'South') {
        ctx.fillRect(cx, cy + stopDist, halfRoad, h - (cy + stopDist));
        ctx.strokeRect(cx, cy + stopDist, halfRoad, h - (cy + stopDist));
      } else if (el === 'East') {
        ctx.fillRect(cx + stopDist, cy - halfRoad, w - (cx + stopDist), halfRoad);
        ctx.strokeRect(cx + stopDist, cy - halfRoad, w - (cx + stopDist), halfRoad);
      } else if (el === 'West') {
        ctx.fillRect(0, cy, cx - stopDist, halfRoad);
        ctx.strokeRect(0, cy, cx - stopDist, halfRoad);
      }

      // Minimal, professional CAD corridor label
      const elapsed = decision?.emergencyElapsedSec ?? 0;
      const badgeText = elapsed < 6
        ? `PRIORITY CORRIDOR · HOLD ${(6 - elapsed).toFixed(1)}s`
        : `PRIORITY CORRIDOR · CLEARING`;

      ctx.fillStyle = isAmbulanceAlert ? '#0284c7' : '#dc2626';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      if (el === 'North') {
        ctx.fillText(badgeText, cx - 45, cy - stopDist - 58);
      } else if (el === 'South') {
        ctx.fillText(badgeText, cx + 45, cy + stopDist + 58);
      } else if (el === 'East') {
        ctx.fillText(badgeText, cx + stopDist + 80, cy - 35);
      } else if (el === 'West') {
        ctx.fillText(badgeText, cx - stopDist - 80, cy + 35);
      }
      ctx.restore();
    }

    // 7. DRAW REALISTIC TRAFFIC SIGNAL POSTS ON JUNCTION CORNERS
    const drawCornerSignal = (
      postX: number,
      postY: number,
      lane: LaneDirection,
      directionLabel: string
    ) => {
      const state = lampStates[lane] || 'RED';
      const isRed = state === 'RED';
      const isYellowState = state === 'YELLOW';
      const isGreen = state === 'GREEN';

      ctx.save();
      // Matte dark chassis
      ctx.fillStyle = '#1e2430';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(postX - 9, postY - 26, 18, 52, 4);
      ctx.fill();
      ctx.stroke();

      // Corner direction initial
      ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(directionLabel[0], postX, postY - 30);

      // RED LENS (Top)
      ctx.fillStyle = isRed ? '#dc2626' : '#2b1010';
      ctx.beginPath();
      ctx.arc(postX, postY - 15, 5, 0, Math.PI * 2);
      ctx.fill();
      if (isRed) {
        ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // YELLOW LENS (Middle)
      ctx.fillStyle = isYellowState ? '#d97706' : '#2b1e0a';
      ctx.beginPath();
      ctx.arc(postX, postY, 5, 0, Math.PI * 2);
      ctx.fill();
      if (isYellowState) {
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // GREEN LENS (Bottom)
      ctx.fillStyle = isGreen ? '#16a34a' : '#0c2415';
      ctx.beginPath();
      ctx.arc(postX, postY + 15, 5, 0, Math.PI * 2);
      ctx.fill();
      if (isGreen) {
        ctx.strokeStyle = 'rgba(187, 247, 208, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    };

    // North light post (top-right corner of junction)
    drawCornerSignal(cx + halfRoad + 16, cy - halfRoad - 20, 'North', 'NORTH');
    // South light post (bottom-left corner of junction)
    drawCornerSignal(cx - halfRoad - 16, cy + halfRoad + 20, 'South', 'SOUTH');
    // East light post (top-left corner of junction)
    drawCornerSignal(cx - halfRoad - 20, cy - halfRoad - 16, 'East', 'EAST');
    // West light post (bottom-right corner of junction)
    drawCornerSignal(cx + halfRoad + 20, cy + halfRoad + 16, 'West', 'WEST');

    // 8. RENDER VEHICLES MOVING THROUGH THE JUNCTION
    for (const det of detections) {
      const [x1, y1, x2, y2] = det.bbox;
      const [vx, vy] = det.center;
      const vw = x2 - x1;
      const vh = y2 - y1;
      const isVertical = det.lane === 'North' || det.lane === 'South';

      // Headlights beam: on in Night mode, Fog (penetrating mist cone), and Rain
      const needHeadlights = isNight || isFog || isRain;
      if (needHeadlights && !isThermal) {
        ctx.save();
        const beamAlpha = isFog ? 0.28 : isNight ? 0.22 : 0.14;
        ctx.fillStyle = `rgba(254, 240, 138, ${beamAlpha})`;
        ctx.beginPath();
        const reach = isFog ? 60 : 75;
        const spread = isFog ? 22 : 15;
        if (det.lane === 'North') {
          // Heading down
          ctx.moveTo(x1 + 3, y2);
          ctx.lineTo(x1 - spread, y2 + reach);
          ctx.lineTo(x2 + spread, y2 + reach);
          ctx.lineTo(x2 - 3, y2);
        } else if (det.lane === 'South') {
          // Heading up
          ctx.moveTo(x1 + 3, y1);
          ctx.lineTo(x1 - spread, y1 - reach);
          ctx.lineTo(x2 + spread, y1 - reach);
          ctx.lineTo(x2 - 3, y1);
        } else if (det.lane === 'East') {
          // Heading left
          ctx.moveTo(x1, y1 + 3);
          ctx.lineTo(x1 - reach, y1 - spread);
          ctx.lineTo(x1 - reach, y2 + spread);
          ctx.lineTo(x1, y2 - 3);
        } else {
          // Heading right
          ctx.moveTo(x2, y1 + 3);
          ctx.lineTo(x2 + reach, y1 - spread);
          ctx.lineTo(x2 + reach, y2 + spread);
          ctx.lineTo(x2, y2 - 3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Realistic feathered tire water spray mist kicked up behind moving vehicles in Rain
      if (isRain && !isThermal && det.speed > 0.35) {
        ctx.save();
        let sx = vx;
        let sy = vy;
        if (det.lane === 'North') {
          sx = vx;
          sy = y1 - 3;
        } else if (det.lane === 'South') {
          sx = vx;
          sy = y2 + 3;
        } else if (det.lane === 'East') {
          sx = x2 + 3;
          sy = vy;
        } else {
          sx = x1 - 3;
          sy = vy;
        }
        const sprayRadius = Math.min(18, 8 + det.speed * 8);
        const spray = ctx.createRadialGradient(sx, sy, 1, sx, sy, sprayRadius);
        spray.addColorStop(0, 'rgba(224, 242, 254, 0.28)');
        spray.addColorStop(0.5, 'rgba(224, 242, 254, 0.12)');
        spray.addColorStop(1, 'rgba(224, 242, 254, 0)');
        ctx.fillStyle = spray;
        ctx.beginPath();
        ctx.arc(sx, sy, sprayRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Vehicle shadow
      ctx.fillStyle = isThermal ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.roundRect(x1 + 2, y1 + 3, vw, vh, 4);
      ctx.fill();

      // Emergency Vehicle Identification
      const isAmbulance =
        det.emergencyType === 'Ambulance' ||
        (det.isEmergency && det.class === 'Bus');
      const isFireBrigade =
        det.emergencyType === 'Fire Brigade' ||
        (det.isEmergency && det.class === 'Truck');

      // Vehicle shadow (subtle and realistic)
      ctx.fillStyle = isThermal ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(x1 + 1.5, y1 + 2, vw, vh, 2);
      ctx.fill();

      // Vehicle body color - realistic automotive palettes
      let bodyColor = '#475569';
      if (isThermal) {
        bodyColor = det.isEmergency ? '#ff0055' : '#fb923c';
      } else if (isAmbulance) {
        bodyColor = '#ffffff'; // Clean emergency white
      } else if (isFireBrigade) {
        bodyColor = '#dc2626'; // Real rescue engine red
      } else if (det.isEmergency) {
        bodyColor = '#dc2626';
      } else if (det.class === 'Bus') {
        bodyColor = '#d97706'; // Public transit amber-gold
      } else if (det.class === 'Truck') {
        bodyColor = '#334155'; // Freight charcoal / dark slate
      } else if (det.class === 'Motorcycle') {
        bodyColor = '#0f172a'; // Motorcycle dark frame
      } else {
        // Realistic car variety
        const carPalette = ['#64748b', '#3b82f6', '#1e293b', '#94a3b8', '#0f172a', '#475569'];
        bodyColor = carPalette[det.id % carPalette.length];
      }

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(x1, y1, vw, vh, 2);
      ctx.fill();

      // Subtle edge line on vehicle body for definition
      ctx.strokeStyle = isThermal ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Minimal windshield & window glass details
      ctx.fillStyle = isThermal ? '#fef08a' : isNight ? '#0b0f19' : '#1e293b';
      if (isVertical) {
        ctx.fillRect(x1 + 2.5, y1 + vh * 0.22, vw - 5, vh * 0.16);
        ctx.fillRect(x1 + 2.5, y1 + vh * 0.68, vw - 5, vh * 0.12);
      } else {
        ctx.fillRect(x1 + vw * 0.22, y1 + 2.5, vw * 0.16, vh - 5);
        ctx.fillRect(x1 + vw * 0.68, y1 + 2.5, vw * 0.12, vh - 5);
      }

      // Minimal emergency markings (Clean & non-cartoonish)
      if (isAmbulance && !isThermal) {
        // Subtle red cross on roof
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(vx - 1.5, vy - 4, 3, 8);
        ctx.fillRect(vx - 4, vy - 1.5, 8, 3);

        // Emergency light bar (Blue/Red minimal)
        const strobeState = Math.floor(performance.now() / 150) % 2 === 0;
        ctx.fillStyle = strobeState ? '#0284c7' : '#dc2626';
        if (isVertical) {
          ctx.fillRect(vx - 4, y1 + 3, 8, 2);
        } else {
          ctx.fillRect(x1 + 3, vy - 4, 2, 8);
        }
      } else if (isFireBrigade && !isThermal) {
        // Silver ladder equipment strip along roof
        ctx.fillStyle = '#94a3b8';
        if (isVertical) {
          ctx.fillRect(vx - 2, y1 + 8, 4, vh - 16);
        } else {
          ctx.fillRect(x1 + 8, vy - 2, vw - 16, 4);
        }

        // Minimal red beacon
        const strobeState = Math.floor(performance.now() / 150) % 2 === 0;
        ctx.fillStyle = strobeState ? '#ffffff' : '#f59e0b';
        if (isVertical) {
          ctx.fillRect(vx - 3, y1 + 3, 6, 2);
        } else {
          ctx.fillRect(x1 + 3, vy - 3, 2, 6);
        }
      }

      // Brake lights (glow subtle red when stopped)
      if (det.speed < 0.3) {
        ctx.fillStyle = '#ef4444';
        if (det.lane === 'North') {
          ctx.fillRect(x1 + 2, y1 - 1, 3, 1.5);
          ctx.fillRect(x2 - 5, y1 - 1, 3, 1.5);
        } else if (det.lane === 'South') {
          ctx.fillRect(x1 + 2, y2, 3, 1.5);
          ctx.fillRect(x2 - 5, y2, 3, 1.5);
        } else if (det.lane === 'East') {
          ctx.fillRect(x2, y1 + 2, 1.5, 3);
          ctx.fillRect(x2, y2 - 5, 1.5, 3);
        } else if (det.lane === 'West') {
          ctx.fillRect(x1 - 1.5, y1 + 2, 1.5, 3);
          ctx.fillRect(x1 - 1.5, y2 - 5, 1.5, 3);
        }
      }

      // AI Bounding Box & Class Badges (Thin 1px engineering style)
      if (config.showBoundingBoxes) {
        let strokeCol = isThermal ? '#fb923c' : '#38bdf8';
        if (isAmbulance || isFireBrigade || det.isEmergency) {
          strokeCol = '#ef4444';
        }

        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, y1, vw, vh);

        if (config.showLabels) {
          let badgeText = `${det.class.toLowerCase()} ${(det.confidence || 0.94).toFixed(2)}`;
          if (isAmbulance) {
            badgeText = 'ambulance [priority]';
          } else if (isFireBrigade) {
            badgeText = 'fire brigade [priority]';
          } else if (det.isEmergency) {
            badgeText = 'emergency';
          }

          ctx.font = '500 8px "JetBrains Mono", monospace';
          const tw = ctx.measureText(badgeText).width;
          ctx.fillStyle = det.isEmergency ? 'rgba(185, 28, 28, 0.95)' : 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(x1, Math.max(10, y1 - 11), tw + 4, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(badgeText, x1 + 2, Math.max(10, y1 - 3));
        }
      }

      // Centroid dot (small 2px)
      if (config.showCentroids) {
        ctx.fillStyle = det.isEmergency ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(vx, vy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 9. APPROACH QUEUE BADGES (Clean engineering labels on each approach)
    const drawApproachBadge = (
      bx: number,
      by: number,
      lane: LaneDirection,
      count: number
    ) => {
      const state = lampStates[lane] || 'RED';
      const isGreen = state === 'GREEN';
      const isYellowState = state === 'YELLOW';
      const statusColor = isGreen ? '#16a34a' : isYellowState ? '#d97706' : '#dc2626';

      ctx.save();
      const text = `${lane.toUpperCase()} · ${count} VEH · ${state}`;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2 - 6, by - 9, tw + 12, 18, 4);
      ctx.fill();
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bx, by);
      ctx.restore();
    };

    // Calculate queue counts for road labels
    const northQueue = detections.filter(
      (d) => d.lane === 'North' && d.center[1] < cy - stopDist
    ).length;
    const southQueue = detections.filter(
      (d) => d.lane === 'South' && d.center[1] > cy + stopDist
    ).length;
    const eastQueue = detections.filter(
      (d) => d.lane === 'East' && d.center[0] > cx + stopDist
    ).length;
    const westQueue = detections.filter(
      (d) => d.lane === 'West' && d.center[0] < cx - stopDist
    ).length;

    drawApproachBadge(cx - 45, 24, 'North', northQueue);
    drawApproachBadge(cx + 45, h - 24, 'South', southQueue);
    drawApproachBadge(w - 110, cy - 45, 'East', eastQueue);
    drawApproachBadge(110, cy + 45, 'West', westQueue);

    // 10. ATMOSPHERIC WEATHER VISUAL LAYERS
    if (isRain && !isThermal) {
      ctx.save();

      // Atmospheric moist rain-wash tint
      ctx.fillStyle = theme === 'light' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.18)';
      ctx.fillRect(0, 0, w, h);

      // A. Ground Ripple Puddle Splashes (perspective elliptical rings)
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += dt * 18;
        rip.alpha -= dt * 1.6;
        if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(224, 242, 254, ${Math.max(0, rip.alpha)})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.radius * 1.6, rip.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // B. Dynamic Falling Rain Streaks (Multi-depth parallax)
      const drops = rainDropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        drop.y += drop.speed * dt;
        drop.x += drop.speed * drop.slant * dt;

        // Check if hit bottom of screen
        if (drop.y > h + 30) {
          // If hit road or crosswalk, spawn puddle splash with ~30% probability
          if (
            ripples.length < 28 &&
            Math.random() < 0.32 &&
            (Math.abs(drop.x - cx) < halfRoad || Math.abs(drop.y - cy) < halfRoad)
          ) {
            ripples.push({
              x: drop.x,
              y: Math.min(h - 10, drop.y - 15),
              radius: 1.2,
              maxRadius: 4.5 + Math.random() * 5.5,
              alpha: 0.38 + Math.random() * 0.15,
            });
          }
          drop.y = -drop.length - Math.random() * 40;
          drop.x = Math.random() * (w + 200) - 100;
        }

        // Draw raindrop streak with tapered motion blur
        ctx.strokeStyle = `rgba(224, 242, 254, ${drop.alpha})`;
        ctx.lineWidth = drop.width;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.length * drop.slant, drop.y + drop.length);
        ctx.stroke();
      }

      ctx.restore();
    } else if (isFog && !isThermal) {
      // Dense atmospheric fog and drifting mist layers
      ctx.save();
      const t = performance.now() * 0.0005;

      // Soft ambient fog overlay
      ctx.fillStyle = 'rgba(203, 213, 225, 0.18)';
      ctx.fillRect(0, 0, w, h);

      // Drifting mist plumes
      const fogX1 = ((t * 70) % (w + 400)) - 200;
      const mist1 = ctx.createRadialGradient(fogX1, cy - 70, 30, fogX1, cy - 70, 260);
      mist1.addColorStop(0, 'rgba(226, 232, 240, 0.25)');
      mist1.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = mist1;
      ctx.fillRect(0, 0, w, h);

      const fogX2 = w - (((t * 50) % (w + 400)) - 200);
      const mist2 = ctx.createRadialGradient(fogX2, cy + 70, 40, fogX2, cy + 70, 240);
      mist2.addColorStop(0, 'rgba(226, 232, 240, 0.20)');
      mist2.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = mist2;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }, [detections, lampStates, config, theme]);

  return (
    <div className={`relative rounded-xl overflow-hidden border shadow-sm flex flex-col ${
      theme === 'light'
        ? 'bg-white border-slate-200 text-slate-900'
        : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Top Camera Telemetry & Overlay Bar */}
      <div className={`flex flex-wrap items-center justify-between px-4 py-2.5 border-b text-xs gap-2 ${
        theme === 'light'
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-slate-950/80 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-xs flex items-center gap-2 text-slate-950 dark:text-slate-100">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-600' : 'bg-slate-400'
              }`}
            />
            Live Junction View
          </span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <span>CAM-04 (4th & Grand)</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>60 FPS</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>In-Frame: <strong className="text-slate-950 dark:text-white font-bold">{detections.length} vehicles</strong></span>
          </div>
        </div>

        {/* Vision Mode & Weather Condition Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Weather condition buttons */}
          <div className={`flex items-center p-0.5 rounded-lg border text-[11px] mr-1 ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => onUpdateConfig({ weather: 'clear' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                (config.weather || 'clear') === 'clear'
                  ? theme === 'light' ? 'bg-slate-100 text-slate-950 font-bold' : 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Clear: Dry Asphalt"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              Clear
            </button>
            <button
              onClick={() => onUpdateConfig({ weather: 'rain' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                config.weather === 'rain'
                  ? theme === 'light' ? 'bg-slate-100 text-slate-950 font-bold' : 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Rain: Wet Road Conditions"
            >
              <CloudRain className="w-3 h-3 text-sky-500" />
              Rain
            </button>
            <button
              onClick={() => onUpdateConfig({ weather: 'fog' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                config.weather === 'fog'
                  ? theme === 'light' ? 'bg-slate-100 text-slate-950 font-bold' : 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fog: Low Visibility"
            >
              <CloudFog className="w-3 h-3 text-slate-500" />
              Fog
            </button>
          </div>

          <button
            onClick={() =>
              onUpdateConfig({ showBoundingBoxes: !config.showBoundingBoxes })
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              config.showBoundingBoxes
                ? theme === 'light' ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-slate-800 text-sky-300 border-slate-700'
                : theme === 'light' ? 'bg-white text-slate-700 border-slate-200 hover:text-slate-950' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Vehicle Detection Outlines"
          >
            <Layers className="w-3.5 h-3.5" />
            Vehicle Boxes
          </button>

          <button
            onClick={() => onUpdateConfig({ showCentroids: !config.showCentroids })}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              config.showCentroids
                ? theme === 'light' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-800 text-amber-300 border-slate-700'
                : theme === 'light' ? 'bg-white text-slate-700 border-slate-200 hover:text-slate-950' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Tracking Vectors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            Tracking Points
          </button>
        </div>
      </div>

      {/* Main Four-Way Intersection Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9.5] bg-slate-900 flex items-center justify-center overflow-hidden select-none"
      >
        <canvas
          ref={canvasRef}
          width={1000}
          height={580}
          className="w-full h-full object-contain"
        />

        {/* Compass & Junction Orientation HUD */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700 text-[10px] shadow-sm flex items-center gap-1.5 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono-numbers font-medium tracking-wide">
            N ↔ S | E ↔ W CROSSROAD
          </span>
        </div>

        {/* Weather Condition Overlay HUD Badge */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700 text-[10px] shadow-sm flex items-center gap-2 text-slate-300">
          {config.weather === 'rain' ? (
            <>
              <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-mono">RAIN · WET ROAD</span>
            </>
          ) : config.weather === 'fog' ? (
            <>
              <CloudFog className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">FOG · LOW VISIBILITY</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono">CLEAR · DRY ROAD</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
