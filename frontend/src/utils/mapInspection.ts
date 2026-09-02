// Transforms backend inspection objects into the shape expected by InspectionList component
import { Language, getCategoryTranslation } from '../i18n';

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

function formatTimeAgo(timestamp: string, lang: Language = 'en'): string {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
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
  const productName = raw.product?.name || raw.product_name || raw.title || 'Unnamed Product';
  const category = raw.product?.category || raw.category || 'General';
  const location = raw.location || '';
  const translatedCat = getCategoryTranslation(category, lang);
  const meta = [translatedCat, location].filter(Boolean).join(' · ');

  return {
    ...raw,
    id: String(raw.id),
    title: productName,
    meta: raw.meta || meta,
    status: normalizeStatus(raw.status),
    timeInfo: raw.timeInfo || formatTimeAgo(raw.timestamp, lang),
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
  if (!complianceResults || complianceResults.length === 0) return { failed: 0, total: 0 };
  const total = complianceResults.length;
  const failed = complianceResults.filter((r: any) => r.status === 'FAIL' || r.status === 'NON_COMPLIANT').length;
  return { failed, total };
}
