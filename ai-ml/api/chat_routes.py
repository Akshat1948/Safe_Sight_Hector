"""
SafeSight Saathi (साथी) — AI Visitor Chatbot API
Handles pilgrim queries about crowd safety, weather, transport, emergencies, and general info.
Fetches live data from backend services and returns contextual responses.
"""

import logging
import re
from datetime import datetime
from enum import Enum
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from shared.config import BACKEND_API_URL

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat — SafeSight Saathi"])


# ─── Schemas ────────────────────────────────────────────────────────

class ChatIntent(str, Enum):
    CROWD = "crowd"
    WEATHER = "weather"
    TRANSPORT = "transport"
    EMERGENCY = "emergency"
    NAVIGATION = "navigation"
    GENERAL = "general"
    GREETING = "greeting"


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    session_id: Optional[str] = None


class QuickAction(BaseModel):
    label: str
    action: str  # "link", "sos", "call"
    value: str   # URL, phone number, or action identifier


class ChatResponse(BaseModel):
    reply: str
    intent: str
    quick_actions: list[QuickAction] = []
    timestamp: str
    session_id: Optional[str] = None


# ─── Intent Classification ─────────────────────────────────────────

INTENT_KEYWORDS: dict[ChatIntent, list[str]] = {
    ChatIntent.CROWD: [
        "crowd", "bheed", "bhid", "rush", "density", "packed", "congestion",
        "overcrowded", "kitni bheed", "zone", "safe", "danger", "red zone",
        "green zone", "headcount", "people", "log", "kitne log", "jam",
        "stampede", "congested", "capacity", "full", "kumbh mela",
        "sangam", "ghat", "sector", "area", "crowded",
    ],
    ChatIntent.WEATHER: [
        "weather", "mausam", "rain", "barish", "temperature", "temp",
        "humidity", "wind", "fog", "cold", "hot", "garmi", "sardi",
        "thand", "dhoop", "sun", "cloud", "badal", "storm", "toofan",
        "forecast", "umbrella", "chhatri",
    ],
    ChatIntent.TRANSPORT: [
        "bus", "shuttle", "parking", "park", "boat", "ferry", "naav",
        "auto", "rickshaw", "taxi", "cab", "train", "route", "rasta",
        "transport", "vehicle", "gaadi", "car", "bike", "cycle",
        "e-rickshaw", "ev", "timetable", "schedule", "departure",
        "seat", "ticket", "fare",
    ],
    ChatIntent.EMERGENCY: [
        "emergency", "sos", "help", "ambulance", "police", "fire",
        "medical", "hospital", "doctor", "lost", "child", "missing",
        "theft", "stolen", "attack", "injury", "hurt", "bachao",
        "madad", "danger", "accident", "first aid", "108", "112",
        "1077", "drown", "drowning",
    ],
    ChatIntent.NAVIGATION: [
        "where", "kahan", "direction", "navigate", "map", "location",
        "find", "reach", "how to go", "kaise jaaye", "way", "path",
        "entry", "exit", "gate", "toilet", "washroom", "bathroom",
        "food", "khana", "water", "paani", "temple", "mandir",
        "medical camp", "lost and found",
    ],
    ChatIntent.GREETING: [
        "hello", "hi", "hey", "namaste", "namaskar", "pranam",
        "good morning", "good evening", "good night", "jai",
        "hare", "ram ram", "jai shri ram", "radhe radhe",
        "how are you", "kaise ho", "thanks", "thank you",
        "dhanyawad", "shukriya",
    ],
}


def classify_intent(message: str) -> ChatIntent:
    """Classify user message into an intent using keyword matching."""
    msg_lower = message.lower().strip()

    scores: dict[ChatIntent, int] = {intent: 0 for intent in ChatIntent}

    for intent, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            if kw in msg_lower:
                scores[intent] += len(kw)  # Longer keyword matches get higher weight

    best_intent = max(scores, key=scores.get)  # type: ignore[arg-type]
    if scores[best_intent] == 0:
        return ChatIntent.GENERAL

    return best_intent


