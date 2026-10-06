import React, { useState } from 'react';
import { TenderMetadata } from '../../types/tender';
import { Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { ShieldCheck, HelpCircle, RotateCcw, Building2, Calendar, FileCheck2, Info } from 'lucide-react';
import { formatHumanDate } from '../../utils/dateUtils';

interface HeaderProps {
  tender: TenderMetadata | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onResetSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tender,
  language,
  onLanguageChange,
  onResetSession,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const t = translations[language];

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: App Branding */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                    {t.appName}
                  </span>
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
                  {t.appTagline}
                </p>
              </div>
            </div>

            {/* Center: Active Tender Context */}
            {tender ? (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-mono text-[11px]">
                    {tender.tender_id}
                  </span>
                  <span className="truncate max-w-[200px]" title={tender.title}>
                    {tender.title}
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 text-slate-600 truncate max-w-[140px]" title={tender.bidder}>
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{tender.bidder}</span>
                </div>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatHumanDate(tender.submission_deadline, language)}</span>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Client-Side In-Browser Processing</span>
              </div>
            )}

            {/* Right: Language switch & Help & Reset */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <div
                className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/80 shadow-2xs"
                role="group"
                aria-label="Language Switcher"
              >
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    language === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('bn')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    language === 'bn'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  বাংলা
                </button>
              </div>

              {/* Help Button */}
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                aria-label={t.help}
                title={t.help}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Reset Session */}
              {tender && (
                <button
                  type="button"
                  onClick={onResetSession}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200/80 hover:border-rose-200"
                  title={t.resetSession}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.resetSession}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">{t.help}</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <p className="font-semibold text-slate-900 mb-1">
                  {language === 'bn' ? '১. টেন্ডার ও শর্তাবলী' : '1. Load Requirements'}
                </p>
                <p>
                  {language === 'bn'
                    ? 'দরপত্রের অফিশিয়াল requirements.json ফাইল লোড করুন যাতে প্রয়োজনীয় সকল শর্ত তালিকাভুক্ত থাকে।'
                    : 'Load requirements.json defining mandatory and optional criteria.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <p className="font-semibold text-slate-900 mb-1">
                  {language === 'bn' ? '২. ডুপ্লিকেট সনাক্তকরণ' : '2. Exact Binary Duplicate Detection'}
                </p>
                <p>
                  {language === 'bn'
                    ? 'ফাইলের নাম ভিন্ন হলেও ব্রাউজারে SHA-256 হ্যাশের মাধ্যমে হুবহু অনুলিপি স্বয়ংক্রিয়ভাবে চিহ্নিত হয় এবং ভিন্ন শর্তে ব্যবহারে বাধা দেওয়া হয়।'
                    : 'Files with identical SHA-256 hashes are detected and barred from being matched to multiple requirements.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <p className="font-semibold text-slate-900 mb-1">
                  {language === 'bn' ? '৩. মেয়াদের তারিখ ও ডেডলাইন' : '3. Expiration Date Verification'}
                </p>
                <p>
                  {language === 'bn'
                    ? 'মেয়াদ থাকা শর্তে জমার শেষ তারিখের সমান বা পরবর্তী তারিখ প্রযোজ্য। জমার তারিখের পূর্বে হলে মেয়াদোত্তীর্ণ হিসেবে প্যাকেজ তৈরিতে বাধা সৃষ্টি হবে।'
                    : 'Documents requiring expiry must be valid on or after the submission deadline. Expiry equal to deadline is fully accepted.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <p className="font-semibold text-slate-900 mb-1">
                  {language === 'bn' ? '৪. নিরাপদ প্যাকেজ তৈরি' : '4. Final Package & Page Numbering'}
                </p>
                <p>
                  {language === 'bn'
                    ? 'প্রথম পাতায় ইংরেজি কভার পেজ ও ধারাবাহিক পৃষ্ঠাসংখ্যা সহ চূড়ান্ত PDF তৈরি হয়।'
                    : 'Final package contains an English cover page, table of contents, and continuous pagination footers on every page without obscuring original content.'}
                </p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                {t.actions.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
