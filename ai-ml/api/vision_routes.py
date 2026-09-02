import logging
import cv2
import numpy as np
import httpx
import base64
import json
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, Query, Body, HTTPException

from shared.schemas import (
    ApiEnvelope, DetectionResult, VisionAnalysisResponse, ZoneDetectionResult
)
from shared.config import BACKEND_API_URL
from cv.detector import PersonDetector
from cv.zone_counter import ZoneCounter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Vision Analysis"])

detector = PersonDetector()
zone_counter = ZoneCounter()

@router.post("/vision/detect", response_model=ApiEnvelope)
async def detect(
    file: UploadFile = File(...),
    confidence: float = Query(0.35, ge=0.0, le=1.0)
):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image file")
            
        result = detector.detect(img, confidence)
        zone_counts = zone_counter.count_in_zones(result.detections, img.shape[1], img.shape[0])
        
        zone_breakdown = []
        for z in zone_counter.count_in_zones.__defaults__[0] if zone_counter.count_in_zones.__defaults__ else []:
            pass
        from cv.zone_counter import DEFAULT_CCTV_ZONES
        for z in DEFAULT_CCTV_ZONES:
            cnt = zone_counts.get(z['id'], 0)
            max_cap = z['max_capacity']
            pct = (cnt / max_cap * 100) if max_cap > 0 else 0
            status = zone_counter.calculate_density_status(cnt, max_cap)
            zone_breakdown.append({
                "zone_id": z['id'],
                "zone_name": z['name'],
                "headcount": cnt,
                "max_capacity": max_cap,
                "density_percentage": pct,
                "density_status": status,
                "color": z.get('color', '#3b82f6'),
            })

        data_dict = result.model_dump()
        data_dict["zone_breakdown"] = zone_breakdown
        
        return ApiEnvelope(
            success=True,
            data=data_dict,
            message="Detection completed"
        )
    except Exception as e:
        logger.error(f"Error in detect: {e}")
        return ApiEnvelope(success=False, message=str(e))

@router.post("/vision/analyze-zones", response_model=ApiEnvelope)
async def analyze_zones(
    file: UploadFile = File(...),
    zone_configs: str = Body(None),
    auto_update: bool = Query(False)
):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image file")
            
        zones = []
        if zone_configs:
            zones = json.loads(zone_configs)
        else:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(f"{BACKEND_API_URL}/zones", timeout=3.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        zones = data.get("data", [])
            except Exception as ex:
                logger.warning(f"Could not fetch zones from backend: {ex}")
        
        result = detector.detect(img)
        
        zones_parsed = []
        if zones:
            for z in zones:
                points = z.get('points', [])
                if isinstance(points, str):
                    try:
                        points = json.loads(points)
                    except:
                        points = []
                
                zones_parsed.append({
                    'id': z.get('id', z.get('_id')),
                    'name': z.get('name', 'Unknown Zone'),
                    'max_capacity': z.get('maxCapacity', 100),
                    'points': points
                })
        else:
            from cv.zone_counter import DEFAULT_CCTV_ZONES
            zones_parsed = DEFAULT_CCTV_ZONES
            
        zone_counts = zone_counter.count_in_zones(result.detections, img.shape[1], img.shape[0], zones_parsed)
        
        zone_breakdown = []
        for z in zones_parsed:
            headcount = zone_counts.get(z['id'], 0)
            max_cap = z['max_capacity']
            pct = (headcount / max_cap * 100) if max_cap > 0 else 0
            status = zone_counter.calculate_density_status(headcount, max_cap)
            
            zone_breakdown.append(ZoneDetectionResult(
                zone_id=str(z['id']),
                zone_name=z['name'],
                headcount=headcount,
                max_capacity=max_cap,
                density_percentage=pct,
                density_status=status
            ))
            
            if auto_update:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.patch(
                            f"{BACKEND_API_URL}/zones/{z['id']}/density",
                            json={
                                "headcount": headcount,
                                "flowRate": 0.0,
                                "flowVelocity": 0.0,
                                "source": "cctv_yolo"
                            },
                            timeout=2.0
                        )
                except Exception as patch_err:
                    logger.error(f"Failed to patch density for zone {z['id']}: {patch_err}")
                    
        response_data = VisionAnalysisResponse(
            total_persons=result.total_persons,
            zone_breakdown=zone_breakdown,
            annotated_image_base64=result.annotated_image_base64,
            processing_time_ms=result.processing_time_ms,
            timestamp=datetime.now().isoformat()
        )
        
        return ApiEnvelope(
            success=True,
            data=response_data.model_dump(),
            message="Analysis completed"
        )
    except Exception as e:
        logger.error(f"Error in analyze_zones: {e}")
        return ApiEnvelope(success=False, message=str(e))

@router.post("/vision/detect-base64", response_model=ApiEnvelope)
async def detect_base64(
    payload: dict = Body(...)
):
    try:
        image_b64 = payload.get("image_base64", "")
        confidence = float(payload.get("confidence", 0.35))
        auto_update = bool(payload.get("auto_update", False))
        
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
            
        img_data = base64.b64decode(image_b64)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image data")
            
        result = detector.detect(img, confidence)
        from cv.zone_counter import DEFAULT_CCTV_ZONES
        zone_counts = zone_counter.count_in_zones(result.detections, img.shape[1], img.shape[0], DEFAULT_CCTV_ZONES)
        
        zone_breakdown = []
        for z in DEFAULT_CCTV_ZONES:
            cnt = zone_counts.get(z['id'], 0)
            max_cap = z['max_capacity']
            pct = (cnt / max_cap * 100) if max_cap > 0 else 0
            status = zone_counter.calculate_density_status(cnt, max_cap)
            zone_breakdown.append({
                "zone_id": z['id'],
                "zone_name": z['name'],
                "headcount": cnt,
                "max_capacity": max_cap,
                "density_percentage": round(pct, 1),
                "density_status": status.value,
                "color": z.get('color', '#3b82f6'),
            })

        data_dict = result.model_dump()
        data_dict["zone_breakdown"] = zone_breakdown
        data_dict["img_width"] = int(img.shape[1])
        data_dict["img_height"] = int(img.shape[0])
        
        return ApiEnvelope(
            success=True,
            data=data_dict,
            message="Live frame detected"
        )
    except Exception as e:
        logger.error(f"Error in detect_base64: {e}")
        return ApiEnvelope(success=False, message=str(e))
