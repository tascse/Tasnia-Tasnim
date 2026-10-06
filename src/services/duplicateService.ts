import { UploadedPdfFile, DocumentMatch } from '../types/document';

export function identifyDuplicates(files: UploadedPdfFile[]): UploadedPdfFile[] {
  const hashToFirstFile = new Map<string, UploadedPdfFile>();
  const duplicateCounts = new Map<string, number>();

  // Count occurrences
  for (const file of files) {
    if (!file.hash) continue;
    duplicateCounts.set(file.hash, (duplicateCounts.get(file.hash) || 0) + 1);
  }

  return files.map((file) => {
    if (!file.hash) return file;
    const count = duplicateCounts.get(file.hash) || 1;

    if (count > 1) {
      if (!hashToFirstFile.has(file.hash)) {
        // First occurrence in array
        hashToFirstFile.set(file.hash, file);
        return {
          ...file,
          isDuplicate: false, // The primary instance
          duplicateGroupId: file.hash,
        };
      } else {
        const primary = hashToFirstFile.get(file.hash)!;
        return {
          ...file,
          isDuplicate: true,
          duplicateOfFilename: primary.name,
          duplicateGroupId: file.hash,
        };
      }
    }

    return {
      ...file,
      isDuplicate: false,
      duplicateOfFilename: undefined,
      duplicateGroupId: undefined,
    };
  });
}

/**
 * Checks whether a given file is allowed to be matched to a requirement:
 * 1. Is this exact file ID already matched to another requirement?
 * 2. Is any other file with the identical SHA-256 hash already matched to another requirement?
 */
export function isFileEligibleForRequirement(
  fileId: string,
  targetRequirementId: string,
  matches: Map<string, DocumentMatch>,
  filesMap: Map<string, UploadedPdfFile>
): { eligible: boolean; reason?: 'already_matched' | 'duplicate_in_use' } {
  const candidate = filesMap.get(fileId);
  if (!candidate) return { eligible: false };

  for (const [reqId, match] of matches.entries()) {
    // Current requirement can keep its own file
    if (reqId === targetRequirementId) continue;

    if (match.fileId === fileId) {
      return { eligible: false, reason: 'already_matched' };
    }

    // Check if another file with the same binary hash is matched
    const matchedFile = filesMap.get(match.fileId);
    if (matchedFile && matchedFile.hash === candidate.hash) {
      return { eligible: false, reason: 'duplicate_in_use' };
    }
  }

  return { eligible: true };
}
