# 🚦 AI Smart Traffic Signal: AI-Based Adaptive Traffic Management System

A college-level Computer Vision & Artificial Intelligence project prototype that analyzes traffic intersection videos, detects vehicles using a lightweight YOLO model, calculates lane-wise traffic density, and dynamically optimizes traffic signal timings to reduce congestion and vehicle idle time.

---

## 1. Project Directory Structure

```text
ai_smart_traffic_signal/
│
├── app.py                      # Main Streamlit dashboard application
├── requirements.txt            # Python dependencies (Streamlit, YOLO, OpenCV, Pandas)
├── README.md                   # Comprehensive project documentation & guide
│
└── utils/                      # Core engineering modules
    ├── __init__.py             # Package marker
    ├── lane_detector.py        # Configurable 4-quadrant lane mapping & boundary drawing
    ├── traffic_analyzer.py     # YOLO vehicle detection, classes filter & tracking
    ├── signal_controller.py    # Density classification & dynamic green time decision engine
    └── demo_generator.py       # Built-in synthetic intersection traffic video generator
```

---

## 2. Requirements & Installation

This project is optimized to run smoothly on any standard student laptop (CPU or GPU).

### Prerequisites
- Python 3.9, 3.10, or 3.11 installed.
- Git (optional).

### Step-by-Step Installation Commands

1. **Clone or Download the Project**:
   ```bash
   cd ai_smart_traffic_signal
   ```

2. **Create a Virtual Environment (Recommended)**:
   ```bash
   # On Windows:
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

   *(Note: The first time YOLO runs, Ultralytics will automatically download the lightweight `yolov8n.pt` weights (~6.2 MB) into the directory).*

---

## 3. How to Run the Application

Run the Streamlit web dashboard with:

```bash
streamlit run app.py
```

The application will automatically open in your default browser at:
`http://localhost:8501`

---

## 4. How the Prototype Works

The end-to-end algorithmic pipeline follows:

```
Traffic Video Feed (.mp4, .avi, .mov)
              ↓
Frame Extraction (OpenCV cv2.VideoCapture)
              ↓
AI Object Detection (YOLOv8 Nano - yolov8n.pt)
              ↓
Vehicle Class Filtering (Car, Bus, Truck, Motorcycle)
              ↓
Centroid Calculation ((x1 + x2)/2, (y1 + y2)/2)
              ↓
Lane Quadrant Mapping (North, South, East, West)
              ↓
Vehicle Counting & Deduplication (ByteTrack)
              ↓
Lane Density Assessment (LOW / MEDIUM / HIGH)
              ↓
Adaptive Signal Decision (Corridor Priority Comparison)
              ↓
Dynamic Green Duration Optimization (15s / 30s / 45s)
              ↓
Live Traffic Light HUD & Dashboard Visualization
```

### Mathematical & Logical Rules

1. **Lane Assignment**:
   The frame is partitioned into 4 angular quadrants relative to the intersection center $(C_x, C_y)$:
   - **North**: $y < C_y$ and $|x - C_x| < (C_y - y)$
   - **South**: $y \ge C_y$ and $|x - C_x| < (y - C_y)$
   - **West**: $x < C_x$ and $|y - C_y| \le (C_x - x)$
   - **East**: $x \ge C_x$ and $|y - C_y| \le (x - C_x)$

2. **Density Tiers**:
   - $0 \le N_{\text{lane}} \le 5 \implies \mathbf{LOW}$
   - $6 \le N_{\text{lane}} \le 15 \implies \mathbf{MEDIUM}$
   - $N_{\text{lane}} \ge 16 \implies \mathbf{HIGH}$

3. **Dynamic Green Duration**:
   - $\text{LOW} \implies 15\text{ seconds}$
   - $\text{MEDIUM} \implies 30\text{ seconds}$
   - $\text{HIGH} \implies 45\text{ seconds}$ (with auto-extension up to 60s for severe congestion: $T = 45 + 1.5 \times (N - 15)$)

---

## 5. How to Add Your Own Traffic Video

1. In the dashboard top section, click **"Browse files"** under **"Upload Traffic Video"**.
2. Select any video file in `.mp4`, `.avi`, or `.mov` format.
3. Click **"▶ Start Analysis"**.
4. The system will process each frame sequentially, displaying real-time bounding boxes, vehicle counts, and signal recommendations.

---

## 6. How to Modify Lane Boundaries

Because traffic cameras can be angled from various perspectives (e.g. tilted drone, overhead pole, roadside angle):
1. Use the **Sidebar Sliders**:
   - **Horizontal Center Ratio**: Shifts the intersection center left/right (default 0.50).
   - **Vertical Center Ratio**: Shifts the intersection center up/down (default 0.50).
2. For advanced custom coordinates, edit `utils/lane_detector.py` to specify exact polygon coordinates if a specialized 4-corner road perspective is needed.

---

## 7. How to Demonstrate the Project to Faculty

Follow this 5-step script during your college viva / project presentation:

1. **Introduction (1 min)**:
   - *"Traditional traffic lights operate on rigid, fixed-time cycles (e.g. 30s green for all directions regardless of whether cars are waiting). This causes unnecessary idling, fuel waste, and traffic congestion."*
   - *"Our project, AI Smart Traffic Signal, replaces fixed timers with real-time computer vision and adaptive scheduling."*

2. **Demo Setup (30 sec)**:
   - Click **"🎬 Use Demo Video"** to showcase the built-in 4-lane synthetic intersection simulator, or upload standard CCTV footage.
   - Click **"▶ Start Analysis"**.

3. **Computer Vision & Tracking Showcase (1.5 min)**:
   - Point out the bounding boxes with class labels (`Car`, `Bus`, `Truck`, `Motorcycle`) and confidence scores.
   - Show how the vehicle centroid is computed and mapped into its respective quadrant (North, South, East, West).
   - Explain how ByteTrack tracking IDs prevent double counting.

4. **Adaptive AI Decision & Timing (1.5 min)**:
   - Highlight the 4 Statistics cards showing real-time vehicle counts and density classifications.
   - Demonstrate how the system detects the congested North-South corridor and grants it Green priority for 45 seconds, while holding East-West on Red.
   - Show how the traffic light visualization updates dynamically.

5. **Adjustability Proof (1 min)**:
   - Open the sidebar controls to show configurable density thresholds (e.g., lowering High density to 10 vehicles) to demonstrate flexibility for different cities.

---

## 8. Known Prototype Limitations

1. **Weather & Illumination Sensitivity**: Severe rain, fog, or dark glare can reduce YOLO detection confidence scores.
2. **Camera Occlusion**: Large trucks or double-decker buses may momentarily obscure smaller motorcycles or compact cars behind them.
3. **Monocular Depth**: 2D bounding boxes do not measure exact real-world 3D vehicle speeds or stopping distances.

---

## 9. Future Improvements

1. **Edge Hardware Deployment**: Porting the YOLO model to NVIDIA Jetson Nano or Raspberry Pi 5 with Coral TPU for real-time intersection edge computing.
2. **Emergency Vehicle Preemption**: Automatic audio siren detection or visual flashing beacon detection for ambulances and fire trucks to force instant green waves.
3. **Multi-Intersection Network Synchronization**: Connecting adjacent traffic signals via Reinforcement Learning (Q-Learning or PPO) to establish continuous green corridor waves along major avenues.
