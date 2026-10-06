import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TenderMetadata, Requirement } from '../types/tender';
import { UploadedPdfFile, DocumentMatch } from '../types/document';
import { formatHumanDate, formatCoverPackageDate } from '../utils/dateUtils';

export interface PackageGenerationOptions {
  includeIndexPage: boolean;
}

export interface GeneratedPackageResult {
  blob: Blob;
  filename: string;
  totalPages: number;
  documentCount: number;
}

export async function generateTenderPackage(
  tender: TenderMetadata,
  requirements: Requirement[],
  matches: Map<string, DocumentMatch>,
  filesMap: Map<string, UploadedPdfFile>,
  options: PackageGenerationOptions = { includeIndexPage: true }
): Promise<GeneratedPackageResult> {
  // 1. Filter and sort matched requirements by requirement.order ascending
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  const includedItems: {
    req: Requirement;
    match: DocumentMatch;
    file: UploadedPdfFile;
  }[] = [];

  for (const req of sortedReqs) {
    const match = matches.get(req.id);
    if (!match?.fileId) continue;
    const file = filesMap.get(match.fileId);
    if (!file || file.isDamagedOrProtected) continue;
    includedItems.push({ req, match, file });
  }

  // 2. Pre-calculate page counts to know exact starting page for each document
  // Cover page = 1
  let nextStartingPage = 1 + (options.includeIndexPage ? 1 : 0) + 1;
  const documentIndex: {
    order: number;
    title: string;
    filename: string;
    pageCount: number;
    startingPage: number;
  }[] = [];

  for (const item of includedItems) {
    documentIndex.push({
      order: item.req.order,
      title: item.req.title_en, // Cover and index always strictly English
      filename: item.file.name,
      pageCount: item.file.pageCount,
      startingPage: nextStartingPage,
    });
    nextStartingPage += item.file.pageCount;
  }

  const finalTotalPages = nextStartingPage - 1;

  // 3. Create fresh PDFDocument
  const mergedPdf = await PDFDocument.create();
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await mergedPdf.embedFont(StandardFonts.Courier);

  // Palette
  const primaryNavy = rgb(0.08, 0.18, 0.35); // #142E59
  const textDark = rgb(0.12, 0.15, 0.18);
  const textMuted = rgb(0.4, 0.45, 0.5);
  const borderLight = rgb(0.85, 0.88, 0.92);
  const bgLight = rgb(0.96, 0.97, 0.99);

  let currentPageIndex = 1;

  // Helper to draw standard official footer on any page
  const drawPageFooter = (page: any, pageNum: number) => {
    const { width } = page.getSize();
    const footerText = `${tender.tender_id} | Page ${pageNum} of ${finalTotalPages}`;
    const textWidth = fontRegular.widthOfTextAtSize(footerText, 9);

    // Subtle divider line
    page.drawLine({
      start: { x: 36, y: 26 },
      end: { x: width - 36, y: 26 },
      thickness: 0.5,
      color: borderLight,
    });

    // Centered or right-aligned footer
    page.drawText(footerText, {
      x: (width - textWidth) / 2,
      y: 14,
      size: 9,
      font: fontRegular,
      color: textMuted,
    });

    // Left security tag
    const stampText = 'OFFICIAL SUBMISSION';
    page.drawText(stampText, {
      x: 36,
      y: 14,
      size: 7.5,
      font: fontBold,
      color: rgb(0.5, 0.55, 0.6),
    });
  };

  // ==========================================
  // PAGE 1: COVER PAGE (Strictly in English)
  // ==========================================
  const coverPage = mergedPdf.addPage([595.28, 841.89]); // Standard A4 portrait
  const { width: cW, height: cH } = coverPage.getSize();

  // Top header bar
  coverPage.drawRectangle({
    x: 0,
    y: cH - 8,
    width: cW,
    height: 8,
    color: primaryNavy,
  });

  // Header badges & metadata
  coverPage.drawText('GOVERNMENT PROCUREMENT TENDER SUBMISSION PACKAGE', {
    x: 48,
    y: cH - 60,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.7),
  });

  // Tender Title
  const titleText = tender.title || 'Tender Submission Package';
  coverPage.drawText(titleText.substring(0, 65), {
    x: 48,
    y: cH - 86,
    size: 20,
    font: fontBold,
    color: textDark,
  });

  // Tender ID pill / box
  const tenderIdText = `TENDER REF: ${tender.tender_id}`;
  coverPage.drawRectangle({
    x: 48,
    y: cH - 118,
    width: fontBold.widthOfTextAtSize(tenderIdText, 10) + 16,
    height: 20,
    color: bgLight,
    borderColor: borderLight,
    borderWidth: 1,
  });
  coverPage.drawText(tenderIdText, {
    x: 56,
    y: cH - 113,
    size: 10,
    font: fontBold,
    color: primaryNavy,
  });

  // Divider
  coverPage.drawLine({
    start: { x: 48, y: cH - 134 },
    end: { x: cW - 48, y: cH - 134 },
    thickness: 1,
    color: borderLight,
  });

  // 2-Column Tender Specification Grid
  const metaStartY = cH - 165;
  const metaBoxHeight = 110;
  coverPage.drawRectangle({
    x: 48,
    y: metaStartY - metaBoxHeight,
    width: cW - 96,
    height: metaBoxHeight,
    color: bgLight,
    borderColor: borderLight,
    borderWidth: 1,
  });

  // Metadata labels and values
  const drawMetaField = (label: string, value: string, x: number, y: number) => {
    coverPage.drawText(label.toUpperCase(), {
      x,
      y,
      size: 7.5,
      font: fontBold,
      color: textMuted,
    });
    coverPage.drawText(value || '—', {
      x,
      y: y - 14,
      size: 10.5,
      font: fontRegular,
      color: textDark,
    });
  };

  const formattedDeadline = formatHumanDate(tender.submission_deadline, 'en');
  const packageDate = formatCoverPackageDate();

  drawMetaField('Procuring Entity', tender.procuring_entity, 68, metaStartY - 24);
  drawMetaField('Bidder Name', tender.bidder, 310, metaStartY - 24);
  drawMetaField('Submission Deadline', formattedDeadline, 68, metaStartY - 74);
  drawMetaField('Package Created Date', packageDate, 310, metaStartY - 74);

  // Included Documents section header
  const listStartY = metaStartY - metaBoxHeight - 34;
  coverPage.drawText('INCLUDED DOCUMENTS IN SUBMISSION PACKAGE', {
    x: 48,
    y: listStartY,
    size: 11,
    font: fontBold,
    color: textDark,
  });

  coverPage.drawText(`${includedItems.length} verified documents compiled in mandatory specification order`, {
    x: 48,
    y: listStartY - 14,
    size: 8.5,
    font: fontRegular,
    color: textMuted,
  });

  // List of included documents
  let rowY = listStartY - 38;
  const maxCoverRows = 12;

  coverPage.drawLine({
    start: { x: 48, y: rowY + 10 },
    end: { x: cW - 48, y: rowY + 10 },
    thickness: 0.75,
    color: borderLight,
  });

  for (let i = 0; i < Math.min(documentIndex.length, maxCoverRows); i++) {
    const item = documentIndex[i];
    const orderStr = item.order.toString().padStart(2, '0');

    coverPage.drawText(`${orderStr}.`, {
      x: 52,
      y: rowY - 2,
      size: 9.5,
      font: fontBold,
      color: primaryNavy,
    });

    const displayTitle = item.title.length > 40 ? item.title.substring(0, 38) + '...' : item.title;
    coverPage.drawText(displayTitle, {
      x: 78,
      y: rowY - 2,
      size: 9.5,
      font: fontRegular,
      color: textDark,
    });

    const pageCountText = `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}`;
    coverPage.drawText(pageCountText, {
      x: 350,
      y: rowY - 2,
      size: 8.5,
      font: fontRegular,
      color: textMuted,
    });

    const fileLabel = item.filename.length > 25 ? item.filename.substring(0, 23) + '...' : item.filename;
    coverPage.drawText(fileLabel, {
      x: 420,
      y: rowY - 2,
      size: 8,
      font: fontMono,
      color: textMuted,
    });

    coverPage.drawLine({
      start: { x: 48, y: rowY - 10 },
      end: { x: cW - 48, y: rowY - 10 },
      thickness: 0.5,
      color: borderLight,
    });

    rowY -= 22;
  }

  if (documentIndex.length > maxCoverRows) {
    coverPage.drawText(`+ ${documentIndex.length - maxCoverRows} additional documents (see Table of Contents / Index)`, {
      x: 52,
      y: rowY - 6,
      size: 8.5,
      font: fontRegular,
      color: textMuted,
    });
  }

  // Draw Page 1 footer
  drawPageFooter(coverPage, currentPageIndex);
  currentPageIndex++;

  // ==========================================
  // PAGE 2: TABLE OF CONTENTS / INDEX PAGE (Bonus)
  // ==========================================
  if (options.includeIndexPage) {
    const indexPage = mergedPdf.addPage([595.28, 841.89]);
    const { width: iW, height: iH } = indexPage.getSize();

    indexPage.drawRectangle({
      x: 0,
      y: iH - 8,
      width: iW,
      height: 8,
      color: primaryNavy,
    });

    indexPage.drawText('DOCUMENT INDEX & PAGINATION DIRECTORY', {
      x: 48,
      y: iH - 50,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.4, 0.7),
    });

    indexPage.drawText('Table of Contents', {
      x: 48,
      y: iH - 74,
      size: 18,
      font: fontBold,
      color: textDark,
    });

    indexPage.drawLine({
      start: { x: 48, y: iH - 88 },
      end: { x: iW - 48, y: iH - 88 },
      thickness: 1,
      color: borderLight,
    });

    // Preliminary entries
    let idxY = iH - 120;
    const drawIndexRow = (num: string, title: string, pageNum: number, isPrelim = false) => {
      indexPage.drawText(num, {
        x: 50,
        y: idxY,
        size: 9.5,
        font: fontBold,
        color: isPrelim ? textMuted : primaryNavy,
      });

      indexPage.drawText(title, {
        x: 80,
        y: idxY,
        size: 9.5,
        font: fontRegular,
        color: textDark,
      });

      // Dot leaders
      const startDotsX = 330;
      const endDotsX = 470;
      let dotX = startDotsX;
      while (dotX < endDotsX) {
        indexPage.drawText('.', {
          x: dotX,
          y: idxY,
          size: 9,
          font: fontRegular,
          color: rgb(0.75, 0.78, 0.82),
        });
        dotX += 7;
      }

      indexPage.drawText(`Page ${pageNum}`, {
        x: 480,
        y: idxY,
        size: 9.5,
        font: fontBold,
        color: primaryNavy,
      });

      indexPage.drawLine({
        start: { x: 48, y: idxY - 8 },
        end: { x: iW - 48, y: idxY - 8 },
        thickness: 0.5,
        color: borderLight,
      });

      idxY -= 24;
    };

    drawIndexRow('00', 'Official Tender Submission Cover Sheet', 1, true);
    drawIndexRow('00', 'Table of Contents & Pagination Directory', 2, true);

    for (const item of documentIndex) {
      const orderStr = item.order.toString().padStart(2, '0');
      drawIndexRow(orderStr, item.title, item.startingPage);
    }

    drawPageFooter(indexPage, currentPageIndex);
    currentPageIndex++;
  }

  // ==========================================
  // PAGES 3+: MERGED PDF DOCUMENTS
  // strictly sorted by requirement.order
  // ==========================================
  for (const item of includedItems) {
    try {
      const sourceDoc = await PDFDocument.load(item.file.arrayBuffer, { ignoreEncryption: true });
      const sourcePageCount = sourceDoc.getPageCount();

      // Copy each page into the destination document
      for (let pageIdx = 0; pageIdx < sourcePageCount; pageIdx++) {
        // Embed the page so we can scale and draw it safely above the reserved footer margin
        const [embedded] = await mergedPdf.embedPdf(sourceDoc, [pageIdx]);
        const origWidth = embedded.width;
        const origHeight = embedded.height;

        // Create new destination page matching the original page dimensions
        const newPage = mergedPdf.addPage([origWidth, origHeight]);

        // Safe footer reservation:
        // Reserve 32 points at the bottom for footer.
        // Scale page down slightly (by ~4%) and offset upward so original content is NEVER covered.
        const footerReservedHeight = 32;
        const scaleFactor = (origHeight - footerReservedHeight) / origHeight;

        newPage.drawPage(embedded, {
          x: (origWidth - origWidth * scaleFactor) / 2,
          y: footerReservedHeight,
          width: origWidth * scaleFactor,
          height: origHeight * scaleFactor,
        });

        // Draw standard footer in the pristine reserved margin
        drawPageFooter(newPage, currentPageIndex);
        currentPageIndex++;
      }
    } catch (loadErr) {
      console.error(`Failed to load PDF for requirement ${item.req.id}:`, loadErr);
      throw new Error(`Failed to compile document: ${item.file.name}`);
    }
  }

  // 4. Save and return PDF Blob
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes) as unknown as BlobPart], { type: 'application/pdf' });
  const filename = `${tender.tender_id || 'Tender'}_Package.pdf`;

  return {
    blob,
    filename,
    totalPages: currentPageIndex - 1,
    documentCount: includedItems.length,
  };
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
