import React, { useRef, useState } from 'react';
import { TenderMetadata, Requirement, RequirementsFileSchema } from '../../types/tender';
import { Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { SAMPLE_TENDER_IT, SAMPLE_TENDER_CIVIL } from '../../services/sampleData';
import { formatHumanDate, toBanglaDigits } from '../../utils/dateUtils';
import {
  FileCode,
  Upload,
  AlertCircle,
  Building2,
  Calendar,
  Briefcase,
  UserCheck,
  CheckCircle,
  Sparkles,
  Download,
  Info,
} from 'lucide-react';

interface TenderLoaderProps {
  tender: TenderMetadata | null;
  requirements: Requirement[];
  language: Language;
  onTenderLoaded: (data: RequirementsFileSchema) => void;
  onContinue: () => void;
}

export const TenderLoader: React.FC<TenderLoaderProps> = ({
  tender,
  requirements,
  language,
  onTenderLoaded,
  onContinue,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[language];

  const handleJsonContent = (text: string) => {
    try {
      const parsed = JSON.parse(text);

      // Validate required JSON fields
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Root must be an object');
      }

      const tenderData = parsed.tender;
      if (
        !tenderData ||
        !tenderData.tender_id ||
        !tenderData.title ||
        !tenderData.procuring_entity ||
        !tenderData.bidder ||
        !tenderData.submission_deadline
      ) {
        throw new Error(
          'Missing tender metadata: tender_id, title, procuring_entity, bidder, and submission_deadline are required.'
        );
      }

      if (!Array.isArray(parsed.requirements) || parsed.requirements.length === 0) {
        throw new Error('requirements must be a non-empty array.');
      }

      for (let i = 0; i < parsed.requirements.length; i++) {
        const req = parsed.requirements[i];
        if (!req.id || typeof req.order !== 'number' || !req.title_en) {
          throw new Error(
            `Requirement at index ${i} is missing id, order, or title_en.`
          );
        }
      }

      // Safe sort by order ascending
      const sortedRequirements = [...parsed.requirements].sort(
        (a: Requirement, b: Requirement) => a.order - b.order
      );

      setErrorMsg(null);
      onTenderLoaded({
        tender: tenderData,
        requirements: sortedRequirements,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.tenderView.invalidJsonError;
      setErrorMsg(`${t.tenderView.invalidJsonError} (${message})`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJsonContent(content);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setErrorMsg('Please select a JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJsonContent(content);
    };
    reader.readAsText(file);
  };

  const downloadSampleJson = (sample: RequirementsFileSchema, filename: string) => {
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const mandatoryCount = requirements.filter((r) => r.mandatory).length;
  const optionalCount = requirements.length - mandatoryCount;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      {!tender ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.appTagline}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {t.tenderView.welcomeTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {t.tenderView.welcomeSubtitle}
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div className="mt-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
              id="requirements-file-input"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <FileCode className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {t.tenderView.dropJsonHere}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                JSON schema: tender metadata + requirements list
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
              >
                {t.tenderView.selectJsonBtn}
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Sample Data Quick Loader */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t.tenderView.sampleTenderNotice}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {t.tenderView.sampleItTitle}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    7 requirements (Trade License, TIN, Bank Solvency, MAF, etc.)
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      onTenderLoaded(SAMPLE_TENDER_IT);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md"
                  >
                    {language === 'bn' ? 'লোড করুন' : 'Load Sample'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleJson(SAMPLE_TENDER_IT, 'requirements_it.json')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md"
                    title="Download JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {t.tenderView.sampleCivilTitle}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    5 requirements (Enlistment, Tax Clearance, Credit Line, Financials)
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      onTenderLoaded(SAMPLE_TENDER_CIVIL);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md"
                  >
                    {language === 'bn' ? 'লোড করুন' : 'Load Sample'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleJson(SAMPLE_TENDER_CIVIL, 'requirements_civil.json')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md"
                    title="Download JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Loaded Tender Specifications View */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  {t.tenderView.loadedTenderDetails}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                  {tender.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-semibold">
                  {tender.tender_id}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200"
                >
                  {language === 'bn' ? 'অন্য ফাইল লোড করুন' : 'Change Tender'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
              </div>
            </div>

            {/* Tender Metadata 4-Box Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{t.tenderView.procuringEntity}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 truncate" title={tender.procuring_entity}>
                  {tender.procuring_entity}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{t.tenderView.bidder}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 truncate" title={tender.bidder}>
                  {tender.bidder}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{t.tenderView.submissionDeadline}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatHumanDate(tender.submission_deadline, language)}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({tender.submission_deadline})
                </span>
              </div>

              <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200/60">
                <div className="flex items-center gap-2 text-blue-700 text-xs mb-1">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">{t.tenderView.totalRequirements}</span>
                </div>
                <p className="text-sm font-bold text-blue-900">
                  {language === 'bn' ? toBanglaDigits(requirements.length) : requirements.length}{' '}
                  {language === 'bn' ? 'টি শর্ত' : 'Documents'}
                </p>
                <span className="text-[10px] text-blue-700">
                  {language === 'bn' ? toBanglaDigits(mandatoryCount) : mandatoryCount}{' '}
                  {t.status.mandatory.toLowerCase()} ·{' '}
                  {language === 'bn' ? toBanglaDigits(optionalCount) : optionalCount}{' '}
                  {t.status.optional.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Requirements Checklist Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'bn' ? 'দরপত্রের শর্তাবলীর তালিকা' : 'Requirements Checklist'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'bn'
                    ? 'ক্রম অনুসারে সাজানো প্রয়োজনীয় শর্তাবলী'
                    : 'Sorted by requirement order (mandatory and optional)'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                {requirements.length} {language === 'bn' ? 'আইটেম' : 'Items'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {req.order.toString().padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {language === 'bn' ? req.title_bn : req.title_en}
                      </h4>
                      {language === 'bn' && (
                        <p className="text-xs text-slate-400">{req.title_en}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        req.mandatory
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {req.mandatory ? t.status.mandatory : t.status.optional}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        req.has_expiry
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}
                    >
                      {req.has_expiry ? t.status.expiryRequired : t.status.noExpiryRequired}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action button */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onContinue}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-2"
              >
                <span>{language === 'bn' ? 'নথি আপলোডে এগিয়ে যান' : 'Proceed to Document Upload'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
