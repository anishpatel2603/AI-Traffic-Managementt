/**
 * Full Python source code catalog for the college project prototype
 */

export interface PythonFileItem {
  path: string;
  name: string;
  language: string;
  description: string;
  content: string;
}

export const PYTHON_PROJECT_FILES: PythonFileItem[] = [
  {
    path: 'app.py',
    name: 'app.py',
    language: 'python',
    description: 'Main Streamlit dashboard application with video processing loop and UI',
    content: `"""
app.py
AI Smart Traffic Signal - AI-Based Adaptive Traffic Management System
College AI Project Prototype
Uses: Streamlit, OpenCV, YOLO (Ultralytics), NumPy, Pandas
"""

import os
import tempfile
import time
import cv2
import numpy as np
import pandas as pd
import streamlit as st

from utils.lane_detector import LaneDetector
from utils.signal_controller import TrafficSignalController
from utils.traffic_analyzer import TrafficAnalyzer
from utils.demo_generator import create_synthetic_traffic_video

# Page Configuration & Styling
st.set_page_config(
    page_title="AI Smart Traffic Signal",
    page_icon="🚦",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-title { font-size: 2.2rem; font-weight: 800; color: #f8fafc; margin-bottom: 0.2rem; }
    .sub-title { font-size: 1.05rem; color: #94a3b8; margin-bottom: 1.5rem; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-val { font-size: 2rem; font-weight: 700; font-family: monospace; }
    .density-high { color: #ef4444; }
    .density-med { color: #f59e0b; }
    .density-low { color: #10b981; }
    .light-housing { background: #0f172a; border: 2px solid #334155; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 68px; margin: 0 auto; }
    .bulb { width: 36px; height: 36px; border-radius: 50%; opacity: 0.25; transition: all 0.3s ease; }
    .bulb-red { background: #ef4444; }
    .bulb-yellow { background: #eab308; }
    .bulb-green { background: #22c55e; }
    .bulb-active { opacity: 1.0; box-shadow: 0 0 16px 4px currentColor; }
</style>
""", unsafe_allow_html=True)

st.sidebar.title("⚙️ System Controls")
low_thresh = st.sidebar.slider("Low Threshold (Max)", 1, 10, 5)
med_thresh = st.sidebar.slider("Medium Threshold (Max)", low_thresh + 1, 25, 15)
green_low = st.sidebar.number_input("Low Density Green (s)", 5, 30, 15)
green_med = st.sidebar.number_input("Medium Density Green (s)", 15, 60, 30)
green_high = st.sidebar.number_input("High Density Green (s)", 30, 90, 45)
split_x = st.sidebar.slider("Horizontal Center Ratio", 0.2, 0.8, 0.5, 0.05)
split_y = st.sidebar.slider("Vertical Center Ratio", 0.2, 0.8, 0.5, 0.05)
conf_thresh = st.sidebar.slider("YOLO Confidence", 0.15, 0.90, 0.35, 0.05)
enable_tracking = st.sidebar.checkbox("Enable Vehicle Tracking (ByteTrack)", value=True)

controller = TrafficSignalController(low_thresh, med_thresh, int(green_low), int(green_med), int(green_high))

st.markdown('<div class="main-title">🚦 AI SMART TRAFFIC SIGNAL</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">AI-Based Adaptive Traffic Management System</div>', unsafe_allow_html=True)

col_input1, col_input2 = st.columns([2, 1])
with col_input1:
    uploaded_file = st.file_uploader("Upload Traffic Video (MP4, AVI, MOV)", type=["mp4", "avi", "mov"])
with col_input2:
    st.markdown("<div style='height: 28px'></div>", unsafe_allow_html=True)
    use_demo = st.button("🎬 Use Demo Video")

if "analysis_running" not in st.session_state:
    st.session_state.analysis_running = False
if "video_path" not in st.session_state:
    st.session_state.video_path = None

if uploaded_file is not None:
    tfile = tempfile.NamedTemporaryFile(delete=False, suffix=f".{uploaded_file.name.split('.')[-1]}")
    tfile.write(uploaded_file.read())
    st.session_state.video_path = tfile.name
    st.success(f"Loaded: {uploaded_file.name}")
elif use_demo:
    demo_path = os.path.join(tempfile.gettempdir(), "demo_traffic.mp4")
    if not os.path.exists(demo_path):
        create_synthetic_traffic_video(output_path=demo_path, num_frames=120)
    st.session_state.video_path = demo_path
    st.info("Loaded Built-in Demo Intersection Video")

col_ctrl1, col_ctrl2, col_ctrl3, _ = st.columns([1, 1, 1, 3])
with col_ctrl1:
    start_clicked = st.button("▶ Start Analysis", type="primary", use_container_width=True)
with col_ctrl2:
    stop_clicked = st.button("⏹ Stop Analysis", use_container_width=True)
with col_ctrl3:
    reset_clicked = st.button("🔄 Reset", use_container_width=True)

if start_clicked:
    if st.session_state.video_path is None:
        st.error("Please upload a video or click 'Use Demo Video' first!")
    else:
        st.session_state.analysis_running = True
if stop_clicked:
    st.session_state.analysis_running = False
if reset_clicked:
    st.session_state.analysis_running = False
    st.session_state.video_path = None
    st.rerun()

col_video, col_signals = st.columns([3, 2])
with col_video:
    st.subheader("Traffic Video & AI Detection")
    video_placeholder = st.empty()
with col_signals:
    st.subheader("Signal Decision & Lights")
    decision_placeholder = st.empty()
    lights_placeholder = st.empty()

st.divider()
st.subheader("Lane-Wise Traffic Statistics")
stats_placeholder = st.empty()

col_chart, col_summary = st.columns([1, 1])
with col_chart:
    st.subheader("Traffic Density Chart")
    chart_placeholder = st.empty()
with col_summary:
    st.subheader("Final Decision Summary Table")
    table_placeholder = st.empty()

if st.session_state.analysis_running and st.session_state.video_path:
    cap = cv2.VideoCapture(st.session_state.video_path)
    if not cap.isOpened():
        st.error("Error: Could not open the specified video file.")
        st.session_state.analysis_running = False
    else:
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 960
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 540
        lane_detector = LaneDetector(frame_width=width, frame_height=height)
        lane_detector.update_boundaries(cx_ratio=split_x, cy_ratio=split_y)
        analyzer = TrafficAnalyzer(model_name="yolov8n.pt", confidence=conf_thresh)

        while cap.isOpened() and st.session_state.analysis_running:
            ret, frame = cap.read()
            if not ret or frame is None:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = lane_detector.draw_lanes(frame, alpha=0.2)
            annotated_frame, lane_counts, class_counts, detections = analyzer.process_frame(
                frame, lane_detector, use_tracking=enable_tracking
            )
            decision = controller.decide_signals(lane_counts)

            frame_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
            video_placeholder.image(frame_rgb, channels="RGB", use_container_width=True)

            with decision_placeholder.container():
                st.markdown(f"""
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px;">
                    <div style="font-size: 0.85rem; color: #94a3b8;">CURRENT SIGNAL</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">🔴 {decision['current_signal']}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 10px;">RECOMMENDED SIGNAL</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #22c55e;">🟢 {decision['recommended_signal']}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 10px;">RECOMMENDED GREEN TIME</div>
                    <div style="font-size: 1.6rem; font-weight: 800; font-family: monospace; color: #38bdf8;">
                        ⏱️ {decision['recommended_green_time']} seconds
                    </div>
                </div>
                """, unsafe_allow_html=True)

            with stats_placeholder.container():
                c1, c2, c3, c4 = st.columns(4)
                for (title, key, c) in [("NORTH", "North", c1), ("SOUTH", "South", c2), ("EAST", "East", c3), ("WEST", "West", c4)]:
                    with c:
                        st.metric(title, f"{lane_counts.get(key, 0)} vehicles", f"Density: {decision['densities'].get(key, 'LOW')}")

            df_chart = pd.DataFrame({"Lane": ["North", "South", "East", "West"], "Vehicles": [lane_counts.get(k, 0) for k in ["North", "South", "East", "West"]]})
            chart_placeholder.bar_chart(df_chart.set_index("Lane"))

            df_table = pd.DataFrame([{"Lane": k, "Vehicles": lane_counts.get(k, 0), "Density": decision['densities'][k], "Signal": decision['signal_states'][k]} for k in ["North", "South", "East", "West"]])
            table_placeholder.dataframe(df_table, use_container_width=True, hide_index=True)
            time.sleep(0.04)

        cap.release()
`
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    language: 'plaintext',
    description: 'Python package dependencies for student laptop installation',
    content: `streamlit>=1.32.0
ultralytics>=8.1.0
opencv-python-headless>=4.9.0.80
numpy>=1.24.0
pandas>=2.0.0
Pillow>=10.0.0
matplotlib>=3.8.0`
  },
  {
    path: 'utils/lane_detector.py',
    name: 'lane_detector.py',
    language: 'python',
    description: 'Divides video frame into North, South, East, West quadrants and draws overlays',
    content: `"""
utils/lane_detector.py
Handles lane boundary definitions, vehicle-to-lane assignment,
and drawing of lane zones on video frames.
"""

from typing import Tuple
import cv2
import numpy as np

class LaneDetector:
    def __init__(self, frame_width: int = 1280, frame_height: int = 720):
        self.width = frame_width
        self.height = frame_height
        self.update_boundaries(cx_ratio=0.5, cy_ratio=0.5)

    def update_boundaries(self, cx_ratio: float = 0.5, cy_ratio: float = 0.5):
        self.cx = int(self.width * cx_ratio)
        self.cy = int(self.height * cy_ratio)

    def get_lane_for_point(self, pt: Tuple[int, int]) -> str:
        x, y = pt
        dx = x - self.cx
        dy = y - self.cy
        if abs(dy) >= abs(dx):
            return "North" if dy < 0 else "South"
        else:
            return "West" if dx < 0 else "East"

    def draw_lanes(self, frame: np.ndarray, alpha: float = 0.25) -> np.ndarray:
        overlay = frame.copy()
        h, w = frame.shape[:2]
        cx, cy = self.cx, self.cy

        poly_north = np.array([[0, 0], [w, 0], [cx, cy]], dtype=np.int32)
        poly_south = np.array([[0, h], [w, h], [cx, cy]], dtype=np.int32)
        poly_west  = np.array([[0, 0], [0, h], [cx, cy]], dtype=np.int32)
        poly_east  = np.array([[w, 0], [w, h], [cx, cy]], dtype=np.int32)

        cv2.fillPoly(overlay, [poly_north], (220, 150, 40))
        cv2.fillPoly(overlay, [poly_south], (60, 210, 80))
        cv2.fillPoly(overlay, [poly_east], (30, 150, 255))
        cv2.fillPoly(overlay, [poly_west], (210, 80, 180))

        cv2.addWeighted(overlay, alpha, frame, 1.0 - alpha, 0, frame)
        cv2.line(frame, (0, 0), (w, h), (255, 255, 255), 1, cv2.LINE_AA)
        cv2.line(frame, (w, 0), (0, h), (255, 255, 255), 1, cv2.LINE_AA)
        cv2.circle(frame, (cx, cy), 6, (0, 255, 255), -1)
        return frame`
  },
  {
    path: 'utils/signal_controller.py',
    name: 'signal_controller.py',
    language: 'python',
    description: 'Calculates density, corridor priorities, and recommended green durations',
    content: `"""
utils/signal_controller.py
Calculates traffic density, evaluates signal priorities,
and determines recommended green light timing.
"""

from typing import Dict, Any

class TrafficSignalController:
    def __init__(
        self,
        low_threshold: int = 5,
        medium_threshold: int = 15,
        green_time_low: int = 15,
        green_time_medium: int = 30,
        green_time_high: int = 45,
    ):
        self.low_threshold = low_threshold
        self.medium_threshold = medium_threshold
        self.green_times = {
            "LOW": green_time_low,
            "MEDIUM": green_time_medium,
            "HIGH": green_time_high,
        }

    def calculate_density(self, count: int) -> str:
        if count <= self.low_threshold:
            return "LOW"
        elif count <= self.medium_threshold:
            return "MEDIUM"
        else:
            return "HIGH"

    def calculate_green_time(self, density: str, count: int = 0) -> int:
        base_time = self.green_times.get(density, 15)
        if density == "HIGH" and count > self.medium_threshold:
            bonus = min(15, int((count - self.medium_threshold) * 1.5))
            return min(60, base_time + bonus)
        return base_time

    def decide_signals(self, lane_counts: Dict[str, int]) -> Dict[str, Any]:
        lanes = ["North", "South", "East", "West"]
        densities = {lane: self.calculate_density(lane_counts.get(lane, 0)) for lane in lanes}

        ns_count = lane_counts.get("North", 0) + lane_counts.get("South", 0)
        ew_count = lane_counts.get("East", 0) + lane_counts.get("West", 0)

        highest_lane = max(lanes, key=lambda l: lane_counts.get(l, 0))
        highest_count = lane_counts.get(highest_lane, 0)
        highest_density = densities[highest_lane]

        if ns_count >= ew_count:
            recommended_signal = "NORTH-SOUTH"
            current_simulated_signal = "EAST-WEST"
            green_lanes = ["North", "South"]
            max_corridor_density = "HIGH" if (densities["North"] == "HIGH" or densities["South"] == "HIGH") else (
                "MEDIUM" if (densities["North"] == "MEDIUM" or densities["South"] == "MEDIUM") else "LOW"
            )
            green_duration = self.calculate_green_time(max_corridor_density, max(lane_counts.get("North", 0), lane_counts.get("South", 0)))
        else:
            recommended_signal = "EAST-WEST"
            current_simulated_signal = "NORTH-SOUTH"
            green_lanes = ["East", "West"]
            max_corridor_density = "HIGH" if (densities["East"] == "HIGH" or densities["West"] == "HIGH") else (
                "MEDIUM" if (densities["East"] == "MEDIUM" or densities["West"] == "MEDIUM") else "LOW"
            )
            green_duration = self.calculate_green_time(max_corridor_density, max(lane_counts.get("East", 0), lane_counts.get("West", 0)))

        signal_states = {lane: ("GREEN" if lane in green_lanes else "RED") for lane in lanes}

        return {
            "lane_counts": lane_counts,
            "densities": densities,
            "highest_lane": highest_lane,
            "highest_count": highest_count,
            "highest_density": highest_density,
            "ns_count": ns_count,
            "ew_count": ew_count,
            "current_signal": current_simulated_signal,
            "recommended_signal": recommended_signal,
            "recommended_green_time": green_duration,
            "signal_states": signal_states,
        }`
  },
  {
    path: 'utils/traffic_analyzer.py',
    name: 'traffic_analyzer.py',
    language: 'python',
    description: 'YOLOv8 vehicle detection, class filtering, and ByteTrack deduplication',
    content: `"""
utils/traffic_analyzer.py
Performs YOLO object detection on traffic frames, filters vehicle classes,
calculates center points, assigns vehicles to lanes, and tracks vehicles.
"""

from typing import Dict, List, Tuple, Any
import cv2
import numpy as np

VEHICLE_CLASS_IDS = {2: "Car", 3: "Motorcycle", 5: "Bus", 7: "Truck"}
CLASS_COLORS = {"Car": (59, 130, 246), "Bus": (234, 88, 12), "Truck": (168, 85, 247), "Motorcycle": (16, 185, 129)}

class TrafficAnalyzer:
    def __init__(self, model_name: str = "yolov8n.pt", confidence: float = 0.35):
        self.confidence = confidence
        self.model_name = model_name
        self.model = None
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_name)
        except Exception as e:
            print(f"[TrafficAnalyzer] Error loading YOLO: {e}")

    def process_frame(self, frame: np.ndarray, lane_detector, use_tracking: bool = True):
        lane_counts = {"North": 0, "South": 0, "East": 0, "West": 0}
        class_counts = {"Car": 0, "Bus": 0, "Truck": 0, "Motorcycle": 0}
        detections = []
        if self.model is None:
            return frame, lane_counts, class_counts, detections

        results = self.model.track(source=frame, persist=True, classes=list(VEHICLE_CLASS_IDS.keys()), conf=self.confidence, verbose=False) if use_tracking else self.model(source=frame, classes=list(VEHICLE_CLASS_IDS.keys()), conf=self.confidence, verbose=False)

        annotated_frame = frame.copy()
        if results and len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for i in range(len(boxes)):
                box = boxes[i]
                cls_id = int(box.cls[0].item())
                if cls_id not in VEHICLE_CLASS_IDS:
                    continue
                cls_name = VEHICLE_CLASS_IDS[cls_id]
                class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                x1, y1, x2, y2 = xyxy
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)
                lane = lane_detector.get_lane_for_point((cx, cy))
                lane_counts[lane] = lane_counts.get(lane, 0) + 1
                track_id = int(box.id[0].item()) if (box.id is not None) else (i + 1)
                color = CLASS_COLORS.get(cls_name, (0, 255, 0))

                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                cv2.circle(annotated_frame, (cx, cy), 4, (0, 255, 255), -1)
                label_str = f"#{track_id} {cls_name} [{lane}]"
                cv2.putText(annotated_frame, label_str, (x1, max(14, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
                detections.append({"id": track_id, "class": cls_name, "lane": lane, "center": (cx, cy)})

        return annotated_frame, lane_counts, class_counts, detections`
  },
  {
    path: 'utils/demo_generator.py',
    name: 'demo_generator.py',
    language: 'python',
    description: 'Generates a synthetic intersection video with multi-lane vehicle flow',
    content: `"""
utils/demo_generator.py
Generates a realistic traffic intersection video simulation
if the user doesn't have an external video file ready.
"""

import cv2
import numpy as np

def create_synthetic_traffic_video(
    output_path: str = "demo_traffic.mp4",
    num_frames: int = 150,
    fps: int = 25,
    width: int = 960,
    height: int = 540
) -> str:
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    cx, cy = width // 2, height // 2
    road_w = 160

    agents = []
    np.random.seed(42)
    for i in range(18):
        agents.append({"lane": "North", "x": cx - 40, "y": -50 - (i * 45), "speed": 3.2, "type": "Car", "color": (220, 150, 40)})
    for i in range(14):
        agents.append({"lane": "South", "x": cx + 40, "y": height + 50 + (i * 50), "speed": -3.0, "type": "Car", "color": (60, 210, 80)})
    for i in range(5):
        agents.append({"lane": "East", "x": width + 50 + (i * 70), "y": cy - 35, "speed": -2.5, "type": "Car", "color": (30, 150, 255)})
    for i in range(3):
        agents.append({"lane": "West", "x": -50 - (i * 90), "y": cy + 35, "speed": 2.5, "type": "Car", "color": (210, 80, 180)})

    for _ in range(num_frames):
        frame = np.full((height, width, 3), (35, 38, 46), dtype=np.uint8)
        cv2.rectangle(frame, (cx - road_w // 2, 0), (cx + road_w // 2, height), (50, 54, 62), -1)
        cv2.rectangle(frame, (0, cy - road_w // 2), (width, cy + road_w // 2), (50, 54, 62), -1)

        for ag in agents:
            if ag["lane"] in ["North", "South"]:
                ag["y"] += ag["speed"]
                vx, vy = int(ag["x"]), int(ag["y"])
                vw, vh = (32, 54)
            else:
                ag["x"] += ag["speed"]
                vx, vy = int(ag["x"]), int(ag["y"])
                vw, vh = (54, 32)
            cv2.rectangle(frame, (vx - vw // 2, vy - vh // 2), (vx + vw // 2, vy + vh // 2), ag["color"], -1)

        out.write(frame)
    out.release()
    return output_path`
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    description: 'Documentation, installation steps, and faculty presentation guide',
    content: `# 🚦 AI Smart Traffic Signal: AI-Based Adaptive Traffic Management System

A college-level Computer Vision & Artificial Intelligence project prototype that analyzes traffic intersection videos, detects vehicles using a lightweight YOLO model, calculates lane-wise traffic density, and dynamically optimizes traffic signal timings to reduce congestion and vehicle idle time.

## Quick Start
1. \`pip install -r requirements.txt\`
2. \`streamlit run app.py\`
3. Upload traffic video or click "Use Demo Video".
`
  }
];
