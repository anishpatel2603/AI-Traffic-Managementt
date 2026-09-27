"""
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

# ---------------------------------------------------------
# Page Configuration & Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="AI Smart Traffic Signal",
    page_icon="🚦",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 0.2rem;
        color: #f8fafc;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #94a3b8;
        margin-bottom: 1.5rem;
    }
    .stat-card {
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }
    .stat-val {
        font-size: 2rem;
        font-weight: 700;
        font-family: monospace;
    }
    .density-high { color: #ef4444; }
    .density-med { color: #f59e0b; }
    .density-low { color: #10b981; }
    .light-housing {
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 70px;
        margin: 0 auto;
    }
    .bulb {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        opacity: 0.25;
        transition: all 0.3s ease;
    }
    .bulb-red { background: #ef4444; }
    .bulb-yellow { background: #eab308; }
    .bulb-green { background: #22c55e; }
    .bulb-active {
        opacity: 1.0;
        box-shadow: 0 0 16px 4px currentColor;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Sidebar Configuration & Parameters
# ---------------------------------------------------------
st.sidebar.title("⚙️ System Controls")

st.sidebar.subheader("Density Thresholds")
low_thresh = st.sidebar.slider("Low Threshold (Max)", min_value=1, max_value=10, value=5, help="0 to this value is LOW density")
med_thresh = st.sidebar.slider("Medium Threshold (Max)", min_value=low_thresh + 1, max_value=25, value=15, help="Above Low up to this value is MEDIUM density")

st.sidebar.subheader("Green Light Durations (Seconds)")
green_low = st.sidebar.number_input("Low Density Green (s)", min_value=5, max_value=30, value=15)
green_med = st.sidebar.number_input("Medium Density Green (s)", min_value=15, max_value=60, value=30)
green_high = st.sidebar.number_input("High Density Green (s)", min_value=30, max_value=90, value=45)

st.sidebar.subheader("Lane Boundary Split")
split_x = st.sidebar.slider("Horizontal Center Ratio", min_value=0.2, max_value=0.8, value=0.5, step=0.05)
split_y = st.sidebar.slider("Vertical Center Ratio", min_value=0.2, max_value=0.8, value=0.5, step=0.05)

st.sidebar.subheader("AI Detection Settings")
conf_thresh = st.sidebar.slider("YOLO Confidence", min_value=0.15, max_value=0.90, value=0.35, step=0.05)
enable_tracking = st.sidebar.checkbox("Enable Vehicle Tracking (ByteTrack)", value=True, help="Avoids repeated counting of same vehicle across frames")

# Initialize controller
controller = TrafficSignalController(
    low_threshold=low_thresh,
    medium_threshold=med_thresh,
    green_time_low=int(green_low),
    green_time_medium=int(green_med),
    green_time_high=int(green_high)
)

# ---------------------------------------------------------
# Main UI Header
# ---------------------------------------------------------
st.markdown('<div class="main-title">🚦 AI SMART TRAFFIC SIGNAL</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">AI-Based Adaptive Traffic Management System</div>', unsafe_allow_html=True)

# ---------------------------------------------------------
# 1. Video Input Section
# ---------------------------------------------------------
col_input1, col_input2 = st.columns([2, 1])

with col_input1:
    uploaded_file = st.file_uploader(
        "Upload Traffic Video (MP4, AVI, MOV)",
        type=["mp4", "avi", "mov"],
        help="Upload standard intersection traffic footage"
    )

with col_input2:
    st.markdown("<div style='height: 28px'></div>", unsafe_allow_html=True)
    use_demo = st.button("🎬 Use Demo Video", help="Generates or loads built-in realistic multi-lane traffic simulation")

# Session state initialization
if "analysis_running" not in st.session_state:
    st.session_state.analysis_running = False
if "video_path" not in st.session_state:
    st.session_state.video_path = None

if uploaded_file is not None:
    # Save uploaded file to temp directory
    tfile = tempfile.NamedTemporaryFile(delete=False, suffix=f".{uploaded_file.name.split('.')[-1]}")
    tfile.write(uploaded_file.read())
    st.session_state.video_path = tfile.name
    st.success(f"Loaded: {uploaded_file.name}")

elif use_demo:
    demo_path = os.path.join(tempfile.gettempdir(), "demo_traffic.mp4")
    if not os.path.exists(demo_path):
        with st.spinner("Generating demo traffic intersection video..."):
            create_synthetic_traffic_video(output_path=demo_path, num_frames=120)
    st.session_state.video_path = demo_path
    st.info("Loaded Built-in Demo Intersection Video")

# ---------------------------------------------------------
# Control Buttons: Start / Stop / Reset
# ---------------------------------------------------------
col_ctrl1, col_ctrl2, col_ctrl3, col_ctrl4 = st.columns([1, 1, 1, 3])
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

# ---------------------------------------------------------
# Layout Containers
# ---------------------------------------------------------
col_video, col_signals = st.columns([3, 2])

with col_video:
    st.subheader("Traffic Video & AI Detection")
    video_placeholder = st.empty()

with col_signals:
    st.subheader("Signal Decision & Lights")
    decision_placeholder = st.empty()
    lights_placeholder = st.empty()

st.divider()

# Traffic Statistics Section
st.subheader("Lane-Wise Traffic Statistics")
stats_placeholder = st.empty()

# Charts & Summary Section
col_chart, col_summary = st.columns([1, 1])
with col_chart:
    st.subheader("Traffic Density Chart")
    chart_placeholder = st.empty()

with col_summary:
    st.subheader("Final Decision Summary Table")
    table_placeholder = st.empty()

# ---------------------------------------------------------
# Helper Rendering Functions
# ---------------------------------------------------------
def render_stats_cards(lane_counts, densities):
    c1, c2, c3, c4 = st.columns(4)
    lanes = [("NORTH", "North", c1), ("SOUTH", "South", c2), ("EAST", "East", c3), ("WEST", "West", c4)]
    for title, key, col in lanes:
        count = lane_counts.get(key, 0)
        density = densities.get(key, "LOW")
        color_cls = "density-high" if density == "HIGH" else ("density-med" if density == "MEDIUM" else "density-low")
        with col:
            st.markdown(f"""
            <div class="stat-card">
                <div style="font-size: 0.9rem; color: #94a3b8; font-weight: 600;">{title}</div>
                <div class="stat-val">{count}</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">Vehicles</div>
                <div class="{color_cls}" style="font-weight: 700; margin-top: 6px;">Density: {density}</div>
            </div>
            """, unsafe_allow_html=True)

def render_traffic_lights(signal_states):
    c_n, c_s, c_e, c_w = st.columns(4)
    lanes = [("NORTH", "North", c_n), ("SOUTH", "South", c_s), ("EAST", "East", c_e), ("WEST", "West", c_w)]
    for title, key, col in lanes:
        state = signal_states.get(key, "RED")
        is_green = state == "GREEN"
        is_yellow = state == "YELLOW"
        is_red = state == "RED"
        with col:
            st.markdown(f"""
            <div style="text-align: center; margin-bottom: 6px; font-weight: 600; font-size: 0.85rem;">{title}</div>
            <div class="light-housing">
                <div class="bulb bulb-red {'bulb-active' if is_red else ''}"></div>
                <div class="bulb bulb-yellow {'bulb-active' if is_yellow else ''}"></div>
                <div class="bulb bulb-green {'bulb-active' if is_green else ''}"></div>
            </div>
            <div style="text-align: center; margin-top: 6px; font-size: 0.8rem; font-weight: 700; color: {'#22c55e' if is_green else '#ef4444'};">
                {state}
            </div>
            """, unsafe_allow_html=True)

# ---------------------------------------------------------
# Main Video Processing Loop
# ---------------------------------------------------------
if st.session_state.analysis_running and st.session_state.video_path:
    cap = cv2.VideoCapture(st.session_state.video_path)
    if not cap.isOpened():
        st.error("Error: Could not open the specified video file. Please check format.")
        st.session_state.analysis_running = False
    else:
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 960
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 540

        lane_detector = LaneDetector(frame_width=width, frame_height=height)
        lane_detector.update_boundaries(cx_ratio=split_x, cy_ratio=split_y)

        with st.spinner("Initializing YOLO vehicle detection model..."):
            analyzer = TrafficAnalyzer(model_name="yolov8n.pt", confidence=conf_thresh)

        frame_count = 0
        max_frames_to_process = 300

        while cap.isOpened() and st.session_state.analysis_running and frame_count < max_frames_to_process:
            ret, frame = cap.read()
            if not ret or frame is None:
                # Loop back to beginning for demo
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame_count += 1

            # 1. Overlay Lane Boundaries
            frame = lane_detector.draw_lanes(frame, alpha=0.2)

            # 2. Run YOLO Detection
            annotated_frame, lane_counts, class_counts, detections = analyzer.process_frame(
                frame, lane_detector, use_tracking=enable_tracking
            )

            # 3. Decision Logic
            decision = controller.decide_signals(lane_counts)

            # 4. Update Video Display (RGB for Streamlit)
            frame_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
            video_placeholder.image(frame_rgb, channels="RGB", use_container_width=True)

            # 5. Update Signal Decision Cards
            with decision_placeholder.container():
                st.markdown(f"""
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
                    <div style="font-size: 0.85rem; color: #94a3b8;">CURRENT SIGNAL</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">🔴 {decision['current_signal']}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 10px;">RECOMMENDED SIGNAL (AI DECISION)</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #22c55e;">🟢 {decision['recommended_signal']}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 10px;">RECOMMENDED GREEN TIME</div>
                    <div style="font-size: 1.6rem; font-weight: 800; font-family: monospace; color: #38bdf8;">
                        ⏱️ {decision['recommended_green_time']} seconds
                    </div>
                </div>
                """, unsafe_allow_html=True)

            # 6. Update Traffic Lights Simulation
            with lights_placeholder.container():
                render_traffic_lights(decision['signal_states'])

            # 7. Update 4 Lane Statistics
            with stats_placeholder.container():
                render_stats_cards(lane_counts, decision['densities'])

            # 8. Update Bar Chart
            df_chart = pd.DataFrame({
                "Lane": ["North", "South", "East", "West"],
                "Vehicles": [lane_counts.get("North", 0), lane_counts.get("South", 0), lane_counts.get("East", 0), lane_counts.get("West", 0)]
            })
            chart_placeholder.bar_chart(df_chart.set_index("Lane"))

            # 9. Update Table
            df_table = pd.DataFrame([
                {"Lane": "North", "Vehicles": lane_counts.get("North", 0), "Density": decision['densities']["North"], "Signal": decision['signal_states']["North"]},
                {"Lane": "South", "Vehicles": lane_counts.get("South", 0), "Density": decision['densities']["South"], "Signal": decision['signal_states']["South"]},
                {"Lane": "East",  "Vehicles": lane_counts.get("East", 0),  "Density": decision['densities']["East"],  "Signal": decision['signal_states']["East"]},
                {"Lane": "West",  "Vehicles": lane_counts.get("West", 0),  "Density": decision['densities']["West"],  "Signal": decision['signal_states']["West"]},
            ])
            table_placeholder.dataframe(df_table, use_container_width=True, hide_index=True)

            # Pace playback slightly for smooth UI
            time.sleep(0.04)

        cap.release()

elif not st.session_state.analysis_running:
    # Idle / Default State
    with video_placeholder.container():
        st.info("Upload an MP4/AVI/MOV traffic video above or click 'Use Demo Video', then click '▶ Start Analysis'.")
    with decision_placeholder.container():
        st.markdown("""
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <div style="color: #94a3b8;">SYSTEM STATUS</div>
            <div style="color: #10b981; font-weight: 600; margin-top: 4px;">AI Detection: READY</div>
            <div style="color: #10b981; font-weight: 600;">Traffic Analysis: READY</div>
            <div style="color: #10b981; font-weight: 600;">Signal Recommendation: READY</div>
        </div>
        """, unsafe_allow_html=True)
    with lights_placeholder.container():
        render_traffic_lights({"North": "RED", "South": "RED", "East": "RED", "West": "RED"})
    with stats_placeholder.container():
        render_stats_cards({"North": 0, "South": 0, "East": 0, "West": 0}, {"North": "LOW", "South": "LOW", "East": "LOW", "West": "LOW"})
