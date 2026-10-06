import React from 'react';
import { AppStep, Language } from '../../types/document';
import { translations } from '../../i18n/translations';
import { Check, FileText, Upload, Link2, ShieldAlert, PackageCheck } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: AppStep;
  completedSteps: Set<AppStep>;
  onStepClick: (step: AppStep) => void;
  language: Language;
  canNavigateToStep: (step: AppStep) => boolean;
}

const STEPS: { id: AppStep; icon: React.ElementType }[] = [
  { id: 'tender', icon: FileText },
  { id: 'upload', icon: Upload },
  { id: 'match', icon: Link2 },
  { id: 'review', icon: ShieldAlert },
  { id: 'package', icon: PackageCheck },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  language,
  canNavigateToStep,
}) => {
  const t = translations[language].steps;
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav
      aria-label="Workflow progress"
      className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs"
    >
      <div className="max-w-5xl mx-auto">
        <ol className="flex items-center justify-between relative">
          {/* Background progress track */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 z-0"
            style={{
              width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%`,
            }}
          />

          {STEPS.map((step, idx) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = currentStep === step.id;
            const isFuture = idx > currentIndex;
            const isNavigable = canNavigateToStep(step.id);
            const StepIcon = step.icon;

            return (
              <li key={step.id} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isNavigable}
                  onClick={() => onStepClick(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md font-bold'
                      : isCompleted
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer'
                      : 'bg-white border-2 border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <StepIcon
                      className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                        isCurrent ? 'text-white' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="sr-only">
                    {t[step.id]} {isCurrent ? '(current step)' : isCompleted ? '(completed)' : ''}
                  </span>
                </button>

                {/* Step Label */}
                <span
                  className={`mt-1.5 text-xs font-medium tracking-tight text-center select-none transition-colors hidden sm:block ${
                    isCurrent
                      ? 'text-blue-900 font-bold'
                      : isCompleted
                      ? 'text-slate-700 font-semibold'
                      : isFuture
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {t[step.id]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
