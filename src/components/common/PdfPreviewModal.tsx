import React, { useEffect, useRef, useState } from 'react';
import { UploadedPdfFile, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { renderPdfPageToCanvas } from '../../services/pdfService';
import { X, ChevronLeft, ChevronRight, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toBanglaDigits } from '../../utils/dateUtils';

interface PdfPreviewModalProps {
  file: UploadedPdfFile | null;
  lang: Language;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ file, lang, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const t = translations[lang];

  useEffect(() => {
    if (!file) return;
    setCurrentPage(1);
    setRenderError(null);
  }, [file]);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    let isMounted = true;
    setLoading(true);
    setRenderError(null);

    const render = async () => {
      try {
        if (!canvasRef.current) return;
        await renderPdfPageToCanvas(file.arrayBuffer, currentPage, canvasRef.current, 1.25);
        if (isMounted) {
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to render PDF page:', err);
        if (isMounted) {
          setRenderError(file.errorMessage || t.uploadView.damagedWarning);
          setLoading(false);
        }
      }
    };

    render();

    return () => {
      isMounted = false;
    };
  }, [file, currentPage, t.uploadView.damagedWarning]);

  if (!file) return null;

  const totalPages = file.pageCount || 1;
  const displayCurrentPage = lang === 'bn' ? toBanglaDigits(currentPage) : currentPage;
  const displayTotalPages = lang === 'bn' ? toBanglaDigits(totalPages) : totalPages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 id="preview-modal-title" className="text-base font-bold text-slate-900 truncate">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500">
                {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} · SHA-256:{' '}
                <span className="font-mono">{file.hash ? file.hash.substring(0, 12) + '...' : 'N/A'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={t.actions.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto bg-slate-100/80 p-6 flex items-center justify-center min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs z-10">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-sm font-medium text-slate-600">{t.pdfPreviewModal.loadingPdf}</p>
            </div>
          )}

          {renderError ? (
            <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-xs border border-rose-200">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-rose-900 mb-1">{t.uploadView.damagedWarning}</p>
              <p className="text-xs text-slate-500 font-mono mt-2">{renderError}</p>
            </div>
          ) : (
            <div className="shadow-lg rounded border border-slate-300 bg-white overflow-hidden max-w-full">
              <canvas ref={canvasRef} className="block max-w-full h-auto mx-auto" />
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              {lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
            </button>
            <span className="text-xs font-medium text-slate-600 px-2">
              {t.pdfPreviewModal.page} {displayCurrentPage} {t.pdfPreviewModal.of} {displayTotalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {lang === 'bn' ? 'পরবর্তী' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-white hover:bg-slate-900 shadow-xs"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
};
