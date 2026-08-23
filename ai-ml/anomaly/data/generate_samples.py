"""
generate_samples.py — Generate simulated anomaly/normal crowd readings
for testing and demo purposes.

Run directly:  python anomaly/data/generate_samples.py
Outputs:       anomaly/data/normal_readings.json
               anomaly/data/crush_precursor_readings.json
               anomaly/data/reverse_flow_readings.json
"""

import json
import random
from datetime import datetime, timedelta

random.seed(42)


def _iso(dt: datetime) -> str:
    return dt.isoformat() + "Z"


def generate_normal(n: int = 20, base_dt: datetime = None) -> list[dict]:
    """Normal crowd flow — steady density, healthy velocity."""
    base_dt = base_dt or datetime(2026, 8, 25, 9, 0, 0)
    readings = []
    for i in range(n):
        readings.append({
            "timestamp": _iso(base_dt + timedelta(minutes=i * 5)),
            "headcount": random.randint(80, 160),
            "flow_rate": round(random.uniform(20.0, 50.0), 1),
            "flow_velocity": round(random.uniform(0.8, 1.5), 2),
        })
    return readings


def generate_crush_precursor(n: int = 20, base_dt: datetime = None) -> list[dict]:
    """
    Crush precursor scenario:
    - Headcount climbs steadily toward / past 90% of 500 capacity
    - Flow velocity declines progressively (crowd compressing)
    - Flow rate drops as people can no longer move freely
    """
    base_dt = base_dt or datetime(2026, 8, 25, 11, 0, 0)
    readings = []
    for i in range(n):
        progress = i / n
        headcount = int(300 + progress * 180 + random.randint(-10, 10))   # 300 → ~480
        flow_velocity = round(max(0.1, 1.2 - progress * 1.1 + random.uniform(-0.05, 0.05)), 2)
        flow_rate = round(max(1.0, 40.0 - progress * 35.0 + random.uniform(-2, 2)), 1)
        readings.append({
            "timestamp": _iso(base_dt + timedelta(minutes=i * 5)),
            "headcount": headcount,
            "flow_rate": flow_rate,
            "flow_velocity": flow_velocity,
        })
    return readings


def generate_reverse_flow(n: int = 20, base_dt: datetime = None) -> list[dict]:
    """
    Reverse flow scenario:
    - Moderate density
    - Negative flow_rate (crowd moving against natural direction)
    - Erratic velocity
    """
    base_dt = base_dt or datetime(2026, 8, 25, 14, 0, 0)
    readings = []
    for i in range(n):
        readings.append({
            "timestamp": _iso(base_dt + timedelta(minutes=i * 5)),
            "headcount": random.randint(200, 310),
            "flow_rate": round(random.uniform(-30.0, -5.0), 1),
            "flow_velocity": round(random.uniform(0.1, 0.6), 2),
        })
    return readings


if __name__ == "__main__":
    import os
    out_dir = os.path.dirname(__file__)

    normal = generate_normal()
    crush = generate_crush_precursor()
    reverse = generate_reverse_flow()

    with open(os.path.join(out_dir, "normal_readings.json"), "w") as f:
        json.dump({"max_capacity": 500, "zone_type": "general", "readings": normal}, f, indent=2)

    with open(os.path.join(out_dir, "crush_precursor_readings.json"), "w") as f:
        json.dump({"max_capacity": 500, "zone_type": "high_risk", "readings": crush}, f, indent=2)

    with open(os.path.join(out_dir, "reverse_flow_readings.json"), "w") as f:
        json.dump({"max_capacity": 500, "zone_type": "corridor", "readings": reverse}, f, indent=2)

    print("Sample datasets written to anomaly/data/")