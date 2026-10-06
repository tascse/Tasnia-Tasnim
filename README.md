# 📄 Tender Package Builder

> **Turn a collection of tender documents into one complete, validated, correctly ordered submission package.**

Tender Package Builder is a **frontend-only document processing web application** designed to help organizations prepare tender submissions safely and efficiently.

It allows office staff to load tender requirements, upload PDF documents, match files to requirements, detect duplicates, validate expiry dates, identify missing documents, and generate a final submission-ready PDF package — entirely inside the browser.

---

## 🎯 The Problem

Preparing tender documents manually can be error-prone.

A tender may require:

* Trade License
* TIN Certificate
* VAT Certificate
* Bank Solvency Letter
* Experience Certificates
* Technical Proposal
* Financial Proposal
* Other supporting documents

Some documents are mandatory, some are optional, and some must remain valid on the tender submission date.

A single mistake — such as a missing document, expired certificate, duplicate file, or incorrect document order — can make a submission incomplete or potentially lead to rejection.

### Tender Package Builder solves this by providing a guided workflow:

**Load Requirements → Upload PDFs → Match Documents → Validate → Review → Generate Package**

---

## ✨ Features

### 📋 Tender Requirement Management

* Load `requirements.json`
* Display tender information
* Automatically sort requirements by their specified order
* Support mandatory and optional documents
* Support documents with and without expiry dates
* Dynamically handle unseen tender requirements

### 📁 PDF Upload

* Upload multiple PDF files
* Maximum 30 files
* Maximum 50 MB total
* Display filename and page count
* Remove uploaded files
* Reject non-PDF files
* Handle corrupted or password-protected PDFs safely

### 🔗 Document Matching

* Match uploaded PDFs to tender requirements
* One requirement can have at most one file
* One file can be assigned to at most one requirement
* Change or remove matches at any time
* Optional filename-based match suggestions

### 🔍 Duplicate Detection

Uploaded PDFs are checked using **SHA-256 content hashing**.

This means files are identified as duplicates based on their actual content rather than their filenames.

For example:

```text
bank-solvency.pdf
bank-solvency-copy.pdf
```

If both files contain exactly the same data, the application identifies them as duplicates even though their filenames are different.

Duplicate files cannot be used as separate documents for different requirements.

### 📅 Expiry Validation

For documents requiring expiry validation, users can enter the document's expiry date.

The application compares it with the tender submission deadline.

For example:

```text
Submission deadline: 20 October 2026
Document expiry:     20 October 2026

Result: ✓ OK
```

A document expiring on the submission deadline is considered valid.

### 🚦 Real-Time Status Checking

Every requirement receives exactly one status:

| Status                | Meaning                                     | Blocks Package |
| --------------------- | ------------------------------------------- | -------------- |
| ❌ Missing             | Mandatory document has no matched file      | Yes            |
| ⚠️ Expiry date needed | Required expiry date has not been entered   | Yes            |
| 🔴 Expired            | Document expires before submission deadline | Yes            |
| ○ Not provided        | Optional document has no matched file       | No             |
| ✅ OK                  | Requirement has been satisfied              | No             |

Statuses update immediately whenever the user changes the documents, matches, or expiry dates.

### 📦 PDF Package Generation

When all blocking issues are resolved, the application generates one combined PDF.

The package contains:

1. English cover page
2. Included documents in the required order
3. All original pages from each selected PDF
4. Page footer on every page

Footer format:

```text
<TENDER_ID> | Page X of Y
```

Example:

```text
T-2026-0417 | Page 7 of 18
```

The final file is downloaded as:

```text
<TENDER_ID>_Package.pdf
```

---

## 🌐 Bilingual Interface

The application supports:

* 🇬🇧 English
* 🇧🇩 বাংলা

The document names shown in the interface are dynamically selected from:

```text
title_en
```

or

```text
title_bn
```

depending on the selected language.

The generated PDF cover remains in **English**, as required by the competition specification.

---

## 🔒 Privacy First

Tender documents can contain sensitive business information.

For this reason, the application is completely frontend-only.

### Documents are processed locally in the browser.

There is:

* ❌ No backend
* ❌ No database
* ❌ No document upload server
* ❌ No cloud document storage
* ❌ No external document-processing service

PDF files remain on the user's device during processing.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │   requirements.json  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Tender Loader       │
                    └──────────┬───────────┘
                               │
                               ▼
┌──────────────┐     ┌──────────────────────┐
│ PDF Files    │────▶│ Document Manager     │
└──────────────┘     └──────────┬───────────┘
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
             ┌──────────────┐     ┌────────────────┐
             │ PDF.js       │     │ SHA-256 Hashing│
             │ Page Count   │     │ Duplicate Check│
             └──────────────┘     └────────────────┘
                     │
                     ▼
             ┌──────────────────┐
             │ Matching Engine  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Validation Engine│
             └────────┬─────────┘
                      │
              ┌───────┴────────┐
              ▼                ▼
        Blocking Issues     Ready
              │                │
              │                ▼
              │       ┌──────────────────┐
              │       │ PDF Package      │
              │       │ Generator        │
              │       └────────┬─────────┘
              │                │
              └────────────────┤
                               ▼
                     <Tender_ID>_Package.pdf
