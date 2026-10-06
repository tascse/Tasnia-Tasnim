import React, { useRef, useState } from 'react';
import { UploadedPdfFile, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { isPdfFile, MAX_PDF_COUNT, MAX_TOTAL_BYTES, formatBytes } from '../../utils/fileUtils';
import { readAndValidatePdf } from '../../services/pdfService';
import { identifyDuplicates } from '../../services/duplicateService';
import { createSamplePdf } from '../../services/sampleData';
import {
  Upload,
  FileText,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Eye,
  CheckCircle,
  Copy,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toBanglaDigits } from '../../utils/dateUtils';

interface FileUploadZoneProps {
  files: UploadedPdfFile[];
  language: Language;
  onFilesUpdated: (files: UploadedPdfFile[]) => void;
  onPreviewFile: (file: UploadedPdfFile) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  language,
  onFilesUpdated,
  onPreviewFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[language];

  const currentTotalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const processIncomingFiles = async (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(incomingFiles);

    if (fileArray.length === 0) return;

    // 1. Check file extensions - reject non-PDFs
    for (const file of fileArray) {
      if (!isPdfFile(file)) {
        setErrorMessage(t.uploadView.fileRejectedNotPdf);
        return;
      }
    }

    // 2. Check 30 files limit
    if (files.length + fileArray.length > MAX_PDF_COUNT) {
      setErrorMessage(t.uploadView.fileRejectedTooMany);
      return;
    }

    // 3. Check 50 MB total limit
    const incomingBytes = fileArray.reduce((acc, f) => acc + f.size, 0);
    if (currentTotalBytes + incomingBytes > MAX_TOTAL_BYTES) {
      setErrorMessage(t.uploadView.fileRejectedTotalSize);
      return;
    }

    setIsProcessing(true);
    const newProcessedFiles: UploadedPdfFile[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProcessingStatus(
        language === 'bn'
          ? `${i + 1}/${fileArray.length} নথি প্রক্রিয়া করা হচ্ছে: ${file.name}`
          : `Processing ${i + 1} of ${fileArray.length}: ${file.name}...`
      );

      const result = await readAndValidatePdf(file);
      newProcessedFiles.push(result.file);
    }

    const combined = [...files, ...newProcessedFiles];
    const withDuplicatesIdentified = identifyDuplicates(combined);

    onFilesUpdated(withDuplicatesIdentified);
    setIsProcessing(false);
    setProcessingStatus('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (idToRemove: string) => {
    const remaining = files.filter((f) => f.id !== idToRemove);
    const updated = identifyDuplicates(remaining);
    onFilesUpdated(updated);
  };

  // Helper to generate sample test PDFs in 1-click for testing/evaluator convenience
  const generateSamplePdfs = async () => {
    setIsProcessing(true);
    setProcessingStatus(
      language === 'bn' ? 'নমুনা PDF ফাইল তৈরি করা হচ্ছে...' : 'Generating test PDF documents in browser...'
    );

    try {
      // Create 5 realistic test PDFs including an intentional duplicate copy for testing!
      const p1 = await createSamplePdf('Trade License 2026', 'trade_license.pdf', 3, 'TL-2026-99');
      const p2 = await createSamplePdf('TIN Certificate & Tax Return', 'tin_certificate.pdf', 2, 'TIN-4821');
      const p3 = await createSamplePdf('VAT Registration Certificate', 'vat_bin_cert.pdf', 1, 'BIN-882');
      const p4 = await createSamplePdf('Bank Solvency Certificate', 'bank_solvency.pdf', 2, 'SOLV-JAN26');
      // Create an identical binary duplicate with a different filename to test SHA-256 detection!
      const p4Duplicate = await createSamplePdf(
        'Bank Solvency Certificate',
        'bank_solvency_copy.pdf',
        2,
        'SOLV-JAN26'
      );
      const p5 = await createSamplePdf('Experience Credential', 'past_experience.pdf', 4, 'EXP-2025');

      await processIncomingFiles([p1, p2, p3, p4, p4Duplicate, p5]);
    } catch (err) {
      console.error('Error generating sample PDFs:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const fileCountStr = language === 'bn' ? toBanglaDigits(files.length) : files.length;
  const maxCountStr = language === 'bn' ? toBanglaDigits(MAX_PDF_COUNT) : MAX_PDF_COUNT;

  return (
    <div className="space-y-6">
      {/* Upload Header & Dropzone */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.uploadView.title}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.uploadView.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={generateSamplePdfs}
            disabled={isProcessing || files.length >= MAX_PDF_COUNT}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 self-start sm:self-auto shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.actions.generateSamplePdfs}</span>
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div className="mt-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            id="pdf-files-input"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            } ${isProcessing ? 'pointer-events-none opacity-70' : ''}`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3">
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            {isProcessing ? (
              <p className="text-sm font-semibold text-blue-900">{processingStatus}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900">
                  {t.uploadView.dragDropText}
                </p>
                <p className="text-xs text-slate-500 mt-1">{t.uploadView.limitsNotice}</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                >
                  {t.uploadView.browseFiles}
                </button>
              </>
            )}
          </div>

          {/* Validation error message */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload stats */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {t.uploadView.totalFiles}:{' '}
              <strong className="text-slate-700">
                {fileCountStr} / {maxCountStr}
              </strong>
            </span>
            <span>
              {t.uploadView.totalSize}:{' '}
              <strong className="text-slate-700">{formatBytes(currentTotalBytes)} / 50 MB</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{t.uploadView.uploadedDocsTitle}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {files.length}
            </span>
          </div>
          {files.length > 0 && (
            <span className="text-xs text-slate-500">
              SHA-256 Binary Integrity Verification Active
            </span>
          )}
        </div>

        {files.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">{t.uploadView.emptyUploadedDocs}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <div
                key={file.id}
                className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors ${
                  file.isDuplicate ? 'bg-amber-50/40' : file.isDamagedOrProtected ? 'bg-rose-50/40' : ''
                }`}
              >
                {/* File info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      file.isDamagedOrProtected
                        ? 'bg-rose-100 text-rose-700'
                        : file.isDuplicate
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </span>

                      {/* Duplicate badge */}
                      {file.isDuplicate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>⚠ {t.status.duplicate}</span>
                        </span>
                      )}

                      {/* Damaged badge */}
                      {file.isDamagedOrProtected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          <AlertCircle className="w-3 h-3 text-rose-700" />
                          <span>Damaged / Protected</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>
                        {language === 'bn' ? toBanglaDigits(file.pageCount) : file.pageCount}{' '}
                        {file.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                      <span>·</span>
                      <span>{formatBytes(file.size)}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px] text-slate-400" title={`SHA-256: ${file.hash}`}>
                        SHA-256: {file.hash ? file.hash.substring(0, 10) + '...' : 'N/A'}
                      </span>
                    </div>

                    {/* Duplicate explanation */}
                    {file.isDuplicate && file.duplicateOfFilename && (
                      <p className="text-xs text-amber-800 font-medium mt-1.5 flex items-center gap-1">
                        <span>⚠ {t.uploadView.duplicateWarning}:</span>
                        <strong className="underline">{file.duplicateOfFilename}</strong>
                      </p>
                    )}

                    {/* Damaged explanation */}
                    {file.isDamagedOrProtected && (
                      <p className="text-xs text-rose-700 font-medium mt-1.5">
                        {file.errorMessage || t.uploadView.damagedWarning}
                      </p>
                    )}
                  </div>
                </div>

                {/* File actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.actions.preview}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.actions.removeFile}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
