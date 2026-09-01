import cv2
import numpy as np
import logging
import os
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

logger = logging.getLogger(__name__)

# Lazy load model
_yolo_model = None

def get_yolo_model():
    global _yolo_model
    if not YOLO_AVAILABLE:
        return None
    if _yolo_model is None:
        try:
            # We use the nano segmentation model for fast CPU/ONNX inference
            model_path = os.path.join(os.path.dirname(__file__), "yolov8n-seg.pt")
            if not os.path.exists(model_path):
                # Download weights on first run
                _yolo_model = YOLO("yolov8n-seg.pt") 
            else:
                _yolo_model = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            return None
    return _yolo_model

def segment_label(image_path: str) -> np.ndarray:
    """
    Step 2: YOLO26n-Seg (package/label segmentation)
    Uses YOLOv8-seg to detect the main package/label and mask out the cluttered background.
    Returns a masked image (ROI).
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image for YOLO segmentation.")
        
    model = get_yolo_model()
    if not model:
        logger.warning("YOLO not available. Skipping segmentation.")
        return img
        
    try:
        # Run inference
        results = model(img, stream=False)
        
        if not results or not results[0].masks:
            logger.warning("No label/package masks detected by YOLO. Using original image.")
            return img
            
        # Get the mask for the largest detected object (assuming it's the package)
        masks = results[0].masks.data.cpu().numpy()
        boxes = results[0].boxes.data.cpu().numpy()
        
        # Find largest bounding box area
        largest_idx = np.argmax((boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1]))
        
        # Resize mask to original image dimensions
        mask = masks[largest_idx]
        mask_resized = cv2.resize(mask, (img.shape[1], img.shape[0]))
        
        # Create a binary mask and apply it
        binary_mask = (mask_resized > 0.5).astype(np.uint8) * 255
        
        # Create an RGBA image or black out the background
        img_segmented = cv2.bitwise_and(img, img, mask=binary_mask)
        
        # Optional: Crop to the bounding box of the mask to get purely the ROI
        x1, y1, x2, y2 = map(int, boxes[largest_idx][:4])
        roi = img_segmented[y1:y2, x1:x2]
        
        return roi
        
    except Exception as e:
        logger.error(f"YOLO segmentation failed: {e}")
        return img