```

---

## 🛠️ Technology Stack

| Technology      | Purpose                            |
| --------------- | ---------------------------------- |
| React           | User interface                     |
| TypeScript      | Type-safe application logic        |
| Vite            | Development and build tooling      |
| Tailwind CSS    | UI styling                         |
| pdf.js          | PDF reading and page counting      |
| pdf-lib         | PDF merging and package generation |
| Web Crypto API  | SHA-256 duplicate detection        |
| File API        | Local file processing              |
| Browser Storage | Optional local project persistence |

---

## 📂 Project Structure

```text
tender-package-builder/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── tender/
│   │   ├── upload/
│   │   ├── matching/
│   │   ├── review/
│   │   └── package/
│   │
│   ├── hooks/
│   │   ├── useTender.ts
│   │   ├── useDocuments.ts
│   │   ├── useMatching.ts
│   │   ├── useValidation.ts
│   │   └── useLanguage.ts
│   │
│   ├── services/
│   │   ├── pdfService.ts
│   │   ├── duplicateService.ts
│   │   ├── validationService.ts
│   │   ├── packageService.ts
│   │   └── storageService.ts
│   │
│   ├── types/
│   │   ├── tender.ts
│   │   └── document.ts
│   │
│   ├── i18n/
│   │   ├── en.ts
│   │   └── bn.ts
│   │
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── fileUtils.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── output/
│   └── <tender_id>_Package.pdf
│
├── screenshots/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* Google Chrome

### Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
```

Navigate to the project:

```bash
cd tender-package-builder
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown by Vite in Google Chrome.

---

## 🧪 How to Use

### 1. Load Tender Requirements

Select:

```text
requirements.json
```

The application loads the tender details and required document checklist.

### 2. Upload Documents

Upload the available PDF documents.

The application automatically:

* counts pages
* validates file type
* checks file limits
* calculates content hashes
* detects duplicates

### 3. Match Documents

Assign each uploaded PDF to its corresponding tender requirement.

### 4. Enter Expiry Dates

For documents where:

```json
"has_expiry": true
```

enter the document's expiry date.

### 5. Review Status

Resolve every blocking issue.

The package can only be generated when there are no blocking statuses.

### 6. Generate Package

Click:

```text
Generate Package
```

The application creates the final combined PDF.

### 7. Download

The generated package follows:

```text
<TENDER_ID>_Package.pdf
```

---

## 📄 Requirements Format

The application accepts the following structure:

```json
{
  "tender": {
    "tender_id": "T-2026-0417",
    "title": "Supply of IT Equipment",
    "procuring_entity": "Example Directorate",
    "bidder": "Example Company Ltd.",
    "submission_deadline": "2026-10-20"
  },
  "requirements": [
    {
      "id": "R01",
      "order": 1,
      "title_en": "Trade License",
      "title_bn": "ট্রেড লাইসেন্স",
      "mandatory": true,
      "has_expiry": true
    }
  ]
}
```

The application does not depend on the sample tender.

It dynamically processes the supplied requirements and PDF files.

---

## 📦 Package Rules

The generated PDF follows these rules:

### Page 1

English cover page containing:

* Tender ID
* Tender title
* Procuring entity
* Bidder name
* Submission deadline
* Package creation date
* Included document list

### Following Pages

Documents are included according to:

```text
requirement.order
```

All pages from each selected PDF are preserved in their original order.

Optional documents without a matched file are skipped.

### Footer

Every page contains:

```text
<TENDER_ID> | Page X of Y
```

Where `Y` is the total number of pages in the final package.

---

## 🎁 Bonus Features

Where implemented, the application also supports:

* 📑 Package index page
* ✍️ Seal/signature placement
* 📊 CSV checklist export
* 💾 Save and reopen projects
* 🤖 Filename-based auto-match suggestions
* 👁️ PDF previews
* 🌐 Bangla interface

Core tender validation and PDF generation remain the primary focus.

---

## 🧠 Design Philosophy

Tender Package Builder follows four principles:

### 1. Prevent mistakes

The application should catch problems before submission.

### 2. Make the next action obvious

Users should never have to wonder what to do next.

### 3. Never hide a blocking issue

If something prevents package generation, the application clearly explains why.

### 4. Keep sensitive documents local

Tender documents should not need to leave the user's browser.

---

## 🧪 Validation Scenarios

The application is designed to handle:

* Missing mandatory documents
* Missing optional documents
* Missing expiry dates
* Expired documents
* Documents expiring exactly on the submission deadline
* Exact duplicate PDFs
* Non-PDF uploads
* Corrupted PDFs
* Password-protected PDFs
* More than 30 files
* More than 50 MB total upload size
* Arbitrary requirement ordering
* Different tender IDs and deadlines
* English and Bangla interfaces

---

## 🏆 Competition Context

This project was developed for the **AI DevFest Tender Package Builder challenge**.

The application is designed around the official problem requirements, with particular focus on:

* Correct document status detection
* Exact duplicate detection
* Correct PDF ordering
* Accurate page numbering
* Mandatory/optional document handling
* Expiry validation
* Frontend-only document processing
* Simple workflow for non-technical office staff

---

## 👥 Team

**Project:** Tender Package Builder

**Built for:** AI DevFest Competition

**Development approach:** AI-assisted frontend development + manual engineering and testing

---

## 📜 License

This project was created for competition purposes.

Refer to the repository or competition rules for usage and distribution details.
