"""
patterns.py — Crush precursor and anomaly pattern definitions.

Each pattern function takes extracted features and returns
(anomaly_type, severity, description, recommended_action)
or None if no pattern matches.

Pattern logic runs as a rule-based overlay on top of the
Isolation Forest anomaly score to classify the TYPE of anomaly.

Pattern priority (highest → lowest):
  1. crush_precursor    — high density + falling/low flow velocity
  2. reverse_flow       — negative or erratic flow direction
  3. stationary_crowd   — very low flow velocity regardless of density
  4. density_spike      — sudden large headcount jump (IF score only)
"""

from typing import Optional
from shared.schemas import AnomalyTypeEnum, SeverityEnum
from shared.config import DENSITY_THRESHOLDS


def _density_ratio(headcount: int, max_capacity: int) -> float:
    """Return headcount / max_capacity, clamped to [0, 1]."""
    if max_capacity <= 0:
        return 0.0
    return min(headcount / max_capacity, 1.0)


def _velocity_trend(velocities: list[float]) -> float:
    """
    Return average change in flow_velocity per reading.
    Negative = decelerating (dangerous), positive = accelerating.
    Returns 0.0 if fewer than 2 readings.
    """
    if len(velocities) < 2:
        return 0.0
    deltas = [velocities[i] - velocities[i - 1] for i in range(1, len(velocities))]
    return sum(deltas) / len(deltas)


def classify_pattern(
    avg_density_ratio: float,
    latest_velocity: float,
    velocity_trend: float,
    avg_flow_rate: float,
    zone_type: str,
) -> Optional[tuple[AnomalyTypeEnum, SeverityEnum, str, str]]:
    """
    Apply rule-based pattern matching to classify anomaly type.

    Returns (anomaly_type, severity, description, recommended_action)
    or None if no pattern matches (leave classification to IF score alone).

    Args:
        avg_density_ratio:  average headcount / max_capacity over window
        latest_velocity:    most recent flow_velocity reading (m/s)
        velocity_trend:     avg delta in velocity per step (negative = decelerating)
        avg_flow_rate:      average people per minute through zone
        zone_type:          zone classification string (e.g. "high_risk")
    """

    # --- Pattern 1: Crush Precursor ---
    # Tier A (critical): density >= 90% AND (decelerating OR slow)
    # Tier B (warning):  density >= 70% AND decelerating AND near-standstill
    # Tier B catches zones in the dangerous run-up phase before hitting 90%.
    is_high_density = avg_density_ratio >= DENSITY_THRESHOLDS["orange_max"]   # >= 90%
    is_approaching = avg_density_ratio >= DENSITY_THRESHOLDS["yellow_max"]    # >= 70%
    is_decelerating = velocity_trend < -0.05  # losing >0.05 m/s per reading
    is_slow = latest_velocity < 0.5           # near-standstill

    tier_a = is_high_density and (is_decelerating or is_slow)
    tier_b = is_approaching and is_decelerating and is_slow

    if tier_a or tier_b:
        density_pct = round(avg_density_ratio * 100)
        severity = SeverityEnum.CRITICAL if avg_density_ratio >= 0.95 else SeverityEnum.HIGH
        description = (
            f"High density ({density_pct}% of capacity) with "
            f"{'declining' if is_decelerating else 'critically low'} flow velocity "
            f"({latest_velocity:.2f} m/s) — classic crush precursor pattern detected."
        )
        action = (
            "Immediate manager verification required. "
            "Geofenced crowd redirection and entry hold recommended."
        )
        return (AnomalyTypeEnum.CRUSH_PRECURSOR, severity, description, action)

    # --- Pattern 2: Reverse Flow ---
    # Negative flow_rate signals crowd pushing back against natural direction
    if avg_flow_rate < -5.0:
        severity = SeverityEnum.HIGH if avg_density_ratio >= 0.7 else SeverityEnum.MEDIUM
        description = (
            f"Reverse crowd flow detected (avg flow rate: {avg_flow_rate:.1f} ppl/min). "
            f"Counter-movement in zone at {round(avg_density_ratio * 100)}% capacity."
        )
        action = (
            "Verify zone status. Consider closing entry points and "
            "activating alternate egress routes."
        )
        return (AnomalyTypeEnum.REVERSE_FLOW, severity, description, action)

    # --- Pattern 3: Stationary Crowd ---
    # Very low velocity with moderate-to-high density = medical emergency or blockage
    is_stationary = latest_velocity < 0.2 and avg_flow_rate < 5.0
    is_moderate_density = avg_density_ratio >= DENSITY_THRESHOLDS["yellow_max"]  # >= 70%

    if is_stationary and is_moderate_density:
        severity = SeverityEnum.HIGH if avg_density_ratio >= 0.8 else SeverityEnum.MEDIUM
        description = (
            f"Crowd movement has stopped (velocity: {latest_velocity:.2f} m/s, "
            f"flow: {avg_flow_rate:.1f} ppl/min) at {round(avg_density_ratio * 100)}% capacity. "
            f"Possible blockage or medical emergency."
        )
        action = (
            "Dispatch medical unit for welfare check. "
            "Investigate cause of stoppage immediately."
        )
        return (AnomalyTypeEnum.STATIONARY_CROWD, severity, description, action)

    # --- Pattern 4: Density Spike ---
    # Sudden surge in headcount — no velocity anomaly yet, but early warning
    if avg_density_ratio >= DENSITY_THRESHOLDS["orange_max"]:
        severity = SeverityEnum.MEDIUM
        description = (
            f"Rapid density increase to {round(avg_density_ratio * 100)}% of zone capacity. "
            f"No flow anomaly yet but zone approaching critical threshold."
        )
        action = (
            "Monitor closely. Consider opening alternate entry/exit routes "
            "and alerting on-ground marshals."
        )
        return (AnomalyTypeEnum.DENSITY_SPIKE, severity, description, action)

    return None


def severity_from_score(if_score: float, density_ratio: float) -> SeverityEnum:
    """
    Derive severity from Isolation Forest anomaly score + density ratio
    when no named pattern matches.

    IF score: values below 0 indicate anomaly; more negative = more anomalous.
    """
    if if_score < -0.2 and density_ratio >= 0.8:
        return SeverityEnum.HIGH
    if if_score < -0.1:
        return SeverityEnum.MEDIUM
    return SeverityEnum.LOW