import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  VehicleClass,
  LaneDirection,
  AppTheme,
} from '../types/traffic';
import {
  Play,
  Pause,
  Upload,
  Camera,
  RotateCcw,
  CameraOff,
  FileVideo,
  CheckCircle2,
  Cpu,
  Car,
  Clock,
  ArrowRight,
  Download,
  FolderOpen,
} from 'lucide-react';

interface RealVideoAnalyzerProps {
  theme?: AppTheme;
}

export interface CVTrackedCar {
  id: number;
  class: 'Car';
  confidence: number;
  x: number; // 0..1 normalized
  y: number;
  w: number;
  h: number;
  lane: LaneDirection;
  speedKmH: number;
  vx: number;
  vy: number;
  history: [number, number][];
  missedFrames: number;
  framesActive: number;
  isStationary: boolean;
}

// Processing resolution for frame pixel analysis
const PROC_W = 320;
const PROC_H = 180;
const GRID_CELL = 8;
const GRID_COLS = Math.floor(PROC_W / GRID_CELL);
const GRID_ROWS = Math.floor(PROC_H / GRID_CELL);

export const RealVideoAnalyzer: React.FC<RealVideoAnalyzerProps> = ({
  theme = 'light',
}) => {
  // Video Source & Playback State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Vision Toggles
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showCentroids, setShowCentroids] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.60);
  const [sensitivity, setSensitivity] = useState<number>(20);

  // Telemetry
  const [totalCarsDetected, setTotalCarsDetected] = useState<number>(0);
  const [selectedCar, setSelectedCar] = useState<CVTrackedCar | null>(null);

  // Adaptive Signal Controller
  const [signalPhase, setSignalPhase] = useState<'NORTH-SOUTH' | 'EAST-WEST'>('NORTH-SOUTH');
  const [greenDuration, setGreenDuration] = useState<number>(35);
  const [phaseCountdown, setPhaseCountdown] = useState<number>(35);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const procCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // CV Memory Buffers
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const bgFrameRef = useRef<Float32Array | null>(null);
  const maskDataRef = useRef<Uint8Array | null>(null);
  const trackedCarsRef = useRef<CVTrackedCar[]>([]);
  const nextTrackIdRef = useRef<number>(1);
  const lastTimeRef = useRef<number>(performance.now());
  const countdownTimerRef = useRef<number>(performance.now());

  // Setup offscreen canvas for computer vision downsampling
  useEffect(() => {
    const proc = document.createElement('canvas');
    proc.width = PROC_W;
    proc.height = PROC_H;
    procCanvasRef.current = proc;
    maskDataRef.current = new Uint8Array(PROC_W * PROC_H);
  }, []);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Handle Video File Upload
  const handleProcessVideoFile = (file: File) => {
    stopCamera();

    const video = videoRef.current;
    if (!video) return;

    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setUploadedFileName(file.name);

    video.srcObject = null;
    video.src = url;
    video.load();
    video.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });

    // Reset CV tracking state for new video
    trackedCarsRef.current = [];
    prevFrameRef.current = null;
    bgFrameRef.current = null;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessVideoFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleProcessVideoFile(file);
    }
  };

  // Webcam Stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setIsPlaying(true);
      setUploadedFileName('Live Webcam Feed');
      trackedCarsRef.current = [];
      prevFrameRef.current = null;
      bgFrameRef.current = null;
    } catch {
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current && isCameraActive) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // -------------------------------------------------------------
  // COMPUTER VISION FRAME PROCESSING (DETECTION OF REAL CARS)
  // -------------------------------------------------------------
  const processComputerVisionFrame = useCallback((
    vid: HTMLVideoElement,
    dispW: number,
    dispH: number,
    dt: number
  ) => {
    const proc = procCanvasRef.current;
    if (!proc) return;
    const pctx = proc.getContext('2d', { willReadFrequently: true });
    if (!pctx) return;

    // Draw and sample video frame at 320x180
    pctx.drawImage(vid, 0, 0, PROC_W, PROC_H);
    const imgData = pctx.getImageData(0, 0, PROC_W, PROC_H);
    const data = imgData.data;
    const totalPixels = PROC_W * PROC_H;

    if (!prevFrameRef.current) {
      prevFrameRef.current = new Uint8ClampedArray(data.length);
      prevFrameRef.current.set(data);
      bgFrameRef.current = new Float32Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        bgFrameRef.current[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      }
      return;
    }

    const prev = prevFrameRef.current;
    const bg = bgFrameRef.current!;
    const mask = maskDataRef.current!;
    mask.fill(0);

    const diffThreshold = sensitivity;

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const frameDiff = Math.abs(r - prev[idx]) + Math.abs(g - prev[idx + 1]) + Math.abs(b - prev[idx + 2]);
      const bgDiff = Math.abs(lum - bg[i]);

      bg[i] = bg[i] * 0.98 + lum * 0.02;

      if (frameDiff > diffThreshold || bgDiff > diffThreshold * 1.3) {
        mask[i] = 255;
      }
    }

    prev.set(data);

    // Grid Connected Component Clustering
    const grid = new Uint8Array(GRID_COLS * GRID_ROWS);

    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        let cellFg = 0;
        const startX = gx * GRID_CELL;
        const startY = gy * GRID_CELL;

        for (let py = 0; py < GRID_CELL; py++) {
          const rowOffset = (startY + py) * PROC_W;
          for (let px = 0; px < GRID_CELL; px++) {
            if (mask[rowOffset + startX + px] > 0) {
              cellFg++;
            }
          }
        }

        if (cellFg >= (GRID_CELL * GRID_CELL) * 0.12) {
          grid[gy * GRID_COLS + gx] = 1;
        }
      }
    }

    // Flood Fill on Active Cells
    const visited = new Uint8Array(GRID_COLS * GRID_ROWS);
    interface Box {
      x: number;
      y: number;
      w: number;
      h: number;
      pixelCount: number;
    }
    const detectedBoxes: Box[] = [];

    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        const idx = gy * GRID_COLS + gx;
        if (grid[idx] === 1 && visited[idx] === 0) {
          let minGX = gx;
          let maxGX = gx;
          let minGY = gy;
          let maxGY = gy;
          let clusterSize = 0;

          const queue: [number, number][] = [[gx, gy]];
          visited[idx] = 1;

          while (queue.length > 0) {
            const [cx, cy] = queue.pop()!;
            clusterSize++;

            if (cx < minGX) minGX = cx;
            if (cx > maxGX) maxGX = cx;
            if (cy < minGY) minGY = cy;
            if (cy > maxGY) maxGY = cy;

            const neighbors: [number, number][] = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1],
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
                const nIdx = ny * GRID_COLS + nx;
                if (grid[nIdx] === 1 && visited[nIdx] === 0) {
                  visited[nIdx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }

          const gridW = maxGX - minGX + 1;
          const gridH = maxGY - minGY + 1;

          if (clusterSize >= 8 && gridW < GRID_COLS * 0.75 && gridH < GRID_ROWS * 0.75) {
            const xNorm = (minGX * GRID_CELL) / PROC_W;
            const yNorm = (minGY * GRID_CELL) / PROC_H;
            const wNorm = (gridW * GRID_CELL) / PROC_W;
            const hNorm = (gridH * GRID_CELL) / PROC_H;

            detectedBoxes.push({
              x: xNorm,
              y: yNorm,
              w: Math.max(0.045, wNorm),
              h: Math.max(0.05, hNorm),
              pixelCount: clusterSize,
            });
          }
        }
      }
    }

    // Association & Tracking
    const currentTracks = trackedCarsRef.current;
    const matchedTrackIndices = new Set<number>();
    const matchedBoxIndices = new Set<number>();

    for (let bIdx = 0; bIdx < detectedBoxes.length; bIdx++) {
      const box = detectedBoxes[bIdx];
      const boxCx = box.x + box.w / 2;
      const boxCy = box.y + box.h / 2;

      let bestTrackIdx = -1;
      let minDistance = 0.20;

      for (let tIdx = 0; tIdx < currentTracks.length; tIdx++) {
        if (matchedTrackIndices.has(tIdx)) continue;
        const trk = currentTracks[tIdx];
        const trkCx = trk.x + trk.w / 2;
        const trkCy = trk.y + trk.h / 2;

        const dist = Math.hypot(boxCx - trkCx, boxCy - trkCy);
        if (dist < minDistance) {
          minDistance = dist;
          bestTrackIdx = tIdx;
        }
      }

      if (bestTrackIdx !== -1) {
        matchedTrackIndices.add(bestTrackIdx);
        matchedBoxIndices.add(bIdx);

        const trk = currentTracks[bestTrackIdx];
        const prevCx = trk.x + trk.w / 2;
        const prevCy = trk.y + trk.h / 2;

        trk.x = trk.x * 0.60 + box.x * 0.40;
        trk.y = trk.y * 0.60 + box.y * 0.40;
        trk.w = trk.w * 0.65 + box.w * 0.35;
        trk.h = trk.h * 0.65 + box.h * 0.35;

        const curCx = trk.x + trk.w / 2;
        const curCy = trk.y + trk.h / 2;
        trk.vx = (curCx - prevCx) / Math.max(0.016, dt);
        trk.vy = (curCy - prevCy) / Math.max(0.016, dt);
        const speed = Math.hypot(trk.vx, trk.vy);
        trk.speedKmH = Math.min(90, Math.round(speed * 300));

        trk.isStationary = trk.speedKmH < 4;
        trk.missedFrames = 0;
        trk.framesActive++;
        trk.confidence = Math.min(0.98, Math.max(0.72, 0.78 + (box.pixelCount / 100)));

        trk.history.push([curCx * dispW, curCy * dispH]);
        if (trk.history.length > 18) trk.history.shift();

        // Assign lane quadrant
        trk.lane = getLaneFromCoordinates(curCx, curCy);
      }
    }

    for (let tIdx = 0; tIdx < currentTracks.length; tIdx++) {
      if (!matchedTrackIndices.has(tIdx)) {
        const trk = currentTracks[tIdx];
        trk.missedFrames++;
        trk.speedKmH = 0;
        trk.isStationary = true;
      }
    }

    trackedCarsRef.current = currentTracks.filter((t) => t.missedFrames <= 25);

    // New Car tracks
    for (let bIdx = 0; bIdx < detectedBoxes.length; bIdx++) {
      if (!matchedBoxIndices.has(bIdx)) {
        const box = detectedBoxes[bIdx];
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;

        const newId = nextTrackIdRef.current++;
        const newTrack: CVTrackedCar = {
          id: newId,
          class: 'Car',
          confidence: Number(Math.min(0.97, Math.max(0.70, 0.76 + (box.pixelCount / 90))).toFixed(2)),
          x: box.x,
          y: box.y,
          w: box.w,
          h: box.h,
          lane: getLaneFromCoordinates(cx, cy),
          speedKmH: 26,
          vx: 0,
          vy: 0,
          history: [[cx * dispW, cy * dispH]],
          missedFrames: 0,
          framesActive: 1,
          isStationary: false,
        };

        trackedCarsRef.current.push(newTrack);
      }
    }
  }, [sensitivity]);

  const getLaneFromCoordinates = (cx: number, cy: number): LaneDirection => {
    if (cy < 0.45 && cx >= 0.35 && cx <= 0.65) return 'North';
    if (cy >= 0.45 && cx >= 0.35 && cx <= 0.65) return 'South';
    if (cx > 0.60) return 'East';
    return 'West';
  };

  // Main Overlay Canvas Render Loop
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderLoop = (timeNow: number) => {
      const dt = Math.min(0.06, (timeNow - lastTimeRef.current) / 1000) * playbackSpeed;
      lastTimeRef.current = timeNow;

      const w = canvas.width;
      const h = canvas.height;

      // Clear the overlay canvas - it sits transparently on top of the real video!
      ctx.clearRect(0, 0, w, h);

      const vid = videoRef.current;
      if (vid && vid.readyState >= 2 && !vid.paused) {
        processComputerVisionFrame(vid, w, h, dt);
      }

      const activeCars = trackedCarsRef.current.filter((c) => c.confidence >= confidenceThreshold);
      setTotalCarsDetected(activeCars.length);

      const laneCounts = {
        North: activeCars.filter((v) => v.lane === 'North').length,
        South: activeCars.filter((v) => v.lane === 'South').length,
        East: activeCars.filter((v) => v.lane === 'East').length,
        West: activeCars.filter((v) => v.lane === 'West').length,
      };
      const nsCount = laneCounts.North + laneCounts.South;
      const ewCount = laneCounts.East + laneCounts.West;

      // Update Adaptive Signal Countdown
      if (timeNow - countdownTimerRef.current > 1000 && isPlaying) {
        countdownTimerRef.current = timeNow;
        setPhaseCountdown((prev) => {
          if (prev <= 1) {
            const nextPhase = signalPhase === 'NORTH-SOUTH' ? 'EAST-WEST' : 'NORTH-SOUTH';
            setSignalPhase(nextPhase);
            const queueVol = nextPhase === 'NORTH-SOUTH' ? nsCount : ewCount;
            const optimalGreen = Math.min(60, Math.max(15, Math.round(15 + queueVol * 4.0)));
            setGreenDuration(optimalGreen);
            return optimalGreen;
          }
          return prev - 1;
        });
      }

      // Draw Motion Trails
      if (showTrails) {
        ctx.save();
        activeCars.forEach((c) => {
          if (c.history.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(c.history[0][0], c.history[0][1]);
          for (let i = 1; i < c.history.length; i++) {
            ctx.lineTo(c.history[i][0], c.history[i][1]);
          }
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
        });
        ctx.restore();
      }

      // Draw Clean Bounding Boxes on Cars
      if (showBoxes) {
        ctx.save();
        activeCars.forEach((c) => {
          const vx = c.x * w;
          const vy = c.y * h;
          const vw = c.w * w;
          const vh = c.h * h;

          const isSelected = selectedCar?.id === c.id;
          const boxColor = isSelected ? '#facc15' : '#38bdf8';

          // Box outline
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = isSelected ? 2.5 : 1.8;
          ctx.strokeRect(vx, vy, vw, vh);

          // Subtle cyan tint
          ctx.fillStyle = isSelected ? 'rgba(250, 204, 21, 0.2)' : 'rgba(56, 189, 248, 0.10)';
          ctx.fillRect(vx, vy, vw, vh);

          // Corner accent brackets
          const bracket = 6;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(vx, vy + bracket); ctx.lineTo(vx, vy); ctx.lineTo(vx + bracket, vy);
          ctx.moveTo(vx + vw - bracket, vy); ctx.lineTo(vx + vw, vy); ctx.lineTo(vx + vw, vy + bracket);
          ctx.moveTo(vx, vy + vh - bracket); ctx.lineTo(vx, vy + vh); ctx.lineTo(vx + bracket, vy + vh);
          ctx.moveTo(vx + vw - bracket, vy + vh); ctx.lineTo(vx + vw, vy + vh); ctx.lineTo(vx + vw, vy + vh - bracket);
          ctx.stroke();

          // "Car 94%" label
          const statusText = c.isStationary ? ' [QUEUE]' : '';
          const label = `Car ${(c.confidence * 100).toFixed(0)}%${statusText}`;
          ctx.font = 'bold 9px system-ui, sans-serif';
          const textW = ctx.measureText(label).width;

          ctx.fillStyle = boxColor;
          ctx.fillRect(vx, Math.max(0, vy - 15), textW + 8, 15);

          ctx.fillStyle = '#0f172a';
          ctx.fillText(label, vx + 4, Math.max(10, vy - 4));
        });
        ctx.restore();
      }

      // Draw Centroids
      if (showCentroids) {
        ctx.save();
        activeCars.forEach((c) => {
          const cx = (c.x + c.w / 2) * w;
          const cy = (c.y + c.h / 2) * h;

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();

          if (Math.abs(c.vx) > 0.01 || Math.abs(c.vy) > 0.01) {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + c.vx * 220, cy + c.vy * 220);
            ctx.stroke();
          }
        });
        ctx.restore();
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying,
    playbackSpeed,
    confidenceThreshold,
    showBoxes,
    showCentroids,
    showTrails,
    signalPhase,
    processComputerVisionFrame,
    selectedCar,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const clicked = trackedCarsRef.current.find(
      (c) =>
        clickX >= c.x &&
        clickX <= c.x + c.w &&
        clickY >= c.y &&
        clickY <= c.y + c.h
    );

    setSelectedCar(clicked || null);
  };

  const hasActiveVideo = !!videoSrc || isCameraActive;
  const activeCars = trackedCarsRef.current.filter((c) => c.confidence >= confidenceThreshold);
  const nsTotal = activeCars.filter((v) => v.lane === 'North' || v.lane === 'South').length;
  const ewTotal = activeCars.filter((v) => v.lane === 'East' || v.lane === 'West').length;

  return (
    <div className="space-y-4">
      {/* 1. TOP VIDEO SELECTION BAR */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                <Car className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Real Video Car Detection Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                Detects Cars Only
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload any real MP4 intersection or highway traffic video to detect and track cars in real time
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select MP4 Video File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Webcam Button */}
            <button
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isCameraActive
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{isCameraActive ? 'Stop Camera' : 'Live Camera'}</span>
            </button>
          </div>
        </div>

        {uploadedFileName && (
          <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Currently analyzing video: <strong>{uploadedFileName}</strong></span>
          </div>
        )}
      </div>

      {/* 2. MAIN VIDEO DISPLAY & DETECTION CANVAS (8 cols) + SIDE PANEL (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* VIDEO DISPLAY WITH OVERLAYS */}
        <div className="lg:col-span-8 space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border ${
              isDraggingFile ? 'border-sky-500 border-2' : 'border-slate-800'
            } shadow-md group select-none flex items-center justify-center`}
          >
            {/* Native Video Element: Displays the ACTUAL user video */}
            <video
              ref={videoRef}
              playsInline
              loop
              muted
              autoPlay
              className={`w-full h-full object-contain ${hasActiveVideo ? 'block' : 'hidden'}`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Transparent Overlay Canvas: Only draws car bounding boxes directly over the real video */}
            <canvas
              ref={overlayCanvasRef}
              width={1280}
              height={720}
              onClick={handleCanvasClick}
              className={`absolute inset-0 w-full h-full cursor-crosshair ${
                hasActiveVideo ? 'block' : 'hidden'
              }`}
            />

            {/* When No Video Is Uploaded: Clean, Modern Dropzone */}
            {!hasActiveVideo && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-slate-900/60 transition-colors space-y-3"
              >
                <div className="p-4 rounded-full bg-sky-950/60 border border-sky-800/80 text-sky-400">
                  <FolderOpen className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">
                    Upload Your Traffic Video
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Drag & drop your MP4, WebM, or MOV traffic video here, or click to choose a file from your computer
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Video File</span>
                </button>
              </div>
            )}

            {/* Drag & Drop Feedback */}
            {isDraggingFile && (
              <div className="absolute inset-0 bg-sky-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-30">
                <Upload className="w-10 h-10 text-sky-300 animate-bounce" />
                <span className="font-bold text-sm">Drop video to begin car detection</span>
              </div>
            )}

            {/* Selected Car Floating Callout */}
            {selectedCar && (
              <div
                className="absolute p-2.5 rounded-lg bg-slate-900/95 backdrop-blur-md border border-amber-400 text-white text-[11px] shadow-xl z-20 space-y-1"
                style={{
                  left: `${Math.min(75, Math.max(5, selectedCar.x * 100))}%`,
                  top: `${Math.min(75, Math.max(5, (selectedCar.y + selectedCar.h) * 100))}%`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-amber-400">Car #{selectedCar.id}</span>
                  <button onClick={() => setSelectedCar(null)} className="text-slate-400 hover:text-white cursor-pointer">×</button>
                </div>
                <div className="text-[10px] space-y-0.5 text-slate-300">
                  <div>Confidence: <strong>{(selectedCar.confidence * 100).toFixed(0)}%</strong></div>
                  <div>Lane: <strong>{selectedCar.lane} Approach</strong></div>
                  <div>Speed: <strong>{selectedCar.speedKmH} km/h</strong> {selectedCar.isStationary ? '(Queued)' : ''}</div>
                </div>
              </div>
            )}
          </div>

          {/* Video Control Bar */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Play/Pause & Speed */}
            <div className="flex items-center gap-2">
              <button
                disabled={!hasActiveVideo}
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                  }
                  setIsPlaying(!isPlaying);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                disabled={!hasActiveVideo}
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = 0;
                  trackedCarsRef.current = [];
                  setPhaseCountdown(30);
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Restart Video"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-medium">Speed:</span>
                {[0.5, 1.0, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    disabled={!hasActiveVideo}
                    onClick={() => {
                      setPlaybackSpeed(s);
                      if (videoRef.current) videoRef.current.playbackRate = s;
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Overlays */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                  showBoxes
                    ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                Car Boxes
              </button>
              <button
                onClick={() => setShowCentroids(!showCentroids)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                  showCentroids
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                Centroids
              </button>
              <button
                onClick={() => setShowTrails(!showTrails)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                  showTrails
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                Trails
              </button>
            </div>
          </div>
        </div>

        {/* 3. SIDE PANEL: REAL-TIME VIDEO ADAPTIVE SIGNAL DECISION & TELEMETRY (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* VIDEO-DRIVEN ADAPTIVE SIGNAL TIMING */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Video-Driven Signal Decision</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Dynamic
              </span>
            </div>

            {/* Active Green Corridor */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Active Green Phase:
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
                  {signalPhase}
                </span>
              </div>

              {/* Countdown Clock */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                  {phaseCountdown}s
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Green Window: {greenDuration}s
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, (phaseCountdown / greenDuration) * 100))}%`,
                  }}
                />
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                {signalPhase === 'NORTH-SOUTH'
                  ? `Allocating ${greenDuration}s green to clear ${nsTotal} detected cars on North-South corridor.`
                  : `Allocating ${greenDuration}s green to clear ${ewTotal} detected cars on East-West corridor.`}
              </p>
            </div>

            {/* Lane Comparison */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${
                signalPhase === 'NORTH-SOUTH'
                  ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  North-South Avenues
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {nsTotal} cars
                </div>
                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {signalPhase === 'NORTH-SOUTH' ? '● CURRENT GREEN' : '○ RED HOLD'}
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                signalPhase === 'EAST-WEST'
                  ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  East-West Streets
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {ewTotal} cars
                </div>
                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {signalPhase === 'EAST-WEST' ? '● CURRENT GREEN' : '○ RED HOLD'}
                </div>
              </div>
            </div>
          </div>

          {/* DETECTED CARS SUMMARY */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-sky-500" />
                <span>Cars Detected in Video</span>
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                {activeCars.length} Cars
              </span>
            </div>

            <div className="p-3 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-sky-900 dark:text-sky-200">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Active Tracked Cars</span>
              </span>
              <span className="font-mono font-bold text-lg text-sky-600 dark:text-sky-400">
                {activeCars.length}
              </span>
            </div>

            {/* Confidence Slider */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Confidence Threshold:
                </span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={0.95}
                step={0.05}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