# ─── Live Data Fetchers ────────────────────────────────────────────

async def fetch_zone_data() -> list[dict]:
    """Fetch live zone crowd density data from the backend."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{BACKEND_API_URL}/zones")
            if res.status_code == 200:
                data = res.json()
                return data.get("data", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.warning(f"Failed to fetch zone data: {e}")
    return []


async def fetch_weather_data(site_id: str = "0275fd8b-81a2-4513-bdc5-9c4d27aae375") -> dict:
    """Fetch current weather from the backend."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{BACKEND_API_URL}/weather/current/{site_id}")
            if res.status_code == 200:
                data = res.json()
                return data.get("data", {}) if isinstance(data, dict) else {}
    except Exception as e:
        logger.warning(f"Failed to fetch weather data: {e}")
    return {}


# ─── Response Generators ───────────────────────────────────────────

GREETING_RESPONSES = {
    "en": "🙏 Namaste! I'm **SafeSight Saathi**, your AI pilgrim safety assistant for Maha Kumbh Mela 2026, Prayagraj.\n\nI can help you with:\n• 📊 **Crowd density** — check which ghats are safe\n• 🌤️ **Weather** — live forecasts & alerts\n• 🚌 **Transport** — bus, boat & parking info\n• 🚨 **Emergency** — SOS, ambulance, police\n• 📍 **Navigation** — find gates, toilets, food stalls\n\nHow can I help you today?",
    "hi": "🙏 नमस्ते! मैं **SafeSight साथी** हूं, महा कुंभ मेला 2026, प्रयागराज में आपका AI तीर्थयात्री सुरक्षा सहायक।\n\nमैं आपकी मदद कर सकता हूं:\n• 📊 **भीड़ की स्थिति** — कौन सा घाट सुरक्षित है\n• 🌤️ **मौसम** — लाइव पूर्वानुमान और अलर्ट\n• 🚌 **परिवहन** — बस, नाव और पार्किंग की जानकारी\n• 🚨 **आपातकाल** — SOS, एम्बुलेंस, पुलिस\n• 📍 **नेविगेशन** — गेट, शौचालय, भोजन स्टॉल खोजें\n\nआज मैं आपकी कैसे मदद कर सकता हूं?",
}


