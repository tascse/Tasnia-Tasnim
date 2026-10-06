import { TenderMetadata, Requirement } from '../types/tender';
import { UploadedPdfFile, DocumentMatch, AppStep, Language } from '../types/document';

const DB_NAME = 'TenderPackageBuilderDB';
const DB_VERSION = 1;
const STORE_FILES = 'uploadedFiles';

export interface SavedSessionMetadata {
  currentStep: AppStep;
  language: Language;
  tender: TenderMetadata | null;
  requirements: Requirement[];
  matches: [string, DocumentMatch][];
  filesMeta: {
    id: string;
    name: string;
    size: number;
    pageCount: number;
    hash: string;
    isDuplicate: boolean;
    duplicateOfFilename?: string;
    duplicateGroupId?: string;
  }[];
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSessionToStorage(
  currentStep: AppStep,
  language: Language,
  tender: TenderMetadata | null,
  requirements: Requirement[],
  matches: Map<string, DocumentMatch>,
  uploadedFiles: UploadedPdfFile[]
): Promise<void> {
  try {
    // 1. Save metadata in localStorage
    const sessionMeta: SavedSessionMetadata = {
      currentStep,
      language,
      tender,
      requirements,
      matches: Array.from(matches.entries()),
      filesMeta: uploadedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        pageCount: f.pageCount,
        hash: f.hash,
        isDuplicate: f.isDuplicate,
        duplicateOfFilename: f.duplicateOfFilename,
        duplicateGroupId: f.duplicateGroupId,
      })),
      timestamp: Date.now(),
    };

    localStorage.setItem('tp_builder_session', JSON.stringify(sessionMeta));

    // 2. Save file ArrayBuffers in IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);

    // Clear old files
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = resolve;
      clearReq.onerror = reject;
    });

    // Store each file buffer
    for (const file of uploadedFiles) {
      store.put({
        id: file.id,
        name: file.name,
        arrayBuffer: file.arrayBuffer,
      });
    }
  } catch (err) {
    console.warn('Could not auto-save session:', err);
  }
}

export async function loadSessionFromStorage(): Promise<{
  currentStep: AppStep;
  language: Language;
  tender: TenderMetadata | null;
  requirements: Requirement[];
  matches: Map<string, DocumentMatch>;
  uploadedFiles: UploadedPdfFile[];
} | null> {
  try {
    const raw = localStorage.getItem('tp_builder_session');
    if (!raw) return null;
    const meta: SavedSessionMetadata = JSON.parse(raw);
    if (!meta.tender) return null;

    // Load file buffers from IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);

    const fileBuffers = new Map<string, ArrayBuffer>();
    const allRecords: any[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of allRecords) {
      if (rec.id && rec.arrayBuffer) {
        fileBuffers.set(rec.id, rec.arrayBuffer);
      }
    }

    const reconstructedFiles: UploadedPdfFile[] = [];
    for (const fMeta of meta.filesMeta) {
      const buffer = fileBuffers.get(fMeta.id);
      if (buffer) {
        const fileObj = new File([buffer], fMeta.name, { type: 'application/pdf' });
        reconstructedFiles.push({
          id: fMeta.id,
          name: fMeta.name,
          size: fMeta.size,
          pageCount: fMeta.pageCount,
          hash: fMeta.hash,
          file: fileObj,
          arrayBuffer: buffer,
          isDuplicate: fMeta.isDuplicate,
          duplicateOfFilename: fMeta.duplicateOfFilename,
          duplicateGroupId: fMeta.duplicateGroupId,
        });
      }
    }

    return {
      currentStep: meta.currentStep,
      language: meta.language,
      tender: meta.tender,
      requirements: meta.requirements,
      matches: new Map(meta.matches),
      uploadedFiles: reconstructedFiles,
    };
  } catch (err) {
    console.warn('Could not load session from storage:', err);
    return null;
  }
}

export async function clearSavedSession(): Promise<void> {
  try {
    localStorage.removeItem('tp_builder_session');
    const db = await openDB();
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);
    store.clear();
  } catch (err) {
    console.warn('Error clearing session:', err);
  }
}
