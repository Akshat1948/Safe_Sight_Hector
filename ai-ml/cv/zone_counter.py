import cv2
import numpy as np
from shared.schemas import DensityStatusEnum

class ZoneCounter:
    @staticmethod
    def is_point_in_polygon(point, polygon):
        pts = np.array(polygon, np.int32)
        pts = pts.reshape((-1, 1, 2))
        return cv2.pointPolygonTest(pts, point, False) >= 0

    def count_in_zones(self, detections, zones_config):
        zone_counts = {zone['id']: 0 for zone in zones_config}
        
        for det in detections:
            center_x = (det.x1 + det.x2) / 2
            center_y = (det.y1 + det.y2) / 2
            point = (center_x, center_y)
            
            for zone in zones_config:
                polygon = zone.get('points', [])
                if not polygon:
                    continue
                if self.is_point_in_polygon(point, polygon):
                    zone_counts[zone['id']] += 1
                    
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
