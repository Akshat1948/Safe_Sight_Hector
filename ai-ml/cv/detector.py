import logging
import cv2
import numpy as np
import base64
import time
from typing import List

from shared.schemas import DetectionResult, BoundingBox

logger = logging.getLogger(__name__)

class PersonDetector:
    def __init__(self):
        self.model = None

    def _load_model(self):
        if self.model is None:
            logger.info("Loading YOLOv8n model...")
            from ultralytics import YOLO
            try:
                self.model = YOLO("yolov8n.pt")
                logger.info("YOLOv8n model loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading YOLOv8n model: {e}")
                raise e

    def detect(self, image: np.ndarray, confidence: float = 0.35) -> DetectionResult:
        self._load_model()
        start_time = time.time()
        
        annotated_img = image.copy()
        
        try:
            results = self.model(image, classes=[0], conf=confidence, verbose=False)
            
            detections = []
            if len(results) > 0:
                result = results[0]
                boxes = result.boxes
                
                for box in boxes:
                    x1, y1, x2, y2 = map(float, box.xyxy[0])
                    conf = float(box.conf[0])
                    
                    detections.append(BoundingBox(
                        x1=x1, y1=y1, x2=x2, y2=y2, confidence=conf, label="person"
                    ))
                    
                    cv2.rectangle(annotated_img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    cv2.putText(annotated_img, f"Person {conf:.2f}", (int(x1), max(10, int(y1)-5)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            _, buffer = cv2.imencode('.jpg', annotated_img)
            encoded_image = base64.b64encode(buffer).decode('utf-8')
            
            processing_time = (time.time() - start_time) * 1000
            
            return DetectionResult(
                total_persons=len(detections),
                detections=detections,
                annotated_image_base64=encoded_image,
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error during detection: {e}")
            raise e
