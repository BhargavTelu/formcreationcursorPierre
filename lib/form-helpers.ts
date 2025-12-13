/**
 * Shared utility functions for form components
 * Used by both main page and agency forms
 */

type NightRange = '1-week' | '10-nights' | '14-nights' | '21-nights';

/**
 * Generate the next 14 months starting from next month
 */
export function generateNext14Months() {
  const current = new Date();
  current.setMonth(current.getMonth() + 1);
  current.setDate(1);
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const monthName = current.toLocaleDateString('en-US', { month: 'short' });
    const yearShort = current.getFullYear().toString().slice(-2);
    const value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    out.push({ value, label: `${monthName} ${yearShort}` });
    current.setMonth(current.getMonth() + 1);
  }
  return out;
}

/**
 * Get display label for a month value
 */
export function labelForMonth(value: string) {
  const [y, m] = value.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
  return `${monthName} ${String(y).slice(-2)}`;
}

/**
 * Get display label for a night range value
 */
export function rangeLabel(v: NightRange) {
  switch (v) {
    case '1-week':
      return '1 Week';
    case '10-nights':
      return '10 Nights';
    case '14-nights':
      return '14 Nights';
    case '21-nights':
      return '21 Nights';
  }
}

/**
 * Get display title for a travel level value
 */
export function travelLevelTitle(v: 'smart' | 'comfortable' | 'luxury') {
  if (v === 'smart') return 'Smart';
  if (v === 'comfortable') return 'Comfortable';
  return 'Luxury';
}





