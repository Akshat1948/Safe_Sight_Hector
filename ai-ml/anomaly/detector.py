"""
detector.py — Isolation Forest based anomaly detector.

Workflow:
  1. Extract feature vectors from ReadingInput list.
  2. Fit an IsolationForest on the extracted features.
     (In production this would be pre-trained; for the hackathon
      we fit on the incoming window itself — self-calibrating.)
  3. Score the LATEST reading against the fitted model.
  4. Map IF score + pattern rules (patterns.py) to AnomalyResponse.

Features used per reading:
  - density_ratio        headcount / max_capacity
  - flow_rate            people per minute
  - flow_velocity        avg movement speed m/s
  - velocity_delta       change in velocity vs previous reading
"""

import logging
import numpy as np
from sklearn.ensemble import IsolationForest

from shared.schemas import (
    AnomalyRequest,
    AnomalyResponse,
    AnomalyTypeEnum,
    SeverityEnum,
)
from anomaly.patterns import (
    classify_pattern,
    severity_from_score,
    _density_ratio,
    _velocity_trend,
)

logger = logging.getLogger(__name__)

# Isolation Forest hyper-parameters
_IF_CONTAMINATION = 0.15   # assume up to 15% of readings may be anomalous
_IF_N_ESTIMATORS = 100
_IF_RANDOM_STATE = 42

# Minimum readings required to run the model
_MIN_READINGS = 3


def _build_feature_matrix(readings: list, max_capacity: int) -> np.ndarray:
    """
    Convert a list of ReadingInput objects into a 2D numpy feature matrix.

    Columns:
        [density_ratio, flow_rate, flow_velocity, velocity_delta]
    """
    features = []
    prev_velocity = None

    for r in readings:
        dr = _density_ratio(r.headcount, max_capacity)
        v_delta = (r.flow_velocity - prev_velocity) if prev_velocity is not None else 0.0
        features.append([dr, r.flow_rate, r.flow_velocity, v_delta])
        prev_velocity = r.flow_velocity

    return np.array(features, dtype=float)


def detect(request: AnomalyRequest) -> AnomalyResponse:
    """
    Run anomaly detection on a batch of crowd density readings.

    Returns an AnomalyResponse with:
      - is_anomaly:       whether the latest state is anomalous
      - anomaly_type:     classified type (crush_precursor, etc.) or None
      - confidence_score: 0.0–1.0 (derived from IF score)
      - severity:         low / medium / high / critical
      - description:      human-readable explanation
      - recommended_action: actionable guidance for site manager
    """
    zone_id = request.zone_id
    readings = request.readings
    max_capacity = request.max_capacity
    zone_type = request.zone_type

    # --- Baseline: no anomaly response ---
    base_response = AnomalyResponse(
        zone_id=zone_id,
        is_anomaly=False,
        anomaly_type=None,
        confidence_score=0.0,
        severity=None,
        description="No anomaly detected. Crowd conditions appear normal.",
        recommended_action="No action required.",
    )

    if len(readings) < _MIN_READINGS:
        logger.warning(
            "zone=%s: only %d readings provided (minimum %d). Skipping detection.",
            zone_id, len(readings), _MIN_READINGS,
        )
        base_response.description = (
            f"Insufficient data: {len(readings)} reading(s) provided "
            f"(minimum {_MIN_READINGS} required for reliable detection)."
        )
        return base_response

    # --- Build feature matrix ---
    X = _build_feature_matrix(readings, max_capacity)

    # --- Fit Isolation Forest ---
    clf = IsolationForest(
        n_estimators=_IF_N_ESTIMATORS,
        contamination=_IF_CONTAMINATION,
        random_state=_IF_RANDOM_STATE,
    )
    clf.fit(X)

    # --- Score the LATEST reading (last row) ---
    latest_features = X[-1].reshape(1, -1)
    if_label = clf.predict(latest_features)[0]    # -1 = anomaly, 1 = normal
    if_score = clf.decision_function(latest_features)[0]  # negative = more anomalous

    is_anomaly = (if_label == -1)

    if not is_anomaly:
        return base_response

    # --- Map IF score to confidence (0.0–1.0) ---
    # decision_function returns negative values for anomalies.
    # We clamp and normalise: score of -0.5 → confidence 1.0, 0.0 → 0.0
    raw_confidence = max(0.0, min(1.0, abs(if_score) / 0.5))

    # --- Extract summary statistics for pattern matching ---
    # Use a trailing window (last 5 readings) so pattern matching reflects
    # the CURRENT state of the zone, not the historical average.
    _window = readings[-5:]
    velocities = [r.flow_velocity for r in readings]
    flow_rates = [r.flow_rate for r in readings]

    window_headcounts = [r.headcount for r in _window]
    window_flow_rates = [r.flow_rate for r in _window]

    avg_density_ratio = float(np.mean([_density_ratio(h, max_capacity) for h in window_headcounts]))
    latest_velocity = velocities[-1]
    vel_trend = _velocity_trend(velocities)
    avg_flow_rate = float(np.mean(window_flow_rates))

    # --- Rule-based pattern overlay ---
    pattern_result = classify_pattern(
        avg_density_ratio=avg_density_ratio,
        latest_velocity=latest_velocity,
        velocity_trend=vel_trend,
        avg_flow_rate=avg_flow_rate,
        zone_type=zone_type,
    )

    if pattern_result is not None:
        anomaly_type, severity, description, recommended_action = pattern_result
        # Boost confidence if pattern matches (pattern match = higher certainty)
        confidence_score = round(min(1.0, raw_confidence + 0.15), 2)
    else:
        # IF detected anomaly but no named pattern — use generic response
        anomaly_type = None
        severity = severity_from_score(if_score, avg_density_ratio)
        description = (
            f"Statistical anomaly detected in zone readings "
            f"(density: {round(avg_density_ratio * 100)}% of capacity). "
            f"Pattern does not match known crush precursor signatures."
        )
        recommended_action = "Monitor zone closely and verify with on-ground marshal."
        confidence_score = round(raw_confidence, 2)

    logger.info(
        "zone=%s anomaly=True type=%s severity=%s confidence=%.2f",
        zone_id, anomaly_type, severity, confidence_score,
    )

    return AnomalyResponse(
        zone_id=zone_id,
        is_anomaly=True,
        anomaly_type=anomaly_type,
        confidence_score=confidence_score,
        severity=severity,
        description=description,
        recommended_action=recommended_action,
    )