import { Requirement, RequirementValidation } from '../types/tender';
import { UploadedPdfFile } from '../types/document';

interface ChecklistRow {
  order: number;
  document: string;
  mandatory: string;
  filename: string;
  pages: string;
  expiryDate: string;
  status: string;
}

export function generateChecklistCSV(
  requirements: Requirement[],
  validations: Map<string, RequirementValidation>,
  filesMap: Map<string, UploadedPdfFile>
): string {
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  const headers = ['Order', 'Document Name', 'Requirement Type', 'Matched Filename', 'Page Count', 'Expiry Date', 'Status'];

  const rows: string[][] = [headers];

  for (const req of sortedReqs) {
    const val = validations.get(req.id);
    const matchedFile = val?.matchedFileId ? filesMap.get(val.matchedFileId) : undefined;

    let statusLabel = 'Missing';
    if (val?.status === 'OK') statusLabel = 'OK';
    else if (val?.status === 'EXPIRY_NEEDED') statusLabel = 'Expiry date needed';
    else if (val?.status === 'EXPIRED') statusLabel = 'Expired';
    else if (val?.status === 'NOT_PROVIDED') statusLabel = 'Not provided';
    else if (val?.status === 'MISSING') statusLabel = 'Missing';

    const row: ChecklistRow = {
      order: req.order,
      document: req.title_en,
      mandatory: req.mandatory ? 'Mandatory' : 'Optional',
      filename: matchedFile ? matchedFile.name : '—',
      pages: matchedFile ? matchedFile.pageCount.toString() : '—',
      expiryDate: val?.expiryDate || (req.has_expiry ? 'Not set' : 'N/A'),
      status: statusLabel,
    };

    rows.push([
      row.order.toString().padStart(2, '0'),
      escapeCSV(row.document),
      row.mandatory,
      escapeCSV(row.filename),
      row.pages,
      row.expiryDate,
      row.status,
    ]);
  }

  return rows.map((r) => r.join(',')).join('\r\n');
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function downloadChecklistCSV(tenderId: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${tenderId || 'Tender'}_Checklist.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