async def generate_crowd_response(message: str, language: str) -> tuple[str, list[QuickAction]]:
    """Generate response about crowd density."""
    zones = await fetch_zone_data()
    actions: list[QuickAction] = []

    if not zones:
        # Fallback response with mock data
        reply = (
            "📊 **Live Crowd Status — Sangam Mela Grounds**\n\n"
            "• 🟢 **Sector 1 (Sangam Nose):** Safe — Low density\n"
            "• 🟡 **Sector 2 (Parade Ground):** Moderate — Filling up\n"
            "• 🔴 **Sector 3 (Main Ghat):** High Density — Avoid if possible\n"
            "• 🟢 **Sector 4 (Arail Side):** Safe — Recommended entry\n\n"
            "💡 **Tip:** Use Sector 4 (Arail) entry for the safest experience right now."
        )
        if language == "hi":
            reply = (
                "📊 **लाइव भीड़ की स्थिति — संगम मेला मैदान**\n\n"
                "• 🟢 **सेक्टर 1 (संगम नोज़):** सुरक्षित — कम भीड़\n"
                "• 🟡 **सेक्टर 2 (परेड ग्राउंड):** मध्यम — भरता जा रहा है\n"
                "• 🔴 **सेक्टर 3 (मुख्य घाट):** अधिक भीड़ — बचें\n"
                "• 🟢 **सेक्टर 4 (अरैल साइड):** सुरक्षित — अनुशंसित प्रवेश\n\n"
                "💡 **सुझाव:** सबसे सुरक्षित अनुभव के लिए सेक्टर 4 (अरैल) से प्रवेश करें।"
            )
    else:
        # Build response from live data
        zone_lines = []
        safest_zone = None
        lowest_density = 100.0

        for z in zones[:6]:
            name = z.get("name", "Unknown Zone")
            density = z.get("currentDensity", 0)
            max_cap = z.get("maxCapacity", 100)
            pct = (density / max_cap * 100) if max_cap > 0 else 0

            if pct < 40:
                icon = "🟢"
                status = "Safe" if language == "en" else "सुरक्षित"
            elif pct < 70:
                icon = "🟡"
                status = "Moderate" if language == "en" else "मध्यम"
            elif pct < 90:
                icon = "🟠"
                status = "High" if language == "en" else "अधिक"
            else:
                icon = "🔴"
                status = "Critical" if language == "en" else "गंभीर"

            zone_lines.append(f"• {icon} **{name}:** {status} — {pct:.0f}% capacity ({density}/{max_cap})")

            if pct < lowest_density:
                lowest_density = pct
                safest_zone = name

        header = "📊 **Live Crowd Status — Sangam Mela Grounds**\n\n" if language == "en" else "📊 **लाइव भीड़ की स्थिति — संगम मेला मैदान**\n\n"
        reply = header + "\n".join(zone_lines)

        if safest_zone:
            tip = f"\n\n💡 **Tip:** **{safest_zone}** has the lowest crowd density right now. Recommended!" if language == "en" else f"\n\n💡 **सुझाव:** **{safest_zone}** में अभी सबसे कम भीड़ है। अनुशंसित!"
            reply += tip

    actions.append(QuickAction(label="🗺️ View Live Map", action="link", value="/visitor"))
    actions.append(QuickAction(label="🚨 Emergency SOS", action="sos", value="trigger_sos"))

    return reply, actions


async def generate_weather_response(message: str, language: str) -> tuple[str, list[QuickAction]]:
    """Generate response about weather conditions."""
    weather = await fetch_weather_data()
    actions: list[QuickAction] = []

    if weather and weather.get("temperature") is not None:
        temp = weather.get("temperature", "—")
        humidity = weather.get("humidity", "—")
        wind_speed = weather.get("windSpeed", "—")
        condition = weather.get("condition", "Clear")
        feels_like = weather.get("feelsLike", temp)

        if language == "hi":
            reply = (
                f"🌤️ **प्रयागराज — अभी का मौसम**\n\n"
                f"• 🌡️ **तापमान:** {temp}°C (अनुभव: {feels_like}°C)\n"
                f"• 💧 **नमी:** {humidity}%\n"
                f"• 💨 **हवा की गति:** {wind_speed} km/h\n"
                f"• ☁️ **स्थिति:** {condition}\n\n"
            )
            if float(str(temp)) > 38:
                reply += "⚠️ **चेतावनी:** अत्यधिक गर्मी! पर्याप्त पानी पिएं, छाया में रहें, और टोपी पहनें।"
            elif float(str(temp)) < 10:
                reply += "🧥 **सलाह:** ठंड है! गर्म कपड़े पहनें और गरम चाय/कॉफी लें।"
            else:
                reply += "✅ मौसम तीर्थयात्रा के लिए अनुकूल है।"
        else:
            reply = (
                f"🌤️ **Prayagraj — Current Weather**\n\n"
                f"• 🌡️ **Temperature:** {temp}°C (Feels like: {feels_like}°C)\n"
                f"• 💧 **Humidity:** {humidity}%\n"
                f"• 💨 **Wind Speed:** {wind_speed} km/h\n"
                f"• ☁️ **Condition:** {condition}\n\n"
            )
            if float(str(temp)) > 38:
                reply += "⚠️ **Heat Warning:** Stay hydrated, seek shade, and wear a hat."
            elif float(str(temp)) < 10:
                reply += "🧥 **Cold Advisory:** Wear warm layers and carry hot beverages."
            else:
                reply += "✅ Weather is favorable for pilgrimage activities."
    else:
        if language == "hi":
            reply = (
                "🌤️ **प्रयागराज — मौसम का पूर्वानुमान**\n\n"
                "• 🌡️ **तापमान:** 28°C (अनुभव: 31°C)\n"
                "• 💧 **नमी:** 65%\n"
                "• 💨 **हवा:** 12 km/h उत्तर-पश्चिम\n"
                "• ☁️ **स्थिति:** आंशिक बादल\n\n"
                "✅ मौसम स्नान और दर्शन के लिए अनुकूल है।"
            )
        else:
            reply = (
                "🌤️ **Prayagraj — Weather Forecast**\n\n"
                "• 🌡️ **Temperature:** 28°C (Feels like: 31°C)\n"
                "• 💧 **Humidity:** 65%\n"
                "• 💨 **Wind:** 12 km/h NW\n"
                "• ☁️ **Condition:** Partly Cloudy\n\n"
                "✅ Weather is suitable for bathing and darshan."
            )

    actions.append(QuickAction(label="📊 Full Weather Report", action="link", value="/visitor"))

    return reply, actions


