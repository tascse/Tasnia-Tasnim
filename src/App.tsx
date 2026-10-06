import React from 'react';
import { useTenderState } from './hooks/useTenderState';
import { translations } from './i18n/translations';
import { Header } from './components/layout/Header';
import { StepIndicator } from './components/layout/StepIndicator';
import { PrivacyBanner } from './components/layout/PrivacyBanner';
import { FooterStatus } from './components/layout/FooterStatus';
import { TenderLoader } from './components/tender/TenderLoader';
import { FileUploadZone } from './components/upload/FileUploadZone';
import { MatchingWorkspace } from './components/matching/MatchingWorkspace';
import { ReviewScreen } from './components/review/ReviewScreen';
import { PackageGenerationScreen } from './components/package/PackageGenerationScreen';
import { PdfPreviewModal } from './components/common/PdfPreviewModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { AppStep } from './types/document';

export default function App() {
  const {
    currentStep,
    setCurrentStep,
    language,
    setLanguage,
    tender,
    requirements,
    uploadedFiles,
    matches,
    filesMap,
    validations,
    summary,
    previewFile,
    setPreviewFile,
    resetModalOpen,
    setResetModalOpen,
    completedSteps,
    canNavigateToStep,
    loadTender,
    updateFiles,
    updateMatch,
    autoMatchAll,
    resetSession,
  } = useTenderState();

  const t = translations[language];

  // Navigation handlers
  const handleGoNext = () => {
    if (currentStep === 'tender') {
      setCurrentStep('upload');
    } else if (currentStep === 'upload') {
      setCurrentStep('match');
    } else if (currentStep === 'match') {
      setCurrentStep('review');
    } else if (currentStep === 'review' && summary.isReadyForPackage) {
      setCurrentStep('package');
    }
  };

  const handleGoBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('tender');
    } else if (currentStep === 'match') {
      setCurrentStep('upload');
    } else if (currentStep === 'review') {
      setCurrentStep('match');
    } else if (currentStep === 'package') {
      setCurrentStep('review');
    }
  };

  const canGoBack = currentStep !== 'tender';
  const canGoNext =
    (currentStep === 'tender' && !!tender) ||
    (currentStep === 'upload' && uploadedFiles.length > 0) ||
    currentStep === 'match';

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-100/60 text-slate-900 ${
        language === 'bn' ? 'font-[family-name:Noto_Sans_Bengali,sans-serif]' : 'font-[family-name:Plus_Jakarta_Sans,sans-serif]'
      }`}
    >
      {/* 1. Top Header */}
      <Header
        tender={tender}
        language={language}
        onLanguageChange={setLanguage}
        onResetSession={() => setResetModalOpen(true)}
      />

      {/* 2. Privacy & Confidentiality Guarantee */}
      <PrivacyBanner language={language} />

      {/* 3. Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(step: AppStep) => {
          if (canNavigateToStep(step)) {
            setCurrentStep(step);
          }
        }}
        language={language}
        canNavigateToStep={canNavigateToStep}
      />

      {/* 4. Main Step Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentStep === 'tender' && (
          <TenderLoader
            tender={tender}
            requirements={requirements}
            language={language}
            onTenderLoaded={loadTender}
            onContinue={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'upload' && (
          <FileUploadZone
            files={uploadedFiles}
            language={language}
            onFilesUpdated={updateFiles}
            onPreviewFile={setPreviewFile}
          />
        )}

        {currentStep === 'match' && tender && (
          <MatchingWorkspace
            tender={tender}
            requirements={requirements}
            uploadedFiles={uploadedFiles}
            matches={matches}
            validations={validations}
            language={language}
            onUpdateMatch={updateMatch}
            onAutoMatchAll={autoMatchAll}
            onPreviewFile={setPreviewFile}
          />
        )}

        {currentStep === 'review' && tender && (
          <ReviewScreen
            tender={tender}
            requirements={requirements}
            matches={matches}
            validations={validations}
            filesMap={filesMap}
            summary={summary}
            language={language}
            onJumpToMatch={(reqId) => {
              setCurrentStep('match');
            }}
            onProceedToPackage={() => {
              if (summary.isReadyForPackage) {
                setCurrentStep('package');
              }
            }}
            onPreviewFile={setPreviewFile}
          />
        )}

        {currentStep === 'package' && tender && (
          <PackageGenerationScreen
            tender={tender}
            requirements={requirements}
            matches={matches}
            filesMap={filesMap}
            language={language}
          />
        )}
      </main>

      {/* 5. Sticky Bottom Action & Status Footer */}
      <FooterStatus
        currentStep={currentStep}
        language={language}
        summary={summary}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        onBack={handleGoBack}
        onNext={handleGoNext}
        onGeneratePackage={() => {
          if (summary.isReadyForPackage) {
            setCurrentStep('package');
          }
        }}
      />

      {/* PDF Canvas Preview Modal */}
      <PdfPreviewModal
        file={previewFile}
        lang={language}
        onClose={() => setPreviewFile(null)}
      />

      {/* Reset Session Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title={t.resetSession}
        message={t.confirmReset}
        confirmLabel={t.actions.confirm}
        cancelLabel={t.actions.cancel}
        isDestructive={true}
        onConfirm={resetSession}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}
