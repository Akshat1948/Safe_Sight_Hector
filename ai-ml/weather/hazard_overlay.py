from __future__ import annotations

import logging
from shared.schemas import HazardLevelEnum, HazardResponse

logger = logging.getLogger(__name__)


def assess_hazard(
    site_id: str,
    weather: dict,
    site_features: dict,
) -> HazardResponse:
    precipitation = float(weather.get("precipitation", 0.0))
    temperature = float(weather.get("temperature", 28.0))
    humidity = float(weather.get("humidity", 60.0))
    wind_speed = float(weather.get("wind_speed", 0.0))
    condition = str(weather.get("condition", "clear")).lower()

    has_river = bool(site_features.get("has_river", False))
    has_slopes = bool(site_features.get("has_slopes", False))
    elevation_m = float(site_features.get("elevation_m", 0))

    hazard_scores: dict[str, float] = {}

    # Flood risk
    if has_river:
        flood_score = 0.0
        if precipitation > 80:
            flood_score = 1.0
        elif precipitation > 50:
            flood_score = 0.75
        elif precipitation > 30:
            flood_score = 0.50
        elif precipitation > 10:
            flood_score = 0.25
        if "thunderstorm" in condition or "heavy" in condition:
            flood_score = min(1.0, flood_score + 0.20)
        if flood_score > 0:
            hazard_scores["flood"] = flood_score

    # Landslide risk
    if has_slopes and elevation_m > 100:
        ls_score = 0.0
        if precipitation > 60:
            ls_score = 1.0
        elif precipitation > 40:
            ls_score = 0.70
        elif precipitation > 20:
            ls_score = 0.40
        elevation_factor = min(1.0, elevation_m / 1000.0)
        ls_score = min(1.0, ls_score * (0.5 + 0.5 * elevation_factor))
        if ls_score > 0:
            hazard_scores["landslide"] = ls_score

    # Lightning risk
    lightning_score = 0.0
    if "thunderstorm" in condition:
        lightning_score = 0.90
    elif "storm" in condition:
        lightning_score = 0.60
    elif precipitation > 30 and wind_speed > 25:
        lightning_score = 0.40
    if lightning_score > 0:
        hazard_scores["lightning"] = lightning_score

    # Heat risk
    heat_index = temperature + 0.033 * humidity - 4.0
    heat_score = 0.0
    if heat_index > 55:
        heat_score = 1.0
    elif heat_index > 45:
        heat_score = 0.70
    elif heat_index > 38:
        heat_score = 0.40
    elif heat_index > 32:
        heat_score = 0.15
    if heat_score > 0:
        hazard_scores["heat"] = heat_score

    if not hazard_scores:
        return HazardResponse(
            hazard_level=HazardLevelEnum.NONE,
            hazard_type=None,
            advisory=None,
            affected_zone_types=[],
        )

    dominant = max(hazard_scores, key=hazard_scores.__getitem__)
    score = hazard_scores[dominant]
    level = _score_to_level(score)

    logger.info("Hazard assessment site=%s: %s=%s (score=%.2f)", site_id, dominant, level.value, score)

    return HazardResponse(
        hazard_level=level,
        hazard_type=dominant,
        advisory=_advisory(dominant, level),
        affected_zone_types=_affected_zones(dominant),
    )


def _score_to_level(score: float) -> HazardLevelEnum:
    if score >= 0.85:
        return HazardLevelEnum.SEVERE
    elif score >= 0.65:
        return HazardLevelEnum.HIGH
    elif score >= 0.40:
        return HazardLevelEnum.MODERATE
    elif score > 0:
        return HazardLevelEnum.LOW
    return HazardLevelEnum.NONE


_ADVISORIES: dict[str, dict[HazardLevelEnum, str]] = {
    "flood": {
        HazardLevelEnum.LOW: "Light rainfall detected. Monitor river levels. Visitors near water edges advised to stay alert.",
        HazardLevelEnum.MODERATE: "Moderate rainfall with river-adjacent risk. Consider restricting access to low-lying zones.",
        HazardLevelEnum.HIGH: "Heavy rain expected. River-adjacent zones may flood. Close zone access near water bodies immediately.",
        HazardLevelEnum.SEVERE: "SEVERE FLOOD RISK. Evacuate all river-adjacent and low-lying zones immediately.",
    },
    "landslide": {
        HazardLevelEnum.LOW: "Wet slopes detected. Trekkers advised to use marked trails only.",
        HazardLevelEnum.MODERATE: "Landslide risk elevated. Restrict access to steep and off-trail areas.",
        HazardLevelEnum.HIGH: "High landslide risk. Close trek routes on slopes above 100m elevation.",
        HazardLevelEnum.SEVERE: "SEVERE LANDSLIDE RISK. Evacuate all hillside zones and halt all trekking activity.",
    },
    "lightning": {
        HazardLevelEnum.LOW: "Thunderstorm activity nearby. Move visitors away from open elevated areas.",
        HazardLevelEnum.MODERATE: "Active thunderstorm. Suspend outdoor queues and seek covered shelter.",
        HazardLevelEnum.HIGH: "Severe lightning risk. Clear all outdoor and elevated zones immediately.",
        HazardLevelEnum.SEVERE: "EXTREME LIGHTNING RISK. Mandatory full outdoor evacuation.",
    },
    "heat": {
        HazardLevelEnum.LOW: "Elevated heat index. Ensure drinking water and shade in high-density zones.",
        HazardLevelEnum.MODERATE: "Heat stress risk for elderly and children. Reduce density thresholds by 20%.",
        HazardLevelEnum.HIGH: "High heat stress. Issue advisory for vulnerable visitors and increase medical presence.",
        HazardLevelEnum.SEVERE: "SEVERE HEAT EMERGENCY. Mandatory hydration stops and reduce zone capacities by 40%.",
    },
}


def _advisory(hazard_type: str, level: HazardLevelEnum) -> str:
    return _ADVISORIES.get(hazard_type, {}).get(level, "Monitor weather conditions closely.")


def _affected_zones(hazard_type: str) -> list[str]:
    mapping = {
        "flood": ["high_risk", "corridor", "entry_exit", "parking"],
        "landslide": ["high_risk", "restricted", "corridor"],
        "lightning": ["general", "entry_exit", "safe_assembly"],
        "heat": ["high_risk", "corridor", "general"],
    }
    return mapping.get(hazard_type, ["general"])
