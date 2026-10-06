export interface UploadedPdfFile {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  hash: string; // SHA-256 binary hash hex
  file: File;
  arrayBuffer: ArrayBuffer;
  isDuplicate: boolean;
  duplicateOfFilename?: string;
  duplicateGroupId?: string;
  isDamagedOrProtected?: boolean;
  errorMessage?: string;
}

export interface DocumentMatch {
  requirementId: string;
  fileId: string;
  expiryDate?: string; // YYYY-MM-DD
}

export type AppStep = 'tender' | 'upload' | 'match' | 'review' | 'package';

export type Language = 'en' | 'bn';
