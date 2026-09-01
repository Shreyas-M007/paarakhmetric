import os
import sys
import json
from dotenv import load_dotenv

sys.path.insert(0, '.')
from app.pipeline.ocr_engine import perform_ocr
from app.extraction.parser import parse_ocr_results
from app.rules.engine import evaluate_compliance

def test_pipeline():
    load_dotenv()
    if not os.getenv("GEMINI_API_KEY"):
        print("WARN: GEMINI_API_KEY missing in .env. Will fall back to Regex.")

    dataset_path = r"C:\Users\sriha\Downloads\SIH database-20260830T095146Z-1-001\PaarakhMetric_Dataset\ALL"
    images_to_test = [
        "IMG-20260829-WA0032.jpg",
        "IMG-20260829-WA0088.jpg"
    ]
    
    for img_name in images_to_test:
        img_path = os.path.join(dataset_path, img_name)
        print(f"\n{'='*50}\nTesting Image: {img_name}\n{'='*50}")
        
        try:
            # 1. OCR
            print("1. Running OCR...")
            ocr_results = perform_ocr(img_path)
            
            # 2. LLM Extraction (PRD Logic Tree)
            print("2. Parsing with PRD Logic Tree...")
            parsed_data = parse_ocr_results(ocr_results)
            
            print("--- Extraction Results ---")
            for k, v in parsed_data.items():
                if k == "unsupported_language_detected":
                    if v: print("  UNSUPPORTED LANGUAGE DETECTED")
                    continue
                if v and isinstance(v, dict) and v.get("value"):
                    val = str(v['value']).encode('utf-8', 'replace').decode('utf-8')
                    print(f"  {k}: {val} (conf: {v.get('confidence', 0):.2f})")
            
            # 3. Compliance Engine
            print("\n3. Evaluating Compliance (PRD Flags)...")
            compliance = evaluate_compliance(parsed_data)
            print(f"OVERALL STATUS: {compliance['overall_status']}")
            for res in compliance['results']:
                if res['status'] != 'PASS' and res['status'] != 'NOT APPLICABLE':
                    print(f"  [{res['status']}] {res['name']}: {res['details']}")
                    
        except Exception as e:
            print(f"Error processing {img_name}: {e}")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    test_pipeline()
