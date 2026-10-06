import React, { useState } from 'react';
import { Requirement } from '../../types/tender';
import { UploadedPdfFile, DocumentMatch, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { isFileEligibleForRequirement } from '../../services/duplicateService';
import { formatBytes } from '../../utils/fileUtils';
import { X, Search, FileText, AlertTriangle, Check, AlertCircle } from 'lucide-react';
import { toBanglaDigits } from '../../utils/dateUtils';

interface FileSelectorModalProps {
  isOpen: boolean;
  requirement: Requirement | null;
  files: UploadedPdfFile[];
  matches: Map<string, DocumentMatch>;
  filesMap: Map<string, UploadedPdfFile>;
  language: Language;
  onSelectFile: (fileId: string) => void;
  onClose: () => void;
}

export const FileSelectorModal: React.FC<FileSelectorModalProps> = ({
  isOpen,
  requirement,
  files,
  matches,
  filesMap,
  language,
  onSelectFile,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[language];

  if (!isOpen || !requirement) return null;

  const currentMatch = matches.get(requirement.id);
  const currentMatchedFileId = currentMatch?.fileId;

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-file-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 id="select-file-title" className="text-sm font-bold text-slate-900">
              {t.fileSelectorModal.title} {requirement.order.toString().padStart(2, '0')}.{' '}
              {language === 'bn' ? requirement.title_bn : requirement.title_en}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn'
                ? 'উপলব্ধ ও উপযুক্ত PDF নথিগুলোর মধ্য থেকে নির্বাচন করুন'
                : 'Select one compatible PDF from your uploaded pool'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
            aria-label={t.actions.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.fileSelectorModal.filterSearch}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {language === 'bn' ? 'কোনো ফাইল খুঁজে পাওয়া যায়নি' : 'No matching files found'}
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = file.id === currentMatchedFileId;
              const eligibility = isFileEligibleForRequirement(
                file.id,
                requirement.id,
                matches,
                filesMap
              );
              const isEligible = isSelected || eligibility.eligible;
              const isDamaged = !!file.isDamagedOrProtected;

              return (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50'
                      : !isEligible || isDamaged
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (isEligible && !isDamaged) {
                      onSelectFile(file.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isDamaged
                          ? 'bg-rose-100 text-rose-700'
                          : file.isDuplicate
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>
                          {language === 'bn' ? toBanglaDigits(file.pageCount) : file.pageCount}{' '}
                          {file.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                        <span>·</span>
                        <span>{formatBytes(file.size)}</span>
                      </div>

                      {/* Ineligibility Reason */}
                      {!isEligible && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>
                            {eligibility.reason === 'duplicate_in_use'
                              ? t.fileSelectorModal.duplicateWarning
                              : t.fileSelectorModal.alreadyMatchedWarning}
                          </span>
                        </p>
                      )}

                      {isDamaged && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">
                          {t.uploadView.damagedWarning}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.status.matched}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!isEligible || isDamaged}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEligible && !isDamaged) onSelectFile(file.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-2xs"
                      >
                        {t.fileSelectorModal.selectBtn}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          >
            {t.actions.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
