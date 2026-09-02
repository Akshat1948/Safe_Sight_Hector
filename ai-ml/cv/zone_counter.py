import cv2
import numpy as np
from shared.schemas import DensityStatusEnum

DEFAULT_CCTV_ZONES = [
    {
        "id": "zone-a",
        "name": "Zone A — Main Entry Plaza",
        "max_capacity": 50,
        "normalized_polygon": [[0.0, 0.0], [0.5, 0.0], [0.5, 0.5], [0.0, 0.5]],
        "color": "#3b82f6", # Blue
    },
    {
        "id": "zone-b",
        "name": "Zone B — Riverside Ghat Corridor",
        "max_capacity": 30,
        "normalized_polygon": [[0.5, 0.0], [1.0, 0.0], [1.0, 0.5], [0.5, 0.5]],
        "color": "#eab308", # Yellow
    },
    {
        "id": "zone-c",
        "name": "Zone C — Ghat Staircase (Chokepoint)",
        "max_capacity": 20,
        "normalized_polygon": [[0.5, 0.5], [1.0, 0.5], [1.0, 1.0], [0.5, 1.0]],
        "color": "#ef4444", # Red
    },
    {
        "id": "zone-d",
        "name": "Zone D — Safe Assembly & Exit",
        "max_capacity": 60,
        "normalized_polygon": [[0.0, 0.5], [0.5, 0.5], [0.5, 1.0], [0.0, 1.0]],
        "color": "#22c55e", # Green
    },
]

class ZoneCounter:
    @staticmethod
    def is_point_in_polygon(point, polygon):
        pts = np.array(polygon, np.float32)
        pts = pts.reshape((-1, 1, 2))
        return cv2.pointPolygonTest(pts, (float(point[0]), float(point[1])), False) >= 0

    def count_in_zones(self, detections, img_width: int = 640, img_height: int = 480, zones_config=None):
        if not zones_config:
            zones_config = DEFAULT_CCTV_ZONES

        zone_counts = {zone['id']: 0 for zone in zones_config}
        
        for det in detections:
            # Person bottom center (feet/ground contact point for accurate zone containment)
            center_x = (det.x1 + det.x2) / 2.0
            feet_y = det.y2 # Use feet point instead of center for perspective accuracy
            
            # Normalized coordinates (0 to 1)
            norm_x = center_x / max(img_width, 1)
            norm_y = feet_y / max(img_height, 1)
            
            matched_zone_id = None
            matched_zone_name = None

            for zone in zones_config:
                # Check normalized polygon first
                norm_poly = zone.get('normalized_polygon')
                if norm_poly:
                    if self.is_point_in_polygon((norm_x, norm_y), norm_poly):
                        zone_counts[zone['id']] += 1
                        matched_zone_id = zone['id']
                        matched_zone_name = zone['name']
                        break
                else:
                    # Check pixel polygon
                    poly = zone.get('points', [])
                    if poly and self.is_point_in_polygon((center_x, feet_y), poly):
                        zone_counts[zone['id']] += 1
                        matched_zone_id = zone['id']
                        matched_zone_name = zone['name']
                        break

            # Attach zone tag to detection if matching
            if hasattr(det, 'zone_id'):
                det.zone_id = matched_zone_id
                det.zone_name = matched_zone_name

        return zone_counts

    def calculate_density_status(self, headcount: int, max_capacity: int) -> DensityStatusEnum:
        if max_capacity <= 0:
            return DensityStatusEnum.GREEN
        
        percentage = headcount / max_capacity * 100
        
        if percentage < 50:
            return DensityStatusEnum.GREEN
        elif percentage < 75:
            return DensityStatusEnum.YELLOW
        elif percentage < 90:
            return DensityStatusEnum.ORANGE
        else:
            return DensityStatusEnum.RED