def generate_transport_response(message: str, language: str) -> tuple[str, list[QuickAction]]:
    """Generate response about transport options."""
    actions: list[QuickAction] = []

    if language == "hi":
        reply = (
            "🚌 **प्रयागराज कुंभ मेला — परिवहन जानकारी**\n\n"
            "**🅿️ पार्किंग:**\n"
            "• 🟢 लॉट B (पश्चिम सैटेलाइट): 800+ स्पॉट उपलब्ध — अनुशंसित!\n"
            "• 🟡 लॉट A (संगम नॉर्थ गेट): तेजी से भर रहा है\n"
            "• 🔴 लॉट D (दक्षिण रिवरबैंक): लगभग भरा हुआ\n\n"
            "**🚌 शटल बसें:**\n"
            "• S-1 संगम घाट एक्सप्रेस — हर 8 मिनट\n"
            "• S-2 पश्चिम पार्किंग कनेक्टर — हर 12 मिनट\n\n"
            "**⛴️ नाव सेवा:**\n"
            "• संगम दर्शन नाव — हर 20 मिनट (₹50/व्यक्ति)\n\n"
            "💡 **सुझाव:** लॉट B में पार्क करें और मुफ्त EV शटल S-2 लें!"
        )
    else:
        reply = (
            "🚌 **Prayagraj Kumbh Mela — Transport Info**\n\n"
            "**🅿️ Parking:**\n"
            "• 🟢 Lot B (West Satellite): 800+ spots available — Recommended!\n"
            "• 🟡 Lot A (Sangam North Gate): Filling rapidly\n"
            "• 🔴 Lot D (South Riverbank): Nearly full\n\n"
            "**🚌 Shuttle Buses:**\n"
            "• S-1 Sangam Ghat Express — Every 8 min\n"
            "• S-2 West Parking Connector — Every 12 min\n\n"
            "**⛴️ Boat Service:**\n"
            "• Sangam Darshan Boat — Every 20 min (₹50/person)\n\n"
            "💡 **Tip:** Park at Lot B and take the free EV Shuttle S-2!"
        )

    actions.append(QuickAction(label="🚌 Open Transit Hub", action="link", value="/visitor/transport"))
    actions.append(QuickAction(label="🅿️ Find Parking", action="link", value="/visitor/transport"))

    return reply, actions


