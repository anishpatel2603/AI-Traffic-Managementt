"""
utils/signal_controller.py
Calculates traffic density, evaluates signal priorities,
and determines recommended green light timing.
"""

from typing import Dict, Any, Tuple

class TrafficSignalController:
    """
    Core AI decision engine for adaptive traffic lights.
    """
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
        """
        Calculates density tier from vehicle count.
        Rule:
        0 - 5: LOW
        6 - 15: MEDIUM
        16+: HIGH
        """
        if count <= self.low_threshold:
            return "LOW"
        elif count <= self.medium_threshold:
            return "MEDIUM"
        else:
            return "HIGH"

    def calculate_green_time(self, density: str, count: int = 0) -> int:
        """
        Calculates green duration based on density tier.
        Optionally uses proportional bonus for heavy density.
        """
        base_time = self.green_times.get(density, 15)
        # Cap high congestion bonus at max 60 seconds
        if density == "HIGH" and count > self.medium_threshold:
            bonus = min(15, int((count - self.medium_threshold) * 1.5))
            return min(60, base_time + bonus)
        return base_time

    def decide_signals(self, lane_counts: Dict[str, int]) -> Dict[str, Any]:
        """
        Evaluates lane counts to determine:
        1. Individual lane densities
        2. Dominant corridor (North-South vs East-West)
        3. Highest traffic lane
        4. Recommended active signal
        5. Recommended green duration
        6. Lamp states for all 4 signals (North, South, East, West)
        """
        lanes = ["North", "South", "East", "West"]
        densities = {lane: self.calculate_density(lane_counts.get(lane, 0)) for lane in lanes}

        # Corridor aggregate counts
        ns_count = lane_counts.get("North", 0) + lane_counts.get("South", 0)
        ew_count = lane_counts.get("East", 0) + lane_counts.get("West", 0)

        # Find highest single lane
        highest_lane = max(lanes, key=lambda l: lane_counts.get(l, 0))
        highest_count = lane_counts.get(highest_lane, 0)
        highest_density = densities[highest_lane]

        # Recommended corridor
        if ns_count >= ew_count:
            recommended_signal = "NORTH-SOUTH"
            current_simulated_signal = "EAST-WEST"
            green_lane_names = ["North", "South"]
            red_lane_names = ["East", "West"]
            max_corridor_density = "HIGH" if (densities["North"] == "HIGH" or densities["South"] == "HIGH") else (
                "MEDIUM" if (densities["North"] == "MEDIUM" or densities["South"] == "MEDIUM") else "LOW"
            )
            green_duration = self.calculate_green_time(max_corridor_density, max(lane_counts.get("North", 0), lane_counts.get("South", 0)))
        else:
            recommended_signal = "EAST-WEST"
            current_simulated_signal = "NORTH-SOUTH"
            green_lane_names = ["East", "West"]
            red_lane_names = ["North", "South"]
            max_corridor_density = "HIGH" if (densities["East"] == "HIGH" or densities["West"] == "HIGH") else (
                "MEDIUM" if (densities["East"] == "MEDIUM" or densities["West"] == "MEDIUM") else "LOW"
            )
            green_duration = self.calculate_green_time(max_corridor_density, max(lane_counts.get("East", 0), lane_counts.get("West", 0)))

        # Signal states for visualization
        signal_states = {}
        for lane in lanes:
            if lane in green_lane_names:
                signal_states[lane] = "GREEN"
            else:
                signal_states[lane] = "RED"

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
        }
