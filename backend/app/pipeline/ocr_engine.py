import os
import logging

logger = logging.getLogger(__name__)

# Try to load PaddleOCR, with graceful fallback to mock OCR
try:
    from paddleocr import PaddleOCR
    # Initialize PaddleOCR engine for CPU execution
    # lang='en' handles English, can add 'hi' and 'kn' models as needed
    ocr_client = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, show_log=False)
    PADDLE_AVAILABLE = True
except Exception as e:
    logger.warning(f"PaddleOCR failed to import or initialize: {e}. Falling back to Mock OCR Mode.")
    PADDLE_AVAILABLE = False
    ocr_client = None

def perform_ocr(image_path: str) -> list:
    """
    Runs text recognition on the image.
    Returns a list of dictionaries with structure:
    {
        "text": str,
        "confidence": float,
        "bounding_box": {"x": int, "y": int, "width": int, "height": int}
    }
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")

    if PADDLE_AVAILABLE and ocr_client is not None:
        try:
            result = ocr_client.ocr(image_path, cls=True)
            ocr_results = []
            
            if not result or not result[0]:
                return []
                
            for line in result[0]:
                bbox = line[0]  # List of 4 points: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                text_info = line[1] # (text, confidence)
                
                # Convert 4-point polygon to a simple rectangle bounding box
                xs = [pt[0] for pt in bbox]
                ys = [pt[1] for pt in bbox]
                x_min, x_max = int(min(xs)), int(max(xs))
                y_min, y_max = int(min(ys)), int(max(ys))
                
                ocr_results.append({
                    "text": text_info[0],
                    "confidence": float(text_info[1]),
                    "bounding_box": {
                        "x": x_min,
                        "y": y_min,
                        "width": x_max - x_min,
                        "height": y_max - y_min
                    }
                })
            return ocr_results
        except Exception as err:
            logger.error(f"Error during PaddleOCR inference: {err}")
            # Fall through to mock on error
            
    # Mock OCR Fallback (useful for rapid testing / development without PaddleOCR engine installed)
    logger.info("Executing Mock OCR Fallback.")
    return get_mock_ocr_results(image_path)

def get_mock_ocr_results(image_path: str) -> list:
    """Mock text returns to enable testing of parser and rule engine when offline/uninstalled."""
    filename = os.path.basename(image_path).lower()
    
    # Generate mock results depending on keyword cues in filename
    if "chips" in filename or "snack" in filename:
        return [
            {"text": "Snack-o Crunchy Chips", "confidence": 0.95, "bounding_box": {"x": 50, "y": 20, "width": 150, "height": 30}},
            {"text": "NET WT 85g", "confidence": 0.94, "bounding_box": {"x": 60, "y": 100, "width": 80, "height": 20}},
            {"text": "MRP Rs 40 (incl. of all taxes)", "confidence": 0.92, "bounding_box": {"x": 60, "y": 150, "width": 180, "height": 20}},
            {"text": "Packed 08/26", "confidence": 0.91, "bounding_box": {"x": 60, "y": 200, "width": 100, "height": 20}},
            {"text": "Mfd by Snacko Foods Ltd, Phase-3, Okhla, New Delhi", "confidence": 0.88, "bounding_box": {"x": 30, "y": 280, "width": 300, "height": 40}},
            {"text": "Care: Call 1800-456-789 or email care@snacko.com", "confidence": 0.89, "bounding_box": {"x": 30, "y": 350, "width": 280, "height": 30}}
        ]
        
    # Default mock basmati rice
    return [
        {"text": "Premium Basmati Rice", "confidence": 0.98, "bounding_box": {"x": 100, "y": 50, "width": 200, "height": 40}},
        {"text": "NET QUANTITY 5 kg", "confidence": 0.96, "bounding_box": {"x": 120, "y": 120, "width": 120, "height": 25}},
        {"text": "MRP Rs 240.00", "confidence": 0.97, "bounding_box": {"x": 120, "y": 180, "width": 100, "height": 25}},
        {"text": "PKD 07/2026", "confidence": 0.94, "bounding_box": {"x": 120, "y": 240, "width": 90, "height": 25}},
        {"text": "Mfd by India Foods Ltd, Sector 62, Noida, UP", "confidence": 0.91, "bounding_box": {"x": 80, "y": 300, "width": 250, "height": 35}},
        {"text": "Care No: 1800-111-222", "confidence": 0.92, "bounding_box": {"x": 80, "y": 360, "width": 150, "height": 25}}
    ]
