import React, { useState } from 'react';
import { TenderMetadata, Requirement } from '../../types/tender';
import { UploadedPdfFile, DocumentMatch, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import {
  generateTenderPackage,
  downloadBlobAsFile,
  GeneratedPackageResult,
} from '../../services/packageService';
import { formatHumanDate, formatCoverPackageDate, toBanglaDigits } from '../../utils/dateUtils';
import {
  PackageCheck,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building2,
  ListOrdered,
  Eye,
  Sparkles,
} from 'lucide-react';

interface PackageGenerationScreenProps {
  tender: TenderMetadata;
  requirements: Requirement[];
  matches: Map<string, DocumentMatch>;
  filesMap: Map<string, UploadedPdfFile>;
  language: Language;
}

export const PackageGenerationScreen: React.FC<PackageGenerationScreenProps> = ({
  tender,
  requirements,
  matches,
  filesMap,
  language,
}) => {
  const [includeIndexPage, setIncludeIndexPage] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedPackageResult | null>(null);
  const t = translations[language];

  // Compile list of included items strictly by requirement.order ascending
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  const includedItems = sortedReqs
    .map((req) => {
      const match = matches.get(req.id);
      const file = match?.fileId ? filesMap.get(match.fileId) : undefined;
      return { req, match, file };
    })
    .filter((item) => !!item.file && !item.file.isDamagedOrProtected);

  const estimatedDocPages = includedItems.reduce((acc, item) => acc + (item.file?.pageCount || 0), 0);
  const estimatedTotalPages = 1 + (includeIndexPage ? 1 : 0) + estimatedDocPages;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateTenderPackage(
        tender,
        requirements,
        matches,
        filesMap,
        { includeIndexPage }
      );
      setGeneratedResult(result);
    } catch (err: unknown) {
      console.error('Package generation failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    downloadBlobAsFile(generatedResult.blob, generatedResult.filename);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'চূড়ান্ত সংকলন পর্যায়' : 'Final Compilation Stage'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t.packageView.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.packageView.subtitle}</p>
        </div>
      </div>

      {/* Configuration & Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compilation Settings & Action (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Options Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              {language === 'bn' ? 'প্যাকেজের কাঠামো ও বিকল্পসমূহ' : 'Package Structure & Options'}
            </h3>

            {/* Index page toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={includeIndexPage}
                onChange={(e) => setIncludeIndexPage(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  {t.packageView.includeIndexPage}
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  {t.packageView.indexPageDescription}
                </span>
              </div>
            </label>

            {/* Structure info box */}
            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>{language === 'bn' ? 'পৃষ্ঠা ১:' : 'Page 1:'}</span>
                <strong className="text-slate-900">
                  {language === 'bn' ? 'অফিসিয়াল ইংরেজি কভার পেজ' : 'Official English Cover Page'}
                </strong>
              </div>
              {includeIndexPage && (
                <div className="flex items-center justify-between text-slate-700">
                  <span>{language === 'bn' ? 'পৃষ্ঠা ২:' : 'Page 2:'}</span>
                  <strong className="text-slate-900">
                    {language === 'bn' ? 'সূচিপত্র ও ডিরেক্টরি' : 'Table of Contents & Pagination'}
                  </strong>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-700">
                <span>{language === 'bn' ? 'পরবর্তী পৃষ্ঠাসমূহ:' : 'Subsequent Pages:'}</span>
                <strong className="text-slate-900">
                  {includedItems.length}{' '}
                  {language === 'bn' ? 'টি মূল নথি (অক্ষুণ্ণ পৃষ্ঠা)' : 'Verified Original Documents'}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-blue-900">
                <span>{t.packageView.totalFinalPages}:</span>
                <span>
                  {language === 'bn'
                    ? toBanglaDigits(estimatedTotalPages)
                    : estimatedTotalPages}{' '}
                  {language === 'bn' ? 'পৃষ্ঠা' : 'Pages'}
                </span>
              </div>
            </div>

            {/* Error banner if any */}
            {generationError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{generationError}</span>
              </div>
            )}

            {/* Generate / Download Controls */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              {!generatedResult ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.packageView.generatingNotice}</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>{t.actions.generatePackage}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full space-y-3">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        {t.packageView.readyToDownload}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {t.packageView.downloadHint} ({generatedResult.totalPages} pages)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {t.actions.downloadPackage} ({generatedResult.filename})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="px-3 py-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                      title="Recompile"
                    >
                      {t.actions.retry}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Included Documents Manifest (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t.packageView.includedDocsTitle}
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {includedItems.length}
              </span>
            </div>

            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {includedItems.map((item, idx) => (
                <div
                  key={item.req.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {item.req.order.toString().padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {item.req.title_en}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {item.file?.name}
                      </p>
                    </div>
                  </div>

                  <span className="text-slate-600 font-mono text-[11px] shrink-0">
                    {item.file?.pageCount} pgs
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              {language === 'bn'
                ? 'অনুপস্থিত বা মিল না থাকা কোনো ঐচ্ছিক নথি প্যাকেজে অন্তর্ভুক্ত হবে না।'
                : 'Unmatched optional documents are cleanly omitted from the submission package.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
