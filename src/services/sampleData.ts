import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { RequirementsFileSchema } from '../types/tender';

export const SAMPLE_TENDER_IT: RequirementsFileSchema = {
  tender: {
    tender_id: 'T-2026-0417',
    title: 'Supply of IT Equipment and Data Center Infrastructure',
    procuring_entity: 'Directorate General of Information Technology',
    bidder: 'Apex Cybernetics & Systems Ltd.',
    submission_deadline: '2026-10-20',
  },
  requirements: [
    {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      title_bn: 'হালনাগাদ ট্রেড লাইসেন্স',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'R02',
      order: 2,
      title_en: 'TIN Certificate',
      title_bn: 'টিআইএন সার্টিফিকেট ও রিটার্ন দাখিলের প্রমাণক',
      mandatory: true,
      has_expiry: false,
    },
    {
      id: 'R03',
      order: 3,
      title_en: 'VAT Registration Certificate (BIN)',
      title_bn: 'মূসক নিবন্ধন সনদপত্র (বিআইএন)',
      mandatory: true,
      has_expiry: false,
    },
    {
      id: 'R04',
      order: 4,
      title_en: 'Bank Solvency Certificate',
      title_bn: 'ব্যাংক সচ্ছলতা সনদপত্র',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'R05',
      order: 5,
      title_en: 'Past Experience Certificate',
      title_bn: 'পূর্ববর্তী কাজের অভিজ্ঞতা সনদ',
      mandatory: false,
      has_expiry: false,
    },
    {
      id: 'R06',
      order: 6,
      title_en: 'Manufacturer Authorization Form (MAF)',
      title_bn: 'প্রস্তুতকারকের অনুমোদন পত্র (এমএএফ)',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'R07',
      order: 7,
      title_en: 'ISO 9001 Quality Certification',
      title_bn: 'আইএসও ৯০০১ মান সনদপত্র',
      mandatory: false,
      has_expiry: true,
    },
  ],
};

export const SAMPLE_TENDER_CIVIL: RequirementsFileSchema = {
  tender: {
    tender_id: 'CW-2026-089',
    title: 'Construction of Regional Logistics Warehouse Facility',
    procuring_entity: 'Public Works & Logistics Engineering Department',
    bidder: 'Eastern Builders & Engineering Consortium',
    submission_deadline: '2026-11-15',
  },
  requirements: [
    {
      id: 'C01',
      order: 1,
      title_en: 'Contractor Enlistment License',
      title_bn: 'ঠিকাদার তালিকাভুক্তি লাইসেন্স',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'C02',
      order: 2,
      title_en: 'Tax Clearance Certificate',
      title_bn: 'কর পরিশোধ প্রত্যয়নপত্র',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'C03',
      order: 3,
      title_en: 'Credit Line Facility Commitment',
      title_bn: 'ব্যাংক ঋণ সুবিধা অঙ্গীকারনামা',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'C04',
      order: 4,
      title_en: 'Audited Financial Statements (Last 3 Years)',
      title_bn: 'নিরীক্ষিত আর্থিক বিবরণী (বিগত ৩ বছর)',
      mandatory: true,
      has_expiry: false,
    },
    {
      id: 'C05',
      order: 5,
      title_en: 'Key Personnel CVs and Credentials',
      title_bn: 'মূল জনবলের জীবনবৃত্তান্ত ও সনদসমূহ',
      mandatory: false,
      has_expiry: false,
    },
  ],
};

/**
 * Creates an authentic sample PDF file using pdf-lib in browser.
 * Useful for 1-click test document generation for evaluator convenience!
 */
export async function createSamplePdf(
  title: string,
  filename: string,
  pages: number = 2,
  sampleHashVariation?: string
): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pages; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Header band
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(0.1, 0.25, 0.45),
    });

    page.drawText(title.toUpperCase(), {
      x: 40,
      y: height - 38,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('OFFICIAL VERIFIED BIDDER COMPLIANCE RECORD', {
      x: 40,
      y: height - 52,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.8, 0.88, 0.95),
    });

    // Content body
    page.drawText(`Document Name: ${title}`, {
      x: 40,
      y: height - 100,
      size: 11,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.25),
    });

    page.drawText(`File Reference: ${filename} (Page ${i} of ${pages})`, {
      x: 40,
      y: height - 120,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.5),
    });

    // Mock document content blocks
    page.drawRectangle({
      x: 40,
      y: height - 280,
      width: width - 80,
      height: 130,
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 1),
    });

    page.drawText('GOVERNMENT PROCUREMENT VERIFICATION NOTE', {
      x: 55,
      y: height - 170,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.25, 0.45),
    });

    page.drawText(
      'This document is submitted as authentic prima facie evidence of corporate qualifications,',
      { x: 55, y: height - 190, size: 8.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) }
    );
    page.drawText(
      'licensing accreditation, financial solvency, and statutory compliance under procurement guidelines.',
      { x: 55, y: height - 205, size: 8.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) }
    );
    page.drawText(
      `Timestamp / Integrity Check: ${sampleHashVariation || 'Standard verified issuance'}`,
      { x: 55, y: height - 240, size: 8, font: fontRegular, color: rgb(0.5, 0.55, 0.6) }
    );
  }

  const bytes = await pdfDoc.save();
  return new File([new Uint8Array(bytes) as unknown as BlobPart], filename, { type: 'application/pdf' });
}