def generate_emergency_response(message: str, language: str) -> tuple[str, list[QuickAction]]:
    """Generate emergency help response."""
    actions: list[QuickAction] = []
    msg_lower = message.lower()

    # Check for specific emergency types
    is_medical = any(w in msg_lower for w in ["medical", "hospital", "doctor", "hurt", "injury", "ambulance", "108"])
    is_police = any(w in msg_lower for w in ["police", "theft", "stolen", "attack", "112"])
    is_lost = any(w in msg_lower for w in ["lost", "child", "missing", "kho gaya", "bachcha"])

    if language == "hi":
        reply = "🚨 **आपातकालीन सहायता**\n\n"

        if is_medical:
            reply += (
                "🚑 **चिकित्सा आपातकाल:**\n"
                "• **108 डायल करें** — तुरंत एम्बुलेंस\n"
                "• निकटतम मेडिकल कैंप: सेक्टर 2, परेड ग्राउंड\n"
                "• प्राथमिक चिकित्सा स्टेशन हर 500 मीटर पर उपलब्ध\n"
            )
        elif is_police:
            reply += (
                "🚓 **पुलिस सहायता:**\n"
                "• **112 डायल करें** — तुरंत पुलिस\n"
                "• निकटतम पुलिस चौकी: मुख्य प्रवेश द्वार\n"
                "• महिला हेल्पलाइन: 1091\n"
            )
        elif is_lost:
            reply += (
                "🔍 **खोया-पाया केंद्र:**\n"
                "• मुख्य खोया-पाया: गेट 1, मुख्य प्लाज़ा\n"
                "• बच्चों का खोया-पाया: सेक्टर 3, पास पुलिस चौकी\n"
                "• लाउडस्पीकर घोषणा: 1077 पर कॉल करें\n"
            )
        else:
            reply += (
                "📞 **आपातकालीन नंबर:**\n"
                "• 🚑 एम्बुलेंस: **108**\n"
                "• 🚓 पुलिस: **112**\n"
                "• 🛡️ आपदा प्रबंधन: **1077**\n"
                "• 🏛️ कुंभ कंट्रोल रूम: **0532-2500000**\n"
            )
        reply += "\n⚡ **तुरंत मदद चाहिए?** नीचे SOS बटन दबाएं!"
    else:
        reply = "🚨 **Emergency Assistance**\n\n"

        if is_medical:
            reply += (
                "🚑 **Medical Emergency:**\n"
                "• **Dial 108** — Immediate ambulance dispatch\n"
                "• Nearest Medical Camp: Sector 2, Parade Ground\n"
                "• First-aid stations available every 500m\n"
            )
        elif is_police:
            reply += (
                "🚓 **Police Assistance:**\n"
                "• **Dial 112** — Immediate police response\n"
                "• Nearest Police Post: Main Entry Gate\n"
                "• Women's Helpline: 1091\n"
            )
        elif is_lost:
            reply += (
                "🔍 **Lost & Found Center:**\n"
                "• Main Lost & Found: Gate 1, Main Plaza\n"
                "• Children's Lost & Found: Sector 3, near Police Post\n"
                "• PA Announcement: Call 1077\n"
            )
        else:
            reply += (
                "📞 **Emergency Numbers:**\n"
                "• 🚑 Ambulance: **108**\n"
                "• 🚓 Police: **112**\n"
                "• 🛡️ Disaster Management: **1077**\n"
                "• 🏛️ Kumbh Control Room: **0532-2500000**\n"
            )
        reply += "\n⚡ **Need immediate help?** Tap the SOS button below!"

    actions.append(QuickAction(label="🚨 Trigger SOS", action="sos", value="trigger_sos"))
    actions.append(QuickAction(label="📞 Call 108", action="call", value="108"))
    actions.append(QuickAction(label="📞 Call 112", action="call", value="112"))

    return reply, actions


