// Transforms backend inspection objects into the shape expected by InspectionList component

export interface MappedInspection {
  id: string;
  title: string;
  meta: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW';
  timeInfo: string;
  iconType?: string;
}

const categoryIconMap: Record<string, string> = {
  'Beverages': 'Droplet',
  'Dairy': 'Milk',
  'Snacks': 'Cookie',
  'Cosmetics': 'SprayCan',
  'Confectionery': 'Candy',
  'Sweets': 'Candy',
};

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function normalizeStatus(status: string): 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW' {
  if (status === 'COMPLIANT') return 'COMPLIANT';
  if (status === 'NON_COMPLIANT') return 'NON_COMPLIANT';
  // REQUIRES_REVIEW, REVIEW, or anything else → REVIEW
  return 'REVIEW';
}

export function mapBackendInspection(raw: any): MappedInspection {
  const productName = raw.product?.name || raw.product_name || 'Unnamed Product';
  const category = raw.product?.category || raw.category || 'General';
  const location = raw.location || '';
  const meta = [category, location].filter(Boolean).join(' · ');

  return {
    id: String(raw.id),
    title: productName,
    meta,
    status: normalizeStatus(raw.status),
    timeInfo: formatTimeAgo(raw.timestamp),
    iconType: categoryIconMap[category] || undefined,
  };
}

export function computeRuleTally(complianceResults: any[]): { failed: number; total: number } {
  if (!complianceResults || complianceResults.length === 0) return { failed: 0, total: 0 };
  const total = complianceResults.length;
  const failed = complianceResults.filter((r: any) => r.status === 'FAIL').length;
  return { failed, total };
}
