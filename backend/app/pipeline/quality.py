import cv2
import numpy as np
from app.config import settings

def analyze_image_quality(image_path: str) -> dict:
    """
    Analyzes image sharpness, brightness, and basic legibility properties.
    Returns a dictionary with quality indicators.
    """
    img = cv2.imread(image_path)
    if img is None:
        return {"status": "error", "message": "Could not read image file."}
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 1. Blur Detection (Laplacian Variance method)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = laplacian_var < settings.BLUR_THRESHOLD
    
    # 2. Exposure / Brightness Check
    mean_brightness = np.mean(gray)
    is_dark = mean_brightness < settings.BRIGHTNESS_MIN
    is_overexposed = mean_brightness > settings.BRIGHTNESS_MAX
    
    # Combine results
    is_acceptable = not is_blurry and not is_dark and not is_overexposed
    
    status_str = "ACCEPTED" if is_acceptable else "REVIEW"
    reasons = []
    if is_blurry:
        reasons.append("Image is blurry. Please hold camera steady.")
    if is_dark:
        reasons.append("Image is too dark. Enable flash or improve lighting.")
    if is_overexposed:
        reasons.append("Image has too much glare/overexposure. Reposition camera.")
        
    return {
        "status": status_str,
        "is_acceptable": is_acceptable,
        "blur_score": round(laplacian_var, 2),
        "brightness_score": round(mean_brightness, 2),
        "reasons": reasons
    }
