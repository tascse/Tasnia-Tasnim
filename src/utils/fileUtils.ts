export const MAX_PDF_COUNT = 30;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Computes exact SHA-256 binary hash hex string using Web Crypto API.
 */
export async function computeSHA256(arrayBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes title and filename for auto-matching suggestion:
 * - lowercase
 * - replaces underscores, hyphens, dots, and multiple spaces with a single space
 * - strips file extension (.pdf)
 */
export function normalizeStringForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[_\-–—./\\]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates similarity score between requirement title and filename.
 * Returns a score between 0 and 1, plus a boolean whether it's a solid match candidate.
 */
export function calculateMatchScore(reqTitleEn: string, filename: string): { score: number; isGoodCandidate: boolean } {
  const normTitle = normalizeStringForMatching(reqTitleEn);
  const normFile = normalizeStringForMatching(filename);

  if (!normTitle || !normFile) return { score: 0, isGoodCandidate: false };

  // Exact match after normalization
  if (normTitle === normFile) {
    return { score: 1.0, isGoodCandidate: true };
  }

  // Substring containment
  if (normFile.includes(normTitle) || normTitle.includes(normFile)) {
    return { score: 0.9, isGoodCandidate: true };
  }

  // Token overlap check
  const titleWords = normTitle.split(' ').filter((w) => w.length > 2);
  const fileWords = normFile.split(' ').filter((w) => w.length > 2);

  if (titleWords.length === 0 || fileWords.length === 0) {
    return { score: 0, isGoodCandidate: false };
  }

  let matchedWords = 0;
  for (const tw of titleWords) {
    if (fileWords.some((fw) => fw.includes(tw) || tw.includes(fw))) {
      matchedWords++;
    }
  }

  const score = matchedWords / Math.max(titleWords.length, 1);
  // Only suggest if at least 70% of requirement keywords match
  return {
    score,
    isGoodCandidate: score >= 0.7 && matchedWords >= 1,
  };
}
