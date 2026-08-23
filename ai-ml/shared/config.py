import os


BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3001/api")

BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", "")
BHASHINI_USER_ID = os.getenv("BHASHINI_USER_ID", "")
BHASHINI_BASE_URL = os.getenv("BHASHINI_BASE_URL", "https://meity-auth.ulcacontrib.org")

IMD_API_URL = os.getenv("IMD_API_URL", "https://api.weather.gov.in")

SUPPORTED_LANGUAGES = [
    "en", "hi", "ta", "te", "bn", "mr", "gu", "kn",
    "ml", "pa", "or", "as", "ur",
]

DENSITY_THRESHOLDS = {
    "green_max": 0.5,
    "yellow_max": 0.7,
    "orange_max": 0.9,
}