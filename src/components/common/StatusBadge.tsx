import React from 'react';
import { RequirementStatusType } from '../../types/tender';
import { Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { Check, AlertTriangle, X, Minus, Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: RequirementStatusType;
  lang: Language;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  lang,
  showIcon = true,
  className = '',
}) => {
  const t = translations[lang].status;

  switch (status) {
    case 'OK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs ${className}`}
          role="status"
          aria-label={`Status: ${t.ok}`}
        >
          {showIcon && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" aria-hidden="true" />}
          <span>✓ {t.ok}</span>
        </span>
      );

    case 'EXPIRY_NEEDED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs ${className}`}
          role="status"
          aria-label={`Status: ${t.expiryNeeded}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" aria-hidden="true" />}
          <span>! {t.expiryNeeded}</span>
        </span>
      );

    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/90 shadow-xs ${className}`}
          role="status"
          aria-label={`Status: ${t.expired}`}
        >
          {showIcon && <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" aria-hidden="true" />}
          <span>× {t.expired}</span>
        </span>
      );

    case 'MISSING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 shadow-xs ${className}`}
          role="status"
          aria-label={`Status: ${t.missing}`}
        >
          {showIcon && <Minus className="w-3.5 h-3.5 text-slate-500 stroke-[2.5]" aria-hidden="true" />}
          <span>— {t.missing}</span>
        </span>
      );

    case 'NOT_PROVIDED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 ${className}`}
          role="status"
          aria-label={`Status: ${t.notProvided}`}
        >
          {showIcon && <Circle className="w-3 h-3 text-slate-400 stroke-[2]" aria-hidden="true" />}
          <span>○ {t.notProvided}</span>
        </span>
      );

    default:
      return null;
  }
};
