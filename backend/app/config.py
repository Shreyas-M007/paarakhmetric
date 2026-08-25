import os

class Settings:
    APP_NAME: str = "PaarakhMetric Backend"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paarakhmetric.db")
    OCR_LANGUAGE: str = os.getenv("OCR_LANGUAGE", "en")
    
    # Image Quality Thresholds
    BLUR_THRESHOLD: float = 100.0  # Laplacian variance threshold
    BRIGHTNESS_MIN: float = 40.0   # Min average brightness (0-255)
    BRIGHTNESS_MAX: float = 220.0  # Max average brightness (0-255)

settings = Settings()
