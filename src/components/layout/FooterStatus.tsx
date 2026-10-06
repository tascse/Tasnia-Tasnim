import React from 'react';
import { AppStep, Language } from '../../types/document';
import { ValidationSummary } from '../../types/tender';
import { translations } from '../../i18n/translations';
import { ArrowLeft, ArrowRight, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toBanglaDigits } from '../../utils/dateUtils';

interface FooterStatusProps {
  currentStep: AppStep;
  language: Language;
  summary: ValidationSummary;
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onGeneratePackage?: () => void;
  isGenerating?: boolean;
}

export const FooterStatus: React.FC<FooterStatusProps> = ({
  currentStep,
  language,
  summary,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  onGeneratePackage,
  isGenerating = false,
}) => {
  const t = translations[language];

  const readyStr = language === 'bn' ? toBanglaDigits(summary.readyCount) : summary.readyCount;
  const totalStr = language === 'bn' ? toBanglaDigits(summary.totalRequirements) : summary.totalRequirements;
  const blockingStr = language === 'bn' ? toBanglaDigits(summary.blockingCount) : summary.blockingCount;

  return (
    <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-4 sm:px-6 lg:px-8 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status indicator on the left */}
        <div className="flex items-center gap-2.5 text-xs">
          {summary.totalRequirements > 0 && (
            <>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${
                  summary.isReadyForPackage
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {summary.isReadyForPackage ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {readyStr} / {totalStr} {t.reviewView.docsReadyText}
                </span>
              </div>

              {summary.blockingCount > 0 ? (
                <span className="text-rose-700 font-medium flex items-center gap-1">
                  <span className="font-bold">{blockingStr}</span>{' '}
                  {summary.blockingCount === 1
                    ? t.reviewView.oneIssueBlockingText
                    : t.reviewView.issuesBlockingText}
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold hidden md:inline">
                  ✓ {t.reviewView.readyBannerTitle}
                </span>
              )}
            </>
          )}
        </div>

        {/* Action buttons on the right */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.actions.back}</span>
            </button>
          )}

          {currentStep === 'review' ? (
            <div className="relative group">
              <button
                type="button"
                disabled={!summary.isReadyForPackage || isGenerating}
                onClick={onGeneratePackage}
                aria-disabled={!summary.isReadyForPackage}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>{t.actions.generatePackage}</span>
              </button>

              {!summary.isReadyForPackage && (
                <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-50 pointer-events-none">
                  <p className="font-semibold text-rose-300 mb-0.5">
                    {t.actions.generatePackage} {language === 'bn' ? 'অক্ষম' : 'Disabled'}
                  </p>
                  <p className="text-slate-200">
                    {blockingStr}{' '}
                    {summary.blockingCount === 1
                      ? t.reviewView.btnOneDisabledReason
                      : t.reviewView.btnDisabledReason}
                  </p>
                </div>
              )}
            </div>
          ) : currentStep !== 'package' ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              <span>{t.actions.continue}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </footer>
  );
};
