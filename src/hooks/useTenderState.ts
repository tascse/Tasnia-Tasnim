import { useState, useEffect, useMemo, useCallback } from 'react';
import { TenderMetadata, Requirement, RequirementsFileSchema, ValidationSummary, RequirementValidation } from '../types/tender';
import { UploadedPdfFile, DocumentMatch, AppStep, Language } from '../types/document';
import { computeValidationSummary } from '../services/validationService';
import { identifyDuplicates, isFileEligibleForRequirement } from '../services/duplicateService';
import { calculateMatchScore } from '../utils/fileUtils';
import { saveSessionToStorage, loadSessionFromStorage, clearSavedSession } from '../services/storageService';

export function useTenderState() {
  const [currentStep, setCurrentStep] = useState<AppStep>('tender');
  const [language, setLanguage] = useState<Language>('en');
  const [tender, setTender] = useState<TenderMetadata | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedPdfFile[]>([]);
  const [matches, setMatches] = useState<Map<string, DocumentMatch>>(new Map());
  const [previewFile, setPreviewFile] = useState<UploadedPdfFile | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Load saved session on mount if available
  useEffect(() => {
    let mounted = true;
    loadSessionFromStorage()
      .then((saved) => {
        if (mounted && saved && saved.tender) {
          setCurrentStep(saved.currentStep);
          setLanguage(saved.language);
          setTender(saved.tender);
          setRequirements(saved.requirements);
          setMatches(saved.matches);
          setUploadedFiles(identifyDuplicates(saved.uploadedFiles));
        }
      })
      .finally(() => {
        if (mounted) setIsInitialized(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Auto-save session on changes (after initial mount)
  useEffect(() => {
    if (!isInitialized) return;
    saveSessionToStorage(currentStep, language, tender, requirements, matches, uploadedFiles);
  }, [currentStep, language, tender, requirements, matches, uploadedFiles, isInitialized]);

  // 3. Centralized validation summary live computation
  const { summary, validations } = useMemo(() => {
    if (!tender) {
      return {
        summary: {
          totalRequirements: 0,
          mandatoryCount: 0,
          optionalCount: 0,
          readyCount: 0,
          blockingCount: 0,
          isReadyForPackage: false,
          blockingIssues: [],
        },
        validations: new Map<string, RequirementValidation>(),
      };
    }
    return computeValidationSummary(requirements, matches, tender.submission_deadline, language);
  }, [tender, requirements, matches, language]);

  // Files map for quick lookup
  const filesMap = useMemo(() => {
    return new Map<string, UploadedPdfFile>(uploadedFiles.map((f) => [f.id, f]));
  }, [uploadedFiles]);

  // Completed steps calculation
  const completedSteps = useMemo(() => {
    const set = new Set<AppStep>();
    if (tender && requirements.length > 0) set.add('tender');
    if (uploadedFiles.length > 0) set.add('upload');
    if (matches.size > 0) set.add('match');
    if (summary.isReadyForPackage) set.add('review');
    return set;
  }, [tender, requirements.length, uploadedFiles.length, matches.size, summary.isReadyForPackage]);

  // Navigability rule
  const canNavigateToStep = useCallback(
    (step: AppStep): boolean => {
      if (step === 'tender') return true;
      if (!tender) return false;
      if (step === 'upload') return true;
      if (step === 'match') return uploadedFiles.length > 0;
      if (step === 'review') return uploadedFiles.length > 0;
      if (step === 'package') return summary.isReadyForPackage;
      return false;
    },
    [tender, uploadedFiles.length, summary.isReadyForPackage]
  );

  // Load new tender schema
  const loadTender = useCallback((schema: RequirementsFileSchema) => {
    setTender(schema.tender);
    setRequirements(schema.requirements);
    setMatches(new Map());
    setCurrentStep('upload');
  }, []);

  // Update uploaded files list
  const updateFiles = useCallback((newFiles: UploadedPdfFile[]) => {
    const withDuplicates = identifyDuplicates(newFiles);
    setUploadedFiles(withDuplicates);

    // Clean up matches for any files that were removed
    setMatches((prev) => {
      const next = new Map(prev);
      const remainingIds = new Set(newFiles.map((f) => f.id));
      for (const [reqId, match] of next.entries()) {
        if (match.fileId && !remainingIds.has(match.fileId)) {
          next.delete(reqId);
        }
      }
      return next;
    });
  }, []);

  // Update a requirement's matched file and/or expiry date
  const updateMatch = useCallback(
    (reqId: string, fileId: string | null, expiryDate?: string) => {
      setMatches((prev) => {
        const next = new Map(prev);
        if (!fileId) {
          next.delete(reqId);
          return next;
        }

        const existing = next.get(reqId);
        next.set(reqId, {
          requirementId: reqId,
          fileId,
          expiryDate: expiryDate !== undefined ? expiryDate : existing?.expiryDate,
        });
        return next;
      });
    },
    []
  );

  // Auto-match all high confidence candidates
  const autoMatchAll = useCallback(() => {
    setMatches((prev) => {
      const next = new Map(prev);
      const matchedIds = new Set<string>();
      next.forEach((m) => {
        if (m.fileId) matchedIds.add(m.fileId);
      });

      const currentFilesMap = new Map(uploadedFiles.map((f) => [f.id, f]));

      for (const req of requirements) {
        if (next.has(req.id) && next.get(req.id)?.fileId) continue;

        let bestCandidate: UploadedPdfFile | null = null;
        let highestScore = 0;

        for (const file of uploadedFiles) {
          if (matchedIds.has(file.id) || file.isDamagedOrProtected) continue;

          const eligibility = isFileEligibleForRequirement(file.id, req.id, next, currentFilesMap);
          if (!eligibility.eligible) continue;

          const { score, isGoodCandidate } = calculateMatchScore(req.title_en, file.name);
          if (isGoodCandidate && score > highestScore) {
            highestScore = score;
            bestCandidate = file;
          }
        }

        if (bestCandidate) {
          next.set(req.id, {
            requirementId: req.id,
            fileId: bestCandidate.id,
          });
          matchedIds.add(bestCandidate.id);
        }
      }

      return next;
    });
  }, [requirements, uploadedFiles]);

  // Reset entire session
  const resetSession = useCallback(async () => {
    await clearSavedSession();
    setCurrentStep('tender');
    setTender(null);
    setRequirements([]);
    setUploadedFiles([]);
    setMatches(new Map());
    setPreviewFile(null);
    setResetModalOpen(false);
  }, []);

  return {
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
  };
}
