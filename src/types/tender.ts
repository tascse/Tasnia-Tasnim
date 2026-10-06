export interface TenderMetadata {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // YYYY-MM-DD
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface RequirementsFileSchema {
  tender: TenderMetadata;
  requirements: Requirement[];
}

export type RequirementStatusType =
  | 'OK'
  | 'EXPIRY_NEEDED'
  | 'EXPIRED'
  | 'MISSING'
  | 'NOT_PROVIDED';

export interface RequirementValidation {
  requirementId: string;
  status: RequirementStatusType;
  isBlocking: boolean;
  matchedFileId?: string;
  expiryDate?: string;
  reasonEn: string;
  reasonBn: string;
}

export interface ValidationSummary {
  totalRequirements: number;
  mandatoryCount: number;
  optionalCount: number;
  readyCount: number;
  blockingCount: number;
  isReadyForPackage: boolean;
  blockingIssues: RequirementValidation[];
}
