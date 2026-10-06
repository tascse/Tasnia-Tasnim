import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Language } from '../../types/document';
import { translations } from '../../i18n/translations';

interface PrivacyBannerProps {
  language: Language;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ language }) => {
  const t = translations[language];

  return (
    <div className="bg-emerald-50/70 border-b border-emerald-200/60 px-4 py-1.5 text-xs text-emerald-900 flex items-center justify-center gap-2">
      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
      <span className="font-medium tracking-tight text-center">{t.privacyNotice}</span>
    </div>
  );
};
