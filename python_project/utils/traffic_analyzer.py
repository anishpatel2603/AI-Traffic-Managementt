"""
utils/traffic_analyzer.py
Performs YOLO object detection on traffic frames, filters vehicle classes,
calculates center points, assigns vehicles to lanes, and tracks vehicles.
"""

from typing import Dict, List, Tuple, Any, Optional
import cv2
import numpy as np

# Supported COCO vehicle classes
# 2: car, 3: motorcycle, 5: bus, 7: truck
VEHICLE_CLASS_IDS = {
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}

CLASS_COLORS = {
    "Car": (59, 130, 246),       # Blue
    "Bus": (234, 88, 12),       # Amber / Orange
    "Truck": (168, 85, 247),    # Purple
    "Motorcycle": (16, 185, 129)# Green
}

class TrafficAnalyzer:
    """
    Wraps YOLO vehicle detection and lane assignment.
    """
    def __init__(self, model_name: str = "yolov8n.pt", confidence: float = 0.35):
        self.confidence = confidence
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self):
        """Loads YOLO model safely with error handling."""
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_name)
            print(f"[TrafficAnalyzer] Successfully loaded {self.model_name}")
        except Exception as e:
            print(f"[TrafficAnalyzer] Warning: Could not load YOLO model: {e}")
            self.model = None

    def process_frame(
        self,
        frame: np.ndarray,
        lane_detector,
        use_tracking: bool = True
    ) -> Tuple[np.ndarray, Dict[str, int], Dict[str, int], List[Dict[str, Any]]]:
        """
        Processes a single video frame:
        1. Runs YOLO detection / tracking
        2. Filters vehicle classes (Car, Bus, Truck, Motorcycle)
        3. Computes bounding box center points
        4. Assigns each vehicle to a lane (North, South, East, West)
        5. Draws bounding boxes, labels, and center dots
        Returns:
            annotated_frame: Frame with drawn overlays
            lane_counts: Dict with count per lane
            class_counts: Dict with count per vehicle class
            detections: List of individual detection dicts
        """
        lane_counts = {"North": 0, "South": 0, "East": 0, "West": 0}
        class_counts = {"Car": 0, "Bus": 0, "Truck": 0, "Motorcycle": 0}
        detections = []

        if self.model is None:
            # Fallback when model is not loaded (or during mock runs)
            return frame, lane_counts, class_counts, detections

        h, w = frame.shape[:2]

        try:
            # Run inference; if use_tracking=True, use model.track for ByteTrack continuity
            if use_tracking:
                results = self.model.track(
                    source=frame,
                    persist=True,
                    classes=list(VEHICLE_CLASS_IDS.keys()),
                    conf=self.confidence,
                    verbose=False
                )
            else:
                results = self.model(
                    source=frame,
                    classes=list(VEHICLE_CLASS_IDS.keys()),
                    conf=self.confidence,
                    verbose=False
                )

            annotated_frame = frame.copy()

            if results and len(results) > 0:
                boxes = results[0].boxes
                if boxes is not None:
                    for i in range(len(boxes)):
                        box = boxes[i]
                        cls_id = int(box.cls[0].item())
                        conf_val = float(box.conf[0].item())

                        if cls_id not in VEHICLE_CLASS_IDS:
                            continue

                        cls_name = VEHICLE_CLASS_IDS[cls_id]
                        class_counts[cls_name] = class_counts.get(cls_name, 0) + 1

                        xyxy = box.xyxy[0].cpu().numpy().astype(int)
                        x1, y1, x2, y2 = xyxy

                        # Calculate center point
                        cx = int((x1 + x2) / 2)
                        cy = int((y1 + y2) / 2)

                        # Determine lane
                        lane = lane_detector.get_lane_for_point((cx, cy))
                        lane_counts[lane] = lane_counts.get(lane, 0) + 1

                        track_id = int(box.id[0].item()) if (box.id is not None) else (i + 1)

                        color = CLASS_COLORS.get(cls_name, (0, 255, 0))

                        # Draw bounding box
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)

                        # Draw center centroid
                        cv2.circle(annotated_frame, (cx, cy), 4, (0, 255, 255), -1)

                        # Draw label banner
                        label_str = f"#{track_id} {cls_name} ({conf_val:.2f}) [{lane}]"
                        t_size, _ = cv2.getTextSize(label_str, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                        cv2.rectangle(
                            annotated_frame,
                            (x1, max(0, y1 - 20)),
                            (x1 + t_size[0] + 6, max(20, y1)),
                            color,
                            -1
                        )
                        cv2.putText(
                            annotated_frame,
                            label_str,
                            (x1 + 3, max(14, y1 - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            (255, 255, 255),
                            1,
                            cv2.LINE_AA
                        )

                        detections.append({
                            "id": track_id,
                            "class": cls_name,
                            "confidence": conf_val,
                            "box": [x1, y1, x2, y2],
                            "center": (cx, cy),
                            "lane": lane
                        })

            return annotated_frame, lane_counts, class_counts, detections

        except Exception as e:
            print(f"[TrafficAnalyzer] Detection error: {e}")
            return frame, lane_counts, class_counts, detections
