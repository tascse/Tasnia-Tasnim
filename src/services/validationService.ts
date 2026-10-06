import { Requirement, RequirementStatusType, RequirementValidation, ValidationSummary } from '../types/tender';
import { DocumentMatch, UploadedPdfFile } from '../types/document';
import { compareCalendarDates, formatHumanDate } from '../utils/dateUtils';

export function evaluateRequirement(
  req: Requirement,
  match: DocumentMatch | undefined,
  submissionDeadline: string,
  lang: 'en' | 'bn' = 'en'
): RequirementValidation {
  const isMatched = !!match?.fileId;
  const expiryDate = match?.expiryDate?.trim();

  // STATUS 1 — Missing
  // mandatory = true AND no file is matched
  if (req.mandatory && !isMatched) {
    return {
      requirementId: req.id,
      status: 'MISSING',
      isBlocking: true,
      reasonEn: 'Mandatory document missing — must match a valid PDF',
      reasonBn: 'বাধ্যতামূলক নথি অনুপস্থিত — একটি উপযুক্ত PDF মিলানো আবশ্যক',
    };
  }

  // STATUS 4 — Not provided
  // mandatory = false AND no file is matched
  if (!req.mandatory && !isMatched) {
    return {
      requirementId: req.id,
      status: 'NOT_PROVIDED',
      isBlocking: false,
      reasonEn: 'Optional document not provided (will be excluded from package)',
      reasonBn: 'ঐচ্ছিক নথি প্রদান করা হয়নি (প্যাকেজ থেকে বাদ দেওয়া হবে)',
    };
  }

  // File IS matched:
  // STATUS 2 — Expiry date needed
  // has_expiry = true AND file is matched AND expiry date is missing
  if (req.has_expiry && (!expiryDate || expiryDate.length === 0)) {
    return {
      requirementId: req.id,
      status: 'EXPIRY_NEEDED',
      isBlocking: true,
      matchedFileId: match?.fileId,
      reasonEn: 'Expiry date needed — document must specify validity period',
      reasonBn: 'মেয়াদের তারিখ প্রয়োজন — নথির মেয়াদের তারিখ উল্লেখ করতে হবে',
    };
  }

  // STATUS 3 — Expired
  // expiry date is before submission_deadline (strictly <)
  if (req.has_expiry && expiryDate) {
    const comparison = compareCalendarDates(expiryDate, submissionDeadline);
    if (comparison < 0) {
      const formattedDeadline = formatHumanDate(submissionDeadline, lang);
      return {
        requirementId: req.id,
        status: 'EXPIRED',
        isBlocking: true,
        matchedFileId: match?.fileId,
        expiryDate,
        reasonEn: `Expired: Must be valid on or after deadline (${formattedDeadline})`,
        reasonBn: `মেয়াদোত্তীর্ণ: জমার তারিখে বা পরে বৈধ হতে হবে (${formattedDeadline})`,
      };
    }
  }

  // STATUS 5 — OK
  // file matched AND (has_expiry = false OR expiry date >= submission_deadline)
  return {
    requirementId: req.id,
    status: 'OK',
    isBlocking: false,
    matchedFileId: match?.fileId,
    expiryDate,
    reasonEn: 'Document verified and compliant',
    reasonBn: 'নথি যাচাইকৃত ও প্রয়োজনীয় শর্ত পূরণ করেছে',
  };
}

export function computeValidationSummary(
  requirements: Requirement[],
  matches: Map<string, DocumentMatch>,
  submissionDeadline: string,
  lang: 'en' | 'bn' = 'en'
): { summary: ValidationSummary; validations: Map<string, RequirementValidation> } {
  const validations = new Map<string, RequirementValidation>();
  const blockingIssues: RequirementValidation[] = [];
  let readyCount = 0;
  let mandatoryCount = 0;
  let optionalCount = 0;

  for (const req of requirements) {
    if (req.mandatory) mandatoryCount++;
    else optionalCount++;

    const match = matches.get(req.id);
    const result = evaluateRequirement(req, match, submissionDeadline, lang);
    validations.set(req.id, result);

    if (result.isBlocking) {
      blockingIssues.push(result);
    } else {
      readyCount++;
    }
  }

  const summary: ValidationSummary = {
    totalRequirements: requirements.length,
    mandatoryCount,
    optionalCount,
    readyCount,
    blockingCount: blockingIssues.length,
    isReadyForPackage: blockingIssues.length === 0 && requirements.length > 0,
    blockingIssues,
  };

  return { summary, validations };
}

/**
 * Checks duplicate constraints:
 * Verifies if any matched file is a duplicate of another matched file,
 * or if two requirements have been assigned binary-identical files.
 */
export function checkDuplicateCollisions(
  matches: Map<string, DocumentMatch>,
  filesMap: Map<string, UploadedPdfFile>
): { hasCollisions: boolean; collidingPairs: { reqA: string; reqB: string; hash: string }[] } {
  const hashToReq = new Map<string, string>();
  const collidingPairs: { reqA: string; reqB: string; hash: string }[] = [];

  matches.forEach((match, reqId) => {
    if (!match.fileId) return;
    const file = filesMap.get(match.fileId);
    if (!file || !file.hash) return;

    if (hashToReq.has(file.hash)) {
      const prevReq = hashToReq.get(file.hash)!;
      collidingPairs.push({ reqA: prevReq, reqB: reqId, hash: file.hash });
    } else {
      hashToReq.set(file.hash, reqId);
    }
  });

  return {
    hasCollisions: collidingPairs.length > 0,
    collidingPairs,
  };
}
