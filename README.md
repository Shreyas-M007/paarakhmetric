# PaarakhMetric — AI-Assisted Legal Metrology Compliance Inspection System

**Live Web App:** [https://shreyas-m007.github.io/paarakhmetric/](https://shreyas-m007.github.io/paarakhmetric/)  
**Project ID:** SIH26034  
**Target Domain:** Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009

---

PaarakhMetric is an inspection tool built for Legal Metrology Officers and field inspectors across India. It helps verify packaged commodity labels against mandatory statutory declarations in real time using Computer Vision and multimodal OCR. 

Inspectors can capture product panels using a smartphone camera in the field, run automated rule checks, review highlighted compliance flags, and generate statutory enforcement documents (such as Digital Seizure Memos and Show-Cause Notices) on the spot.

---

## Key Features

1. **Multimodal Packaging OCR & Vision Engine**:
   Processes multi-panel package images (Front, Back, Sides, Top, Bottom) using Gemini Vision models and client-side preprocessing. Extracts mandatory fields:
   - Manufacturer / Packer / Importer name & full address (Rule 6(1)(a))
   - Generic commodity name (Rule 6(1)(b))
   - Net quantity in standard SI units of weight/measure (Rule 6(1)(c) & Rule 11)
   - Month & Year of manufacture / pre-packing / import (Rule 6(1)(d))
   - Maximum Retail Price (MRP) inclusive of all taxes (Rule 6(1)(e))
   - Consumer care contact details (phone, email, postal address) (Rule 6(1)(n))
   - Country of origin for imported goods (Rule 6(10))

2. **Deterministic Legal Metrology Rule Engine**:
   Evaluates extracted declarations against statutory baselines:
   - Compares Principal Display Panel (PDP) area with declared net quantity font sizes (Rule 7, Schedule II).
   - Flags missing, non-compliant, or ambiguous declarations as `PASS`, `FAIL` (Violation), or `REVIEW`.
   - Allows officers to inspect side-by-side packaging crops and manually confirm or override field readings.

3. **Instant Cross-Device Sync (Firebase Firestore)**:
   Powered by Google Firebase Firestore. Scans performed on a field officer's mobile phone appear live on headquarters and desktop dashboards in under a second (<250ms) using real-time websocket listeners (`onSnapshot`).

4. **100% Free & Zero-Billing Architecture**:
   Packaging photos are automatically downscaled and stored inline directly inside Firestore documents. The entire platform runs permanently on the free Firebase Spark tier with zero billing or credit cards required.

5. **Automated Legal Enforcement Artifacts**:
   - **Digital Seizure Memo (PDF)**: Generates one-click inspection and seizure reports adhering to Section 15 of the Legal Metrology Act, 2009.
   - **Section 36 Show-Cause Notice Drafter**: Formulates formal notices specifying observed violations and statutory compounding fee calculations (Section 48).

6. **12 Indic Languages & Multilingual OCR**:
   Supports packaging text across English and 11 Indian scripts (Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, Malayalam, Punjabi, Odia, Assamese).

7. **Offline-Resilient Client Persistence**:
   Includes an IndexedDB caching layer. Field officers in low-connectivity retail basements or rural mandis can continue scanning offline; data automatically reconciles once a connection is detected.

---

## Directory Structure

```
paarakhmetric/
├── backend/
│   ├── app/
│   │   ├── pipeline/            # Image quality checks and preprocessing
│   │   ├── extraction/          # Parser engine (regex and fuzzy text extraction)
│   │   ├── rules/               # LMPC rule engine & statutory threshold tables
│   │   ├── schemas.py           # Pydantic data validation models
│   │   └── main.py              # FastAPI server & Gemini proxy endpoints
│   ├── requirements.txt         # Python dependencies
│   ├── run.py                   # Server runner script
│   └── test_backend.py          # Backend test suite
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Core app shell, routing & Firestore sync
│   │   ├── i18n/                # Multilingual translations (Indic scripts)
│   │   ├── utils/
│   │   │   ├── firebase.ts      # Firestore client initialization & real-time listeners
│   │   │   ├── storage.ts       # Local IndexedDB persistence
│   │   │   ├── pdfGenerator.ts  # Seizure Memo & Show-Cause notice generator
│   │   │   └── mapInspection.ts # Inspection data normalizer
│   │   ├── screens/
│   │   │   ├── DashboardScreen.tsx # High-level compliance overview & metrics
│   │   │   ├── ScanScreen.tsx      # Multi-panel camera capture & live inspection
│   │   │   ├── InspectionLedger.tsx# Full audit trail, filters & search
│   │   │   ├── ReportsScreen.tsx   # Enforcement breakdowns & analytics
│   │   │   └── ProfileScreen.tsx   # Officer credentials & regional settings
│   │   └── components/          # Reusable UI components & modals
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

---

## Getting Started

### 1. Run Frontend Client (React + Vite)
The frontend is the primary client interface:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` (or the port shown in terminal).

To create an optimized production build:
```bash
npm run build
```

### 2. Run Backend Proxy Server (FastAPI)
The backend acts as a proxy for the Gemini Vision API and image quality utilities:
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
python run.py
```
API docs will be available at `http://localhost:8000/docs`.

### 3. Run Backend Test Suite
With the virtual environment active:
```bash
pytest test_backend.py
```

---

## Deployment

- **Frontend**: Hosted on GitHub Pages via automatic GitHub Actions workflow (`.github/workflows/deploy.yml`).
- **Backend**: Hosted on Render as a stateless API service (`https://paarakhmetric-api.onrender.com`).
- **Database**: Google Cloud Firestore (`paarakhmetric` project) with zero configuration needed by end users.

---

## License & Compliance

Built for statutory legal metrology compliance enforcement under the Legal Metrology (Packaged Commodities) Rules, 2011 and the Legal Metrology Act, 2009.
