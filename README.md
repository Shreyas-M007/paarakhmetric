# PaarakhMetric — AI-Assisted Legal Metrology Compliance Inspection System

PaarakhMetric (SIH26034) is an offline-capable, CPU-first, human-in-the-loop packaged commodities compliance inspection tool. It uses Computer Vision and OCR to check product labels against rules defined in the Legal Metrology (Packaged Commodities) Rules, 2011.

---

## Key Features

1. **OCR & Preprocessing Pipeline**: Automatically processes captured package images using OpenCV (for perspective deskewing and contrast enhancement) and PaddleOCR (for multilingual text recognition).
2. **Deterministic Legal Rule Engine**: Evaluates extracted fields against rule baselines (Rule 6 declarations: MRP, Net Quantity, Mfg/Packing Date, Consumer Care, Manufacturer Details) and tags compliance status as `PASS`, `FAIL` (Potential Violation), or `REVIEW`.
3. **Graceful Quality Checks**: Runs real-time image analysis for sharpness/exposure warnings before performing text recognition to avoid false positives.
4. **Independent Offline Mode**: Works completely offline. The React frontend can run locally or compile to an independent mobile client (using Capacitor and native on-device ML Kit OCR).

---

## Directory Structure

```
paarakhmetric/
├── backend/
│   ├── app/
│   │   ├── pipeline/            # CV & OCR Processing (Quality, Preprocess, OCR)
│   │   ├── extraction/          # Parser engine (Regex, Fuzzy string matching)
│   │   ├── rules/               # Legal Rules engine (declarative PCR rule matrix)
│   │   ├── database.py          # SQLAlchemy models and SQLite initialization
│   │   ├── schemas.py           # Serialization validation models
│   │   └── main.py              # REST API endpoints & route logic
│   ├── requirements.txt         # Python package requirements
│   ├── run.py                   # Dev server runner script
│   └── test_backend.py          # Unit test suites
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main dashboard interface
│   │   ├── index.css            # Tailwind directives
│   │   └── main.tsx             # React entrypoint
│   ├── index.html
│   ├── vite.config.ts           # Development proxy & server configs
│   └── package.json             # NPM dependencies & scripts
└── README.md
```

---

## Getting Started

### 1. Run Backend Server (FastAPI)
Navigate to the `backend/` directory:
```bash
cd backend
# Create virtual environment (if not already done)
python -m venv .venv
# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the uvicorn development server
python run.py
```
The backend API documentation will be available at `http://localhost:8000/docs`.

### 2. Run Frontend Client (React + Vite)
Navigate to the `frontend/` directory (requires Node.js & NPM installed):
```bash
cd frontend
# Install dependencies
npm install

# Start Vite hot-reload server
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 3. Run Backend Test Suite
Ensure the virtual environment is active, then run:
```bash
pytest test_backend.py
```