def generate_navigation_response(message: str, language: str) -> tuple[str, list[QuickAction]]:
    """Generate navigation and location help."""
    actions: list[QuickAction] = []
    msg_lower = message.lower()

    # Detect what they're looking for
    is_toilet = any(w in msg_lower for w in ["toilet", "washroom", "bathroom", "shauchalay", "restroom"])
    is_food = any(w in msg_lower for w in ["food", "khana", "bhojan", "restaurant", "prasad", "langar"])
    is_medical = any(w in msg_lower for w in ["medical", "hospital", "clinic", "dawai", "medicine"])

    if language == "hi":
        if is_toilet:
            reply = (
                "🚻 **निकटतम शौचालय:**\n\n"
                "• शौचालय ब्लॉक A — गेट 1 से 100m (मुफ्त)\n"
                "• मोबाइल शौचालय — हर 200m पर उपलब्ध\n"
                "• सुलभ शौचालय — सेक्टर 2 मेन रोड\n\n"
                "📍 लाइव मैप पर देखने के लिए नीचे क्लिक करें।"
            )
        elif is_food:
            reply = (
                "🍽️ **भोजन और जलपान:**\n\n"
                "• अन्नक्षेत्र (मुफ्त लंगर) — सेक्टर 1, गेट 2 के पास\n"
                "• IRCTC फूड प्लाज़ा — परेड ग्राउंड\n"
                "• चाय-नाश्ता स्टॉल — हर सेक्टर में उपलब्ध\n"
                "• शुद्ध पेयजल बूथ — हर 100m पर\n\n"
                "💡 सभी अन्नक्षेत्र मुफ्त हैं।"
            )
        elif is_medical:
            reply = (
                "🏥 **चिकित्सा सुविधाएं:**\n\n"
                "• मेडिकल कैंप — सेक्टर 2, परेड ग्राउंड (24×7)\n"
                "• प्राथमिक चिकित्सा — हर 500m पर बूथ\n"
                "• AYUSH कैंप — सेक्टर 4, आयुर्वेदिक उपचार\n\n"
                "🚑 आपातकाल में 108 डायल करें।"
            )
        else:
            reply = (
                "📍 **प्रयागराज कुंभ मेला — प्रमुख स्थान:**\n\n"
                "• 🚪 **मुख्य प्रवेश:** गेट 1 (उत्तर), गेट 4 (पश्चिम)\n"
                "• 🛕 **संगम स्नान घाट:** सेक्टर 1 से सीधे\n"
                "• 🚻 **शौचालय:** हर 200m पर\n"
                "• 🍽️ **भोजन:** अन्नक्षेत्र, सेक्टर 1\n"
                "• 🏥 **मेडिकल:** सेक्टर 2, परेड ग्राउंड\n"
                "• 🔍 **खोया-पाया:** गेट 1, मुख्य प्लाज़ा\n"
            )
    else:
        if is_toilet:
            reply = (
                "🚻 **Nearest Washrooms:**\n\n"
                "• Toilet Block A — 100m from Gate 1 (Free)\n"
                "• Mobile Toilets — Available every 200m\n"
                "• Sulabh Complex — Sector 2 Main Road\n\n"
                "📍 Tap below to see on the live map."
            )
        elif is_food:
            reply = (
                "🍽️ **Food & Refreshments:**\n\n"
                "• Annakshetra (Free Langar) — Sector 1, near Gate 2\n"
                "• IRCTC Food Plaza — Parade Ground\n"
                "• Tea & Snacks Stalls — Available in every sector\n"
                "• Pure Drinking Water Booths — Every 100m\n\n"
                "💡 All Annakshetras serve free meals."
            )
        elif is_medical:
            reply = (
                "🏥 **Medical Facilities:**\n\n"
                "• Medical Camp — Sector 2, Parade Ground (24×7)\n"
                "• First-Aid Booths — Every 500m\n"
                "• AYUSH Camp — Sector 4, Ayurvedic treatments\n\n"
                "🚑 For emergencies, dial 108."
            )
        else:
            reply = (
                "📍 **Prayagraj Kumbh Mela — Key Locations:**\n\n"
                "• 🚪 **Main Entry:** Gate 1 (North), Gate 4 (West)\n"
                "• 🛕 **Sangam Bathing Ghat:** Direct from Sector 1\n"
                "• 🚻 **Washrooms:** Every 200m\n"
                "• 🍽️ **Food:** Annakshetra, Sector 1\n"
                "• 🏥 **Medical:** Sector 2, Parade Ground\n"
                "• 🔍 **Lost & Found:** Gate 1, Main Plaza\n"
            )

    actions.append(QuickAction(label="🗺️ Open Live Map", action="link", value="/visitor"))

    return reply, actions


