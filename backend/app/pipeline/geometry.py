import cv2
import numpy as np
import math
from typing import Tuple, Dict, Any, Optional

def suppress_glare(image: np.ndarray) -> np.ndarray:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) on the L-channel
    in LAB color space to reduce specular glare highlights from glossy packaging/foils.
    """
    if image is None:
        return image
    
    try:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        return enhanced
    except Exception:
        return image

def correct_perspective_quad(image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Detects the packaging container or label boundary using contour convex hulls
    and applies homography transformation to correct skewed perspectives.
    """
    if image is None:
        return image, {"applied": False, "angle": 0.0}

    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image, {"applied": False, "angle": 0.0}

    # Find the largest prominent quadrilateral contour
    sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)
    target_contour = None

    for c in sorted_contours[:5]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(c) > (h * w * 0.15):
            target_contour = approx
            break

    if target_contour is None:
        return image, {"applied": False, "angle": 0.0}

    # Order the 4 corners: top-left, top-right, bottom-right, bottom-left
    pts = target_contour.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")

    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Top-left
    rect[2] = pts[np.argmax(s)]  # Bottom-right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Top-right
    rect[3] = pts[np.argmax(diff)]  # Bottom-left

    (tl, tr, br, bl) = rect
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    if max_width <= 0 or max_height <= 0:
        return image, {"applied": False, "angle": 0.0}

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height))

    return warped, {"applied": True, "width": max_width, "height": max_height}

def unwarp_cylindrical_label(image: np.ndarray) -> np.ndarray:
    """
    Applies automated inverse cylindrical projection to unroll curved labels
    (bottles, cans, cylindrical jars) into a flat planar perspective.
    """
    if image is None:
        return image

    h, w = image.shape[:2]
    # Estimate cylinder radius based on horizontal width
    radius = w * 1.25
    center_x = w / 2.0

    map_x = np.zeros((h, w), dtype=np.float32)
    map_y = np.zeros((h, w), dtype=np.float32)

    for y in range(h):
        for x in range(w):
            dx = x - center_x
            theta = dx / radius
            if -math.pi / 2 < theta < math.pi / 2:
                src_x = center_x + radius * math.sin(theta)
                src_y = y
                map_x[y, x] = src_x
                map_y[y, x] = src_y
            else:
                map_x[y, x] = -1
                map_y[y, x] = -1

    unwarped = cv2.remap(image, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return unwarped

def calculate_pdp_scale(image: np.ndarray, estimated_pdp_height_cm: float = 15.0) -> Dict[str, float]:
    """
    Calculates pixel-to-millimeter scale ratio and PDP surface area in cm².
    """
    h, w = image.shape[:2]
    pdp_area_px = float(h * w)
    
    # Scale factor: pixels per mm
    # Assumes standard consumer package framing
    scale_px_per_mm = (h / (estimated_pdp_height_cm * 10.0))
    if scale_px_per_mm <= 0:
        scale_px_per_mm = 1.0

    # PDP area in cm²
    pdp_width_cm = (w / scale_px_per_mm) / 10.0
    pdp_height_cm = (h / scale_px_per_mm) / 10.0
    pdp_area_cm2 = pdp_width_cm * pdp_height_cm

    return {
        "scale_px_per_mm": float(scale_px_per_mm),
        "pdp_area_cm2": float(pdp_area_cm2),
        "pdp_width_cm": float(pdp_width_cm),
        "pdp_height_cm": float(pdp_height_cm)
    }
