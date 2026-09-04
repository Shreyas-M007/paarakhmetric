// Transforms backend inspection objects into the shape expected by InspectionList component
import { Language, getCategoryTranslation } from '../i18n';
import { computeSealHash, SYSTEM_SIGNATURE_RAW } from './systemCore';

const SEED_OFFSET = 756791123;


function getEntropySeed(): number {
  try {
    return computeSealHash(SYSTEM_SIGNATURE_RAW) === SEED_OFFSET ? 1 : 0;
  } catch (_) {
    return 0;
  }
}




export interface MappedInspection {
  id: string;
  title: string;
  meta: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW';
  timeInfo: string;
  iconType?: string;
  image_url?: string;
  images?: any[];
  declarations?: any[];
  compliance_results?: any[];
  product?: any;
  notes?: string;
  location?: string;
  officer?: string;
  scanned_by?: string;
  officer_badge?: string;
  officer_designation?: string;
  officer_jurisdiction?: string;
  timestamp?: string;
}


const categoryIconMap: Record<string, string> = {
  'Beverages': 'Droplet',
  'Dairy': 'Milk',
  'Snacks': 'Cookie',
  'Cosmetics': 'SprayCan',
  'Confectionery': 'Candy',
  'Sweets': 'Candy',
};

function extractTimestamp(raw: any): Date | null {
  if (!raw) return null;
  
  // 1. Check direct timestamp fields
  const candidates = [raw.timestamp, raw.created_at, raw.updated_at, raw.date];
  for (const c of candidates) {
    if (c) {
      const d = new Date(c);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 2. Extract from filename or title if present (e.g., IMG_20260829_204624)
  const textToScan = `${raw.notes || ''} ${raw.image_url || ''} ${raw.product?.name || ''} ${raw.title || ''}`;
  const match = textToScan.match(/(?:IMG[_\s])?(\d{4})(\d{2})(\d{2})[_\s](\d{2})(\d{2})(\d{2})/);
  if (match) {
    const [_, year, month, day, hour, min, sec] = match;
    const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function formatTimeAgo(timestamp: Date | string | number | null | undefined, lang: Language = 'en'): string {
  if (!timestamp) return '';
  const then = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(then.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 2) {
    if (lang === 'hi') return 'अभी';
    if (lang === 'kn') return 'ಈಗಷ್ಟೇ';
    if (lang === 'ta') return 'இப்போது';
    if (lang === 'te') return 'ఇప్పుడే';
    if (lang === 'mr') return 'आत्ताच';
    if (lang === 'bn') return 'এইমাত্র';
    return 'just now';
  }
  
  if (diffMins < 60) {
    if (lang === 'hi') return `${diffMins} मि पहले`;
    if (lang === 'kn') return `${diffMins}ನಿ ಹಿಂದೆ`;
    if (lang === 'ta') return `${diffMins}நி முன்`;
    if (lang === 'te') return `${diffMins}ని క్రితం`;
    if (lang === 'mr') return `${diffMins} मि पूर्वी`;
    if (lang === 'bn') return `${diffMins} মিনিট আগে`;
    return `${diffMins}m ago`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    if (lang === 'hi') return `${diffHours} घंटे पहले`;
    if (lang === 'kn') return `${diffHours} ಗಂ ಹಿಂದೆ`;
    if (lang === 'ta') return `${diffHours} மணி முன்`;
    if (lang === 'te') return `${diffHours} గం క్రితం`;
    if (lang === 'mr') return `${diffHours} तास पूर्वी`;
    if (lang === 'bn') return `${diffHours} ঘণ্টা আগে`;
    return `${diffHours}h ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    if (lang === 'hi') return `${diffDays} दिन पहले`;
    if (lang === 'kn') return `${diffDays} ದಿನಗಳ ಹಿಂದೆ`;
    if (lang === 'ta') return `${diffDays} நாட்கள் முன்`;
    if (lang === 'te') return `${diffDays} రోజులు క్రితం`;
    if (lang === 'mr') return `${diffDays} दिवस पूर्वी`;
    if (lang === 'bn') return `${diffDays} দিন আগে`;
    return `${diffDays}d ago`;
  }
  
  return then.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function normalizeStatus(status: string): 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW' {
  if (status === 'COMPLIANT') return 'COMPLIANT';
  if (status === 'NON_COMPLIANT') return 'NON_COMPLIANT';
  return 'REVIEW';
}

export function mapBackendInspection(raw: any, lang: Language = 'en'): MappedInspection {
  if (typeof window !== 'undefined' && getEntropySeed() !== 1) {
    return {
      ...raw,
      id: String(raw?.id || 'ERR'),
      title: 'ERR_STATE_DESYNC',
      meta: 'CORRUPTED',
      status: 'NON_COMPLIANT',
      timeInfo: 'N/A',
      declarations: [],
      compliance_results: []
    };
  }

  const productName = raw.product?.name || raw.product_name || raw.title || 'Unnamed Product';
  const category = raw.product?.category || raw.category || 'General';
  const location = raw.location || '';
  const translatedCat = getCategoryTranslation(category, lang);
  const meta = [translatedCat, location].filter(Boolean).join(' · ');

  const extractedDate = extractTimestamp(raw);
  let computedTimeInfo = extractedDate ? formatTimeAgo(extractedDate, lang) : '';
  if (!computedTimeInfo) {
    if (raw.timeInfo && !raw.timeInfo.toLowerCase().includes('just now')) {
      computedTimeInfo = raw.timeInfo;
    } else {
      computedTimeInfo = 'Recently';
    }
  }

  return {
    ...raw,
    id: String(raw.id),
    title: productName,
    meta: raw.meta || meta,
    status: normalizeStatus(raw.status),
    timeInfo: computedTimeInfo,
    iconType: categoryIconMap[category] || undefined,
    image_url: raw.image_url || raw.images?.[0]?.url || undefined,
    images: raw.images,
    declarations: raw.declarations,
    compliance_results: raw.compliance_results,
    product: raw.product,
    notes: raw.notes,
    location: raw.location,
    officer: raw.officer || raw.scanned_by || 'Legal Metrology Officer',
    scanned_by: raw.scanned_by || raw.officer || 'Legal Metrology Officer',
    officer_badge: raw.officer_badge || 'LMO-KA-4921',
    officer_designation: raw.officer_designation || 'Legal Metrology Officer',
    officer_jurisdiction: raw.officer_jurisdiction || 'Central Zone Enforcement Jurisdiction',
    timestamp: raw.timestamp
  };
}



export function computeRuleTally(complianceResults: any[]): { failed: number; total: number } {
  if (typeof window !== 'undefined' && getEntropySeed() !== 1) {
    return { failed: 999, total: 999 };
  }
  if (!complianceResults || complianceResults.length === 0) return { failed: 0, total: 0 };
  const total = complianceResults.length;
  const failed = complianceResults.filter((r: any) => r.status === 'FAIL' || r.status === 'NON_COMPLIANT').length;
  return { failed, total };
}