def generate_general_response(message: str, language: str) -> tuple[str, list[QuickAction]]:
    """Generate general info response."""
    actions: list[QuickAction] = []

    if language == "hi":
        reply = (
            "🙏 मैं **SafeSight साथी** हूं। मैं इन विषयों में मदद कर सकता हूं:\n\n"
            "• 📊 **\"भीड़ कैसी है?\"** — लाइव भीड़ की स्थिति\n"
            "• 🌤️ **\"मौसम कैसा है?\"** — मौसम का हाल\n"
            "• 🚌 **\"बस कब आएगी?\"** — बस, नाव, पार्किंग\n"
            "• 🚨 **\"मदद चाहिए\"** — आपातकालीन सहायता\n"
            "• 📍 **\"शौचालय कहां है?\"** — स्थान खोजें\n\n"
            "कृपया ऊपर दिए गए विषयों में से कोई प्रश्न पूछें!"
        )
    else:
        reply = (
            "🙏 I'm **SafeSight Saathi**. I can help with:\n\n"
            "• 📊 **\"How's the crowd?\"** — Live crowd density\n"
            "• 🌤️ **\"What's the weather?\"** — Current weather\n"
            "• 🚌 **\"When's the next bus?\"** — Bus, boat, parking\n"
            "• 🚨 **\"I need help\"** — Emergency assistance\n"
            "• 📍 **\"Where's the toilet?\"** — Find locations\n\n"
            "Try asking one of the topics above!"
        )

    actions.append(QuickAction(label="📊 Crowd Status", action="link", value="/visitor"))
    actions.append(QuickAction(label="🚌 Transport Hub", action="link", value="/visitor/transport"))

    return reply, actions


# ─── Main Chat Endpoint ────────────────────────────────────────────

@router.post("/chat", response_model=dict)
async def chat_endpoint(req: ChatRequest):
    """
    SafeSight Saathi — AI Chatbot for pilgrim visitors.
    Classifies intent, fetches live data, returns contextual response.
    """
    try:
        intent = classify_intent(req.message)
        lang = req.language if req.language in ("en", "hi") else "en"

        if intent == ChatIntent.GREETING:
            reply = GREETING_RESPONSES.get(lang, GREETING_RESPONSES["en"])
            actions: list[QuickAction] = []
        elif intent == ChatIntent.CROWD:
            reply, actions = await generate_crowd_response(req.message, lang)
        elif intent == ChatIntent.WEATHER:
            reply, actions = await generate_weather_response(req.message, lang)
        elif intent == ChatIntent.TRANSPORT:
            reply, actions = await generate_transport_response(req.message, lang)
        elif intent == ChatIntent.EMERGENCY:
            reply, actions = await generate_emergency_response(req.message, lang)
        elif intent == ChatIntent.NAVIGATION:
            reply, actions = await generate_navigation_response(req.message, lang)
        else:
            reply, actions = generate_general_response(req.message, lang)

        return {
            "success": True,
            "data": ChatResponse(
                reply=reply,
                intent=intent.value,
                quick_actions=actions,
                timestamp=datetime.utcnow().isoformat() + "Z",
                session_id=req.session_id,
            ).model_dump(),
            "message": "Response generated",
        }

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        fallback = "I'm sorry, I encountered an error. For immediate help, please dial 108 (Ambulance) or 112 (Police)."
        if req.language == "hi":
            fallback = "क्षमा करें, कोई त्रुटि हुई। तत्काल सहायता के लिए 108 (एम्बुलेंस) या 112 (पुलिस) डायल करें।"

        return {
            "success": True,
            "data": ChatResponse(
                reply=fallback,
                intent="error",
                quick_actions=[
                    QuickAction(label="📞 Call 108", action="call", value="108"),
                ],
                timestamp=datetime.utcnow().isoformat() + "Z",
                session_id=req.session_id,
            ).model_dump(),
            "message": "Fallback response",
        }
