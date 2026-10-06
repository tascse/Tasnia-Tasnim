import * as pdfjsLib from 'pdfjs-dist';
import { computeSHA256 } from '../utils/fileUtils';
import { UploadedPdfFile } from '../types/document';

// Configure pdfjs worker
try {
  // Use worker url or fallback gracefully
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
} catch {
  // worker fallback handled
}

export interface ProcessedPdfResult {
  file: UploadedPdfFile;
  success: boolean;
  error?: string;
}

/**
 * Safely reads a PDF using pdfjs-dist, extracts page count and calculates SHA-256 hash.
 * Handles corrupted or password-protected PDFs gracefully without crashing.
 */
export async function readAndValidatePdf(file: File): Promise<ProcessedPdfResult> {
  const fileId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const hash = await computeSHA256(arrayBuffer);

    let pageCount = 0;
    try {
      // Use pdfjs-dist to safely inspect the document
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        // Disable worker if worker fails to initialize
        stopAtErrors: false,
      });

      const pdfDocument = await loadingTask.promise;
      pageCount = pdfDocument.numPages;
    } catch (pdfJsErr: unknown) {
      console.warn('pdfjs-dist inspection issue, attempting fallback inspection:', pdfJsErr);
      // Secondary fallback attempt: check with pdf-lib if worker had an environment issue
      try {
        const { PDFDocument } = await import('pdf-lib');
        const fallbackDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
        pageCount = fallbackDoc.getPageCount();
      } catch {
        // Both failed -> damaged or password protected
        return {
          file: {
            id: fileId,
            name: file.name,
            size: file.size,
            pageCount: 0,
            hash,
            file,
            arrayBuffer,
            isDuplicate: false,
            isDamagedOrProtected: true,
            errorMessage: 'Unable to read this PDF. The file may be damaged or password-protected.',
          },
          success: false,
          error: 'Unable to read this PDF. The file may be damaged or password-protected.',
        };
      }
    }

    if (pageCount <= 0) {
      return {
        file: {
          id: fileId,
          name: file.name,
          size: file.size,
          pageCount: 0,
          hash,
          file,
          arrayBuffer,
          isDuplicate: false,
          isDamagedOrProtected: true,
          errorMessage: 'Unable to read this PDF. The file may be damaged or password-protected.',
        },
        success: false,
        error: 'Unable to read this PDF. The file may be damaged or password-protected.',
      };
    }

    return {
      file: {
        id: fileId,
        name: file.name,
        size: file.size,
        pageCount,
        hash,
        file,
        arrayBuffer,
        isDuplicate: false,
      },
      success: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error reading file';
    return {
      file: {
        id: fileId,
        name: file.name,
        size: file.size,
        pageCount: 0,
        hash: '',
        file,
        arrayBuffer: new ArrayBuffer(0),
        isDuplicate: false,
        isDamagedOrProtected: true,
        errorMessage: message,
      },
      success: false,
      error: 'Unable to read this PDF. The file may be damaged or password-protected.',
    };
  }
}

/**
 * Renders the first page of a PDF file to a canvas element for thumbnail preview.
 */
export async function renderPdfPageToCanvas(
  arrayBuffer: ArrayBuffer,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;
}
