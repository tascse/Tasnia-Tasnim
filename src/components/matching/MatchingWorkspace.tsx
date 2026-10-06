import React, { useState } from 'react';
import { Requirement, TenderMetadata, RequirementValidation } from '../../types/tender';
import { UploadedPdfFile, DocumentMatch, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { StatusBadge } from '../common/StatusBadge';
import { FileSelectorModal } from './FileSelectorModal';
import { calculateMatchScore, formatBytes } from '../../utils/fileUtils';
import { isFileEligibleForRequirement } from '../../services/duplicateService';
import { formatHumanDate, toBanglaDigits } from '../../utils/dateUtils';
import {
  FileText,
  Link2,
  Calendar,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  FileCheck,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface MatchingWorkspaceProps {
  tender: TenderMetadata;
  requirements: Requirement[];
  uploadedFiles: UploadedPdfFile[];
  matches: Map<string, DocumentMatch>;
  validations: Map<string, RequirementValidation>;
  language: Language;
  onUpdateMatch: (reqId: string, fileId: string | null, expiryDate?: string) => void;
  onAutoMatchAll: () => void;
  onPreviewFile: (file: UploadedPdfFile) => void;
}

export const MatchingWorkspace: React.FC<MatchingWorkspaceProps> = ({
  tender,
  requirements,
  uploadedFiles,
  matches,
  validations,
  language,
  onUpdateMatch,
  onAutoMatchAll,
  onPreviewFile,
}) => {
  const [activeReqForSelector, setActiveReqForSelector] = useState<Requirement | null>(null);
  const t = translations[language];

  // Map of files by ID for quick lookup
  const filesMap = new Map<string, UploadedPdfFile>(uploadedFiles.map((f) => [f.id, f]));

  // Count available (unmatched) files
  const matchedFileIds = new Set<string>();
  matches.forEach((m) => {
    if (m.fileId) matchedFileIds.add(m.fileId);
  });

  const availableFiles = uploadedFiles.filter(
    (f) => !matchedFileIds.has(f.id) && !f.isDamagedOrProtected
  );

  // Find auto-match suggestions for unmatched requirements
  const suggestionsMap = new Map<string, UploadedPdfFile>();
  const availableCandidatePool = [...availableFiles];

  for (const req of requirements) {
    if (matches.has(req.id) && matches.get(req.id)?.fileId) continue;

    let bestCandidate: UploadedPdfFile | null = null;
    let highestScore = 0;

    for (const file of availableCandidatePool) {
      const eligibility = isFileEligibleForRequirement(file.id, req.id, matches, filesMap);
      if (!eligibility.eligible) continue;

      const { score, isGoodCandidate } = calculateMatchScore(req.title_en, file.name);
      if (isGoodCandidate && score > highestScore) {
        highestScore = score;
        bestCandidate = file;
      }
    }

    if (bestCandidate) {
      suggestionsMap.set(req.id, bestCandidate);
    }
  }

  const hasSuggestions = suggestionsMap.size > 0;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.matchView.title}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.matchView.subtitle}</p>
          </div>

          {hasSuggestions && (
            <button
              type="button"
              onClick={onAutoMatchAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.actions.autoMatchAll}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-800 text-[10px]">
                {suggestionsMap.size}
              </span>
            </button>
          )}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">{t.tenderView.totalRequirements}</span>
            <strong className="text-base text-slate-900 font-bold">
              {language === 'bn' ? toBanglaDigits(requirements.length) : requirements.length}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
            <span className="text-emerald-700 block">{t.matchView.matchedCount}</span>
            <strong className="text-base text-emerald-900 font-bold">
              {language === 'bn' ? toBanglaDigits(matchedFileIds.size) : matchedFileIds.size}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60">
            <span className="text-amber-700 block">{t.matchView.unmatchedCount}</span>
            <strong className="text-base text-amber-900 font-bold">
              {language === 'bn'
                ? toBanglaDigits(requirements.length - matchedFileIds.size)
                : requirements.length - matchedFileIds.size}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/60">
            <span className="text-blue-700 block">{t.matchView.availableCount}</span>
            <strong className="text-base text-blue-900 font-bold">
              {language === 'bn' ? toBanglaDigits(availableFiles.length) : availableFiles.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Matching Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Requirements Matching Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.matchView.requiredDocsColumn}
            </h3>
            <span className="text-xs text-slate-400">
              {language === 'bn' ? '১ শর্ত = সর্বোচ্চ ১ নথি' : '1 Requirement ↔ 1 File'}
            </span>
          </div>

          <div className="space-y-3">
            {requirements.map((req) => {
              const currentMatch = matches.get(req.id);
              const matchedFile = currentMatch?.fileId ? filesMap.get(currentMatch.fileId) : undefined;
              const validation = validations.get(req.id);
              const suggestion = suggestionsMap.get(req.id);
              const status = validation?.status || (req.mandatory ? 'MISSING' : 'NOT_PROVIDED');

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl border p-4 sm:p-5 shadow-2xs transition-all ${
                    status === 'OK'
                      ? 'border-slate-200 hover:border-slate-300'
                      : status === 'NOT_PROVIDED'
                      ? 'border-slate-200 bg-slate-50/40'
                      : 'border-amber-300/80 bg-amber-50/15'
                  }`}
                >
                  {/* Top Line: Order, Title, Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {req.order.toString().padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">
                            {language === 'bn' ? req.title_bn : req.title_en}
                          </h4>
                          {language === 'bn' && (
                            <span className="text-xs text-slate-400 font-normal">
                              ({req.title_en})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              req.mandatory
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {req.mandatory ? t.status.mandatory : t.status.optional}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              req.has_expiry
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}
                          >
                            {req.has_expiry ? t.status.expiryRequired : t.status.noExpiryRequired}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="self-start sm:self-center shrink-0">
                      <StatusBadge status={status} lang={language} />
                    </div>
                  </div>

                  {/* Matched File Display or File Assignment Area */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {matchedFile ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-blue-100 text-blue-700 shrink-0">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {matchedFile.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {language === 'bn'
                                ? toBanglaDigits(matchedFile.pageCount)
                                : matchedFile.pageCount}{' '}
                              {matchedFile.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                              {formatBytes(matchedFile.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => onPreviewFile(matchedFile)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            {t.actions.preview}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveReqForSelector(req)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            {t.actions.changeMatch}
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateMatch(req.id, null)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title={t.actions.removeMatch}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 italic">
                            {language === 'bn'
                              ? 'কোনো নথি মিলানো হয়নি'
                              : 'No document matched yet'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setActiveReqForSelector(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-2xs self-start sm:self-auto"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>{t.actions.selectFile}</span>
                          </button>
                        </div>

                        {/* Suggestion banner if available */}
                        {suggestion && (
                          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <span className="text-slate-600">{t.matchView.suggestedMatch}:</span>{' '}
                                <strong className="text-blue-900 font-semibold truncate">
                                  {suggestion.name}
                                </strong>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onUpdateMatch(req.id, suggestion.id)}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 shrink-0 shadow-2xs"
                            >
                              {t.matchView.confirmSuggestion}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expiry Date Section (Section 12) */}
                    {req.has_expiry && matchedFile && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/30 p-2.5 rounded-lg border border-amber-200/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                          <div>
                            <label
                              htmlFor={`expiry-${req.id}`}
                              className="text-xs font-bold text-slate-900 block"
                            >
                              {t.matchView.expiryDateLabel}
                            </label>
                            <span className="text-[11px] text-slate-500">
                              {t.matchView.mustBeValidOn}{' '}
                              <strong className="text-slate-700">
                                {formatHumanDate(tender.submission_deadline, language)}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <input
                            id={`expiry-${req.id}`}
                            type="date"
                            value={currentMatch?.expiryDate || ''}
                            onChange={(e) =>
                              onUpdateMatch(req.id, matchedFile.id, e.target.value)
                            }
                            className={`text-xs px-2.5 py-1.5 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              !currentMatch?.expiryDate
                                ? 'border-amber-400 bg-amber-50/50'
                                : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pool of Available Files (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t.matchView.availableFilesColumn}
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {language === 'bn' ? toBanglaDigits(availableFiles.length) : availableFiles.length}
              </span>
            </div>

            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {uploadedFiles.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <p>{t.matchView.noFilesUploadedYet}</p>
                </div>
              ) : availableFiles.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-lg">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="font-semibold text-slate-800">
                    {language === 'bn' ? 'সব ফাইল মিলানো হয়েছে' : 'All available files matched'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t.matchView.noAvailableFiles}
                  </p>
                </div>
              ) : (
                availableFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      file.isDuplicate
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {language === 'bn' ? toBanglaDigits(file.pageCount) : file.pageCount}{' '}
                          {file.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(file.size)}
                        </p>

                        {file.isDuplicate && (
                          <p className="text-[10px] text-amber-800 font-medium mt-1">
                            ⚠ {t.status.duplicate}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded shrink-0"
                        title={t.actions.preview}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Duplicate enforcement note */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{t.matchView.duplicateNote}</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Selector Modal */}
      <FileSelectorModal
        isOpen={!!activeReqForSelector}
        requirement={activeReqForSelector}
        files={uploadedFiles}
        matches={matches}
        filesMap={filesMap}
        language={language}
        onSelectFile={(fileId) => {
          if (activeReqForSelector) {
            onUpdateMatch(activeReqForSelector.id, fileId);
            setActiveReqForSelector(null);
          }
        }}
        onClose={() => setActiveReqForSelector(null)}
      />
    </div>
  );
};
