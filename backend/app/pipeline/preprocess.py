import cv2
import numpy as np

def rotate_image(image: np.ndarray, angle: float) -> np.ndarray:
    """Rotates an image by a given angle in degrees."""
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated

def correct_skew(image_path: str) -> np.ndarray:
    """
    Attempts to estimate skew angle and correct it.
    Useful for scanning angled labels.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not load image for skew correction.")
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Negate image (text is white, background is black)
    gray = cv2.bitwise_not(gray)
    
    # Threshold to binary
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    # Grab the (x, y) coordinates of all pixel values > 0
    coords = np.column_stack(np.where(thresh > 0))
    
    # Compute the minimum bounding box
    angle = cv2.minAreaRect(coords)[-1]
    
    # minAreaRect returns angle in [-90, 0)
    # Correct the angle according to opencv version rules
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Rotate if angle is significant
    if abs(angle) > 0.5:
        return rotate_image(img, angle)
    return img

def apply_contrast_enhancement(img: np.ndarray) -> np.ndarray:
    """Applies histogram equalization to improve contrast on faint text labels."""
    # Convert to YUV to equalize only luminosity channel
    yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
    yuv[:,:,0] = cv2.equalizeHist(yuv[:,:,0])
    return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
