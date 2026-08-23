from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class DensityStatusEnum(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"


class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyTypeEnum(str, Enum):
    CRUSH_PRECURSOR = "crush_precursor"
    STATIONARY_CROWD = "stationary_crowd"
    REVERSE_FLOW = "reverse_flow"
    DENSITY_SPIKE = "density_spike"


class HazardLevelEnum(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


# --- Forecast (Shreyashi) ---

class DensityReading(BaseModel):
    timestamp: datetime
    headcount: int


class ForecastRequest(BaseModel):
    zone_id: str
    site_id: str
    current_density: int
    max_capacity: int
    hours_ahead: int = 6
    weather_condition: Optional[str] = None
    is_festival_day: bool = False
    historical_data: list[DensityReading] = []


class ForecastPoint(BaseModel):
    timestamp: datetime
    predicted_density: int
    confidence_lower: int
    confidence_upper: int
    density_status: DensityStatusEnum
    alert_recommended: bool


class ForecastResponse(BaseModel):
    zone_id: str
    forecasts: list[ForecastPoint]
    peak_time: datetime
    peak_density: int
    model_version: str = "prophet-v1"


# --- Anomaly Detection (Diya) ---

class ReadingInput(BaseModel):
    timestamp: datetime
    headcount: int
    flow_rate: float
    flow_velocity: float


class AnomalyRequest(BaseModel):
    zone_id: str
    readings: list[ReadingInput]
    max_capacity: int
    zone_type: str = "general"


class AnomalyResponse(BaseModel):
    zone_id: str
    is_anomaly: bool
    anomaly_type: Optional[AnomalyTypeEnum] = None
    confidence_score: float = 0.0
    severity: Optional[SeverityEnum] = None
    description: str = ""
    recommended_action: str = ""


# --- Weather (Shreyashi) ---

class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: str
    condition: str
    precipitation: float
    visibility: float
    forecast_24h: list[dict] = []


class HazardRequest(BaseModel):
    site_id: str
    weather: dict
    site_features: dict


class HazardResponse(BaseModel):
    hazard_level: HazardLevelEnum
    hazard_type: Optional[str] = None
    advisory: Optional[str] = None
    affected_zone_types: list[str] = []


# --- Multilingual Translator (Diya) ---

class TranslateRequest(BaseModel):
    text: str
    source_language: str = "en"
    target_language: str = "hi"


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


class TTSResponse(BaseModel):
    audio_base64: str
    format: str = "wav"
    language: str


class STTRequest(BaseModel):
    audio_base64: str
    language: str = "hi"


class STTResponse(BaseModel):
    text: str
    language: str
    confidence: float


# --- Generic API Envelope ---

class ApiEnvelope(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    message: str = ""