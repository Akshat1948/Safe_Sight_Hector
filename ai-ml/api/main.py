import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.forecast_routes import router as forecast_router
from api.weather_routes import router as weather_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SafeSight AI/ML service starting on port 8000 (base: /ml)")
    yield
    logger.info("SafeSight AI/ML service shutting down.")


app = FastAPI(
    title="SafeSight AI/ML Service",
    description=(
        "Crowd forecasting, weather intelligence, anomaly detection, "
        "and multilingual services for SafeSight."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shreyashi's routers
app.include_router(forecast_router, prefix="/ml")
app.include_router(weather_router, prefix="/ml")

# Diya's routes
from api.anomaly_routes import router as anomaly_router
from api.bhashini_routes import router as bhashini_router
app.include_router(anomaly_router, prefix="/ml")
app.include_router(bhashini_router, prefix="/ml")


@app.get("/ml/health")
async def health_check():
    return {
        "success": True,
        "data": {"status": "ok", "service": "SafeSight AI/ML"},
        "message": "Service is running",
    }
