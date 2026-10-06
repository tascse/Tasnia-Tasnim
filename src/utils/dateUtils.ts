/**
 * Safe calendar date comparison and formatting utilities.
 * Avoids any timezone/UTC offset shifts by working with ISO YYYY-MM-DD representations.
 */

export function parseYMD(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function normalizeDateString(dateStr: string): string {
  const parsed = parseYMD(dateStr);
  if (!parsed) return dateStr.trim();
  const y = parsed.year.toString().padStart(4, '0');
  const m = parsed.month.toString().padStart(2, '0');
  const d = parsed.day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns:
 *  -1 if dateA < dateB
 *   0 if dateA === dateB
 *   1 if dateA > dateB
 */
export function compareCalendarDates(dateA: string, dateB: string): number {
  const normA = normalizeDateString(dateA);
  const normB = normalizeDateString(dateB);
  if (normA < normB) return -1;
  if (normA > normB) return 1;
  return 0;
}

/**
 * Checks whether expiryDate >= deadlineDate.
 * Specifically handles the requirement: "If expiry date equals submission deadline, status is OK."
 */
export function isExpiryValid(expiryDate: string, deadlineDate: string): boolean {
  if (!expiryDate || !deadlineDate) return false;
  return compareCalendarDates(expiryDate, deadlineDate) >= 0;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BN_DIGITS: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

export function toBanglaDigits(num: number | string): string {
  return num.toString().replace(/[0-9]/g, (d) => BN_DIGITS[d] || d);
}

export function formatHumanDate(dateStr: string, lang: 'en' | 'bn' = 'en'): string {
  const parsed = parseYMD(dateStr);
  if (!parsed) return dateStr;

  if (lang === 'bn') {
    const d = toBanglaDigits(parsed.day);
    const m = MONTH_NAMES_BN[parsed.month - 1];
    const y = toBanglaDigits(parsed.year);
    return `${d} ${m}, ${y}`;
  }

  const d = parsed.day;
  const m = MONTH_NAMES_EN[parsed.month - 1];
  const y = parsed.year;
  return `${d} ${m} ${y}`;
}

export function formatCoverPackageDate(date: Date = new Date()): string {
  const d = date.getDate();
  const m = MONTH_NAMES_EN[date.getMonth()];
  const y = date.getFullYear();
  return `${m} ${d}, ${y}`;
}
