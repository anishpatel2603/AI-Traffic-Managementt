"""
utils/lane_detector.py
Handles lane boundary definitions, vehicle-to-lane assignment,
and drawing of lane zones on video frames.
Configurable for different intersection camera viewpoints.
"""

from typing import Tuple, Dict, List
import cv2
import numpy as np

class LaneDetector:
    """
    Divides an intersection video frame into 4 configurable regions:
    North, South, East, West.
    """
    def __init__(self, frame_width: int = 1280, frame_height: int = 720):
        self.width = frame_width
        self.height = frame_height
        self.update_boundaries(cx_ratio=0.5, cy_ratio=0.5)

    def update_boundaries(self, cx_ratio: float = 0.5, cy_ratio: float = 0.5):
        """
        Updates quadrant division point based on intersection center ratio.
        Default is middle (0.5, 0.5).
        """
        self.cx = int(self.width * cx_ratio)
        self.cy = int(self.height * cy_ratio)

    def get_lane_for_point(self, pt: Tuple[int, int]) -> str:
        """
        Determines which lane region a point (x, y) belongs to.
        Uses 4 quadrants relative to intersection center (self.cx, self.cy):
        - North: upper quadrant (y < cy and |x - cx| < (cy - y))
        - South: lower quadrant (y >= cy and |x - cx| < (y - cy))
        - West:  left quadrant  (x < cx and |y - cy| <= (cx - x))
        - East:  right quadrant (x >= cx and |y - cy| <= (x - cx))
        """
        x, y = pt
        dx = x - self.cx
        dy = y - self.cy

        # Determine dominant direction from intersection center
        if abs(dy) >= abs(dx):
            return "North" if dy < 0 else "South"
        else:
            return "West" if dx < 0 else "East"

    def draw_lanes(self, frame: np.ndarray, alpha: float = 0.25) -> np.ndarray:
        """
        Draws colored lane region overlays and boundary lines on the frame.
        """
        overlay = frame.copy()
        h, w = frame.shape[:2]
        cx, cy = self.cx, self.cy

        # Define 4 quadrant polygons
        poly_north = np.array([[0, 0], [w, 0], [cx, cy]], dtype=np.int32)
        poly_south = np.array([[0, h], [w, h], [cx, cy]], dtype=np.int32)
        poly_west  = np.array([[0, 0], [0, h], [cx, cy]], dtype=np.int32)
        poly_east  = np.array([[w, 0], [w, h], [cx, cy]], dtype=np.int32)

        # Region tints (BGR)
        # North: Cyan/Blue (235, 160, 50)
        # South: Emerald/Green (50, 200, 80)
        # East:  Amber/Orange (30, 140, 240)
        # West:  Violet/Purple (200, 80, 160)
        cv2.fillPoly(overlay, [poly_north], (220, 150, 40))
        cv2.fillPoly(overlay, [poly_south], (60, 210, 80))
        cv2.fillPoly(overlay, [poly_east], (30, 150, 255))
        cv2.fillPoly(overlay, [poly_west], (210, 80, 180))

        # Blend overlay
        cv2.addWeighted(overlay, alpha, frame, 1.0 - alpha, 0, frame)

        # Boundary cross-lines
        cv2.line(frame, (0, 0), (w, h), (255, 255, 255), 1, cv2.LINE_AA)
        cv2.line(frame, (w, 0), (0, h), (255, 255, 255), 1, cv2.LINE_AA)

        # Draw intersection center indicator
        cv2.circle(frame, (cx, cy), 6, (0, 255, 255), -1)

        # Lane Label Badges
        labels = [
            ("NORTH LANE", (cx - 70, max(30, int(cy * 0.4))), (220, 150, 40)),
            ("SOUTH LANE", (cx - 70, min(h - 20, int(cy + (h - cy) * 0.7))), (60, 210, 80)),
            ("EAST LANE", (min(w - 140, int(cx + (w - cx) * 0.6)), cy), (30, 150, 255)),
            ("WEST LANE", (max(20, int(cx * 0.2)), cy), (210, 80, 180)),
        ]

        for text, pos, col in labels:
            cv2.putText(
                frame, text, pos,
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3, cv2.LINE_AA
            )
            cv2.putText(
                frame, text, pos,
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, col, 1, cv2.LINE_AA
            )

        return frame
