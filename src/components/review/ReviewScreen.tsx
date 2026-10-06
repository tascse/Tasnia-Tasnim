import React from 'react';
import { Requirement, RequirementValidation, TenderMetadata, ValidationSummary } from '../../types/tender';
import { UploadedPdfFile, DocumentMatch, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { StatusBadge } from '../common/StatusBadge';
import { formatHumanDate, toBanglaDigits } from '../../utils/dateUtils';
import { generateChecklistCSV, downloadChecklistCSV } from '../../utils/csvUtils';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Building2,
  Calendar,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

interface ReviewScreenProps {
  tender: TenderMetadata;
  requirements: Requirement[];
  matches: Map<string, DocumentMatch>;
  validations: Map<string, RequirementValidation>;
  filesMap: Map<string, UploadedPdfFile>;
  summary: ValidationSummary;
  language: Language;
  onJumpToMatch: (requirementId: string) => void;
  onProceedToPackage: () => void;
  onPreviewFile: (file: UploadedPdfFile) => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  tender,
  requirements,
  matches,
  validations,
  filesMap,
  summary,
  language,
  onJumpToMatch,
  onProceedToPackage,
  onPreviewFile,
}) => {
  const t = translations[language];
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  const readyStr = language === 'bn' ? toBanglaDigits(summary.readyCount) : summary.readyCount;
  const totalStr = language === 'bn' ? toBanglaDigits(summary.totalRequirements) : summary.totalRequirements;
  const blockingStr = language === 'bn' ? toBanglaDigits(summary.blockingCount) : summary.blockingCount;

  const handleExportCSV = () => {
    const csvData = generateChecklistCSV(requirements, validations, filesMap);
    downloadChecklistCSV(tender.tender_id, csvData);
  };

  return (
    <div className="space-y-6">
      {/* Readiness Status Banner */}
      <div
        className={`rounded-xl border p-6 sm:p-7 shadow-xs transition-all ${
          summary.isReadyForPackage
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-amber-50/80 border-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                summary.isReadyForPackage
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-600 text-white shadow-xs'
              }`}
            >
              {summary.isReadyForPackage ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {summary.isReadyForPackage
                    ? t.reviewView.readyBannerTitle
                    : t.reviewView.actionRequiredTitle}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    summary.isReadyForPackage
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {readyStr} / {totalStr} {t.reviewView.docsReadyText}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 mt-1">
                {summary.isReadyForPackage
                  ? t.reviewView.readyBannerSubtitle
                  : `${blockingStr} ${
                      summary.blockingCount === 1
                        ? t.reviewView.oneIssueBlockingText
                        : t.reviewView.issuesBlockingText
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            {/* CSV Checklist Export Bonus */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.actions.exportCsv}</span>
            </button>

            {summary.isReadyForPackage && (
              <button
                type="button"
                onClick={onProceedToPackage}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <span>{language === 'bn' ? 'প্যাকেজ তৈরিতে যান' : 'Compile Package'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Blocking Issues Alert Box if any */}
        {!summary.isReadyForPackage && summary.blockingIssues.length > 0 && (
          <div className="mt-5 pt-4 border-t border-amber-200/80 space-y-2">
            <span className="text-xs font-bold text-amber-900 block">
              {language === 'bn'
                ? 'প্যাকেজ তৈরির পূর্বে নিচের ত্রুটিসমূহ সংশোধন করুন:'
                : 'Blocking issues that prevent package generation:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.blockingIssues.map((issue) => {
                const req = requirements.find((r) => r.id === issue.requirementId);
                if (!req) return null;

                return (
                  <div
                    key={issue.requirementId}
                    className="p-2.5 rounded-lg bg-white/90 border border-amber-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 block truncate">
                        {req.order.toString().padStart(2, '0')}.{' '}
                        {language === 'bn' ? req.title_bn : req.title_en}
                      </span>
                      <span className="text-[11px] text-rose-600 block mt-0.5">
                        {language === 'bn' ? issue.reasonBn : issue.reasonEn}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJumpToMatch(req.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md shrink-0 transition-colors"
                    >
                      {t.reviewView.jumpToResolve}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tender Summary Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded bg-slate-900 text-white font-mono font-semibold">
            {tender.tender_id}
          </span>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{tender.title}</h3>
            <span className="text-slate-500">
              {tender.procuring_entity} · {tender.bidder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>
            {t.tenderView.submissionDeadline}:{' '}
            <strong className="text-slate-900">
              {formatHumanDate(tender.submission_deadline, language)}
            </strong>
          </span>
        </div>
      </div>

      {/* Full Document Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {language === 'bn' ? 'নথি সঙ্গতি চেকলিস্ট' : 'Document Compliance Matrix'}
          </h3>
          <span className="text-xs text-slate-500">
            {language === 'bn' ? 'যেকোনো সারিতে ক্লিক করে মিল পরিবর্তন করুন' : 'Click any row to jump and edit match'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th scope="col" className="px-4 py-3 w-16">
                  {t.reviewView.tableHeaders.order}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.reviewView.tableHeaders.document}
                </th>
                <th scope="col" className="px-4 py-3 w-24">
                  {t.reviewView.tableHeaders.required}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.reviewView.tableHeaders.matchedFile}
                </th>
                <th scope="col" className="px-4 py-3 w-20 text-center">
                  {t.reviewView.tableHeaders.pages}
                </th>
                <th scope="col" className="px-4 py-3 w-32">
                  {t.reviewView.tableHeaders.expiry}
                </th>
                <th scope="col" className="px-4 py-3 w-40">
                  {t.reviewView.tableHeaders.status}
                </th>
                <th scope="col" className="px-4 py-3 w-20 text-right">
                  {t.reviewView.tableHeaders.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedReqs.map((req) => {
                const match = matches.get(req.id);
                const file = match?.fileId ? filesMap.get(match.fileId) : undefined;
                const validation = validations.get(req.id);
                const status = validation?.status || (req.mandatory ? 'MISSING' : 'NOT_PROVIDED');
                const isBlocking = validation?.isBlocking ?? (req.mandatory && !file);

                return (
                  <tr
                    key={req.id}
                    onClick={() => onJumpToMatch(req.id)}
                    className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${
                      isBlocking ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-600">
                      {req.order.toString().padStart(2, '0')}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {language === 'bn' ? req.title_bn : req.title_en}
                      </p>
                      {language === 'bn' && (
                        <p className="text-[11px] text-slate-400">{req.title_en}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          req.mandatory
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {req.mandatory ? t.status.mandatory : t.status.optional}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {file ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[180px]">{file.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono">
                      {file ? (
                        language === 'bn' ? toBanglaDigits(file.pageCount) : file.pageCount
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {req.has_expiry ? (
                        match?.expiryDate ? (
                          <span className="font-mono text-slate-800">
                            {formatHumanDate(match.expiryDate, language)}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium text-[11px]">
                            ! {language === 'bn' ? 'তারিখ অনুপস্থিত' : 'Date missing'}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={status} lang={language} />
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToMatch(req.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline"
                      >
                        {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
