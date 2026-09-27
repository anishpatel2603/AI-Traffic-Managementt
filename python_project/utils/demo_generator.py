"""
utils/demo_generator.py
Generates a realistic traffic intersection video simulation
if the user doesn't have an external video file ready.
"""

import os
import cv2
import numpy as np

def create_synthetic_traffic_video(
    output_path: str = "demo_traffic.mp4",
    num_frames: int = 150,
    fps: int = 25,
    width: int = 960,
    height: int = 540
) -> str:
    """
    Synthesizes a realistic 4-way intersection video with vehicles
    moving in North, South, East, and West lanes.
    """
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    cx, cy = width // 2, height // 2
    road_w = 160

    # Define vehicle agents
    # North flow (moving down)
    agents = []
    np.random.seed(42)

    # 18 vehicles in North lane (heavy)
    for i in range(18):
        agents.append({
            "lane": "North",
            "x": cx - 40 + np.random.randint(-20, 20),
            "y": -50 - (i * 45),
            "speed": np.random.uniform(2.5, 4.0),
            "type": np.random.choice(["Car", "Bus", "Truck", "Motorcycle"], p=[0.6, 0.15, 0.15, 0.1]),
            "color": (np.random.randint(100, 255), np.random.randint(100, 255), np.random.randint(100, 255))
        })

    # 14 vehicles in South lane (moving up)
    for i in range(14):
        agents.append({
            "lane": "South",
            "x": cx + 40 + np.random.randint(-20, 20),
            "y": height + 50 + (i * 50),
            "speed": -np.random.uniform(2.5, 4.0),
            "type": np.random.choice(["Car", "Bus", "Truck", "Motorcycle"], p=[0.7, 0.1, 0.1, 0.1]),
            "color": (np.random.randint(100, 255), np.random.randint(100, 255), np.random.randint(100, 255))
        })

    # 5 vehicles in East lane (moving left)
    for i in range(5):
        agents.append({
            "lane": "East",
            "x": width + 50 + (i * 70),
            "y": cy - 35 + np.random.randint(-15, 15),
            "speed": -np.random.uniform(2.0, 3.5),
            "type": "Car",
            "color": (np.random.randint(100, 255), np.random.randint(100, 255), np.random.randint(100, 255))
        })

    # 3 vehicles in West lane (moving right)
    for i in range(3):
        agents.append({
            "lane": "West",
            "x": -50 - (i * 90),
            "y": cy + 35 + np.random.randint(-15, 15),
            "speed": np.random.uniform(2.0, 3.5),
            "type": "Car",
            "color": (np.random.randint(100, 255), np.random.randint(100, 255), np.random.randint(100, 255))
        })

    for frame_idx in range(num_frames):
        # Base background: Dark asphalt intersection
        frame = np.full((height, width, 3), (35, 38, 46), dtype=np.uint8)

        # Grass / pavement corners
        cv2.rectangle(frame, (0, 0), (cx - road_w // 2, cy - road_w // 2), (25, 40, 30), -1)
        cv2.rectangle(frame, (cx + road_w // 2, 0), (width, cy - road_w // 2), (25, 40, 30), -1)
        cv2.rectangle(frame, (0, cy + road_w // 2), (cx - road_w // 2, height), (25, 40, 30), -1)
        cv2.rectangle(frame, (cx + road_w // 2, cy + road_w // 2), (width, height), (25, 40, 30), -1)

        # Road boundaries
        cv2.rectangle(frame, (cx - road_w // 2, 0), (cx + road_w // 2, height), (50, 54, 62), -1)
        cv2.rectangle(frame, (0, cy - road_w // 2), (width, cy + road_w // 2), (50, 54, 62), -1)

        # Intersection box
        cv2.rectangle(frame, (cx - road_w // 2, cy - road_w // 2), (cx + road_w // 2, cy + road_w // 2), (55, 60, 70), -1)

        # Yellow center lines
        for y in range(0, cy - road_w // 2, 30):
            cv2.line(frame, (cx, y), (cx, y + 15), (0, 220, 240), 2)
        for y in range(cy + road_w // 2, height, 30):
            cv2.line(frame, (cx, y), (cx, y + 15), (0, 220, 240), 2)
        for x in range(0, cx - road_w // 2, 30):
            cv2.line(frame, (x, cy), (x + 15, cy), (0, 220, 240), 2)
        for x in range(cx + road_w // 2, width, 30):
            cv2.line(frame, (x, cy), (x + 15, cy), (0, 220, 240), 2)

        # Zebra Crosswalks
        for offset in range(-road_w // 2 + 10, road_w // 2 - 10, 20):
            cv2.rectangle(frame, (cx + offset, cy - road_w // 2 - 15), (cx + offset + 10, cy - road_w // 2), (200, 200, 200), -1)
            cv2.rectangle(frame, (cx + offset, cy + road_w // 2), (cx + offset + 10, cy + road_w // 2 + 15), (200, 200, 200), -1)
            cv2.rectangle(frame, (cx - road_w // 2 - 15, cy + offset), (cx - road_w // 2, cy + offset + 10), (200, 200, 200), -1)
            cv2.rectangle(frame, (cx + road_w // 2, cy + offset), (cx + road_w // 2 + 15, cy + offset + 10), (200, 200, 200), -1)

        # Draw moving vehicles
        for ag in agents:
            if ag["lane"] in ["North", "South"]:
                ag["y"] += ag["speed"]
                vx, vy = int(ag["x"]), int(ag["y"])
                vw, vh = (32, 54) if ag["type"] == "Car" else ((40, 90) if ag["type"] in ["Bus", "Truck"] else (16, 30))
            else:
                ag["x"] += ag["speed"]
                vx, vy = int(ag["x"]), int(ag["y"])
                vw, vh = (54, 32) if ag["type"] == "Car" else ((90, 40) if ag["type"] in ["Bus", "Truck"] else (30, 16))

            if -100 <= vx <= width + 100 and -100 <= vy <= height + 100:
                cv2.rectangle(frame, (vx - vw // 2, vy - vh // 2), (vx + vw // 2, vy + vh // 2), ag["color"], -1)
                # Windshield / headlight accents
                cv2.rectangle(frame, (vx - vw // 2 + 3, vy - vh // 2 + 3), (vx + vw // 2 - 3, vy + vh // 2 - 3), (20, 20, 20), 1)

        out.write(frame)

    out.release()
    return output_path
