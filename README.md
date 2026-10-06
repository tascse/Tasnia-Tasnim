# Tender Package Builder

A frontend-only web application that helps bidders prepare a complete tender submission package by uploading, matching, validating, ordering, and combining required PDF documents into one final submission-ready PDF.

---

## 👤 Participant Information

Name: Tasnia Tasnim

### 🌐 Public HTTPS Live Link

**Live Application:** https://tasnia-tasnim.vercel.app/

---

## 📌 Problem

Preparing tender documents manually can be error-prone. A bidder may accidentally miss a mandatory document, upload duplicate files, submit an expired certificate, place documents in the wrong order, or forget to include an important document in the final package.

Tender Package Builder is designed to reduce these mistakes by checking the uploaded documents against the tender requirements before generating the final submission package.

---

## 🚀 Main Features Done

### 1. Tender Requirements Loading

* Loads `requirements.json`
* Displays tender ID
* Tender title
* Procuring entity
* Bidder name
* Submission deadline
* Required documents sorted by their defined `order`

### 2. Multiple PDF Upload

* Upload multiple PDF files at once
* Displays uploaded filenames
* Displays page counts
* Allows individual files to be removed
* Rejects non-PDF files
* Handles invalid or unreadable PDF files with error messages
* Supports the defined maximum file limits

### 3. Document Matching

* Matches each uploaded PDF to a tender requirement
* One requirement can have only one matched file
* One uploaded file can be matched to only one requirement
* Allows users to change or undo a match
* Provides clear visual indication of matched and unmatched documents

### 4. Expiry Date Validation

For requirements where `has_expiry` is enabled:

* User can enter the document expiry date
* The system compares the expiry date with the tender submission deadline
* Expired documents are automatically identified
* A document expiring exactly on the submission deadline is considered valid

### 5. Requirement Status System

Each requirement has exactly one current status:

| Status                 | Meaning                                         |
| ---------------------- | ----------------------------------------------- |
| **Missing**            | Mandatory document has not been provided        |
| **Expiry Date Needed** | Document is matched but expiry date is required |
| **Expired**            | Document expires before the submission deadline |
| **Not Provided**       | Optional document was not provided              |
| **OK**                 | Requirement has been successfully satisfied     |

Blocking issues are clearly identified before package generation.

### 6. Exact Duplicate Detection

The application detects exact duplicate PDF files based on their actual file content rather than only their filenames.

Therefore, two identical PDFs with different filenames are still recognized as duplicates.

Duplicate documents cannot be incorrectly assigned to different requirements.

### 7. Package Validation

The **Generate Package** action remains unavailable while blocking issues exist.

The user must resolve all blocking requirements before generating the final package.

### 8. Automatic PDF Package Generation

The final package contains:

1. English cover page
2. Included tender documents
3. Documents arranged according to the requirement `order`
4. All pages of each original PDF in their original order
5. Footer on every page

Footer format:

`<Tender ID> | Page X of Y`

The final file is automatically named:

`<tender_id>_Package.pdf`

### 9. English / Bangla Interface

The application supports switching the interface between:

* English
* বাংলা

Document names use:

* `title_en` in English mode
* `title_bn` in Bangla mode

---

## ⭐ Bonus Features

The following additional features were considered/implemented where applicable:

* Automatic filename-based document matching
* Tender package review before generation
* PDF page counting
* Local browser processing
* Exact duplicate detection using SHA-256 hashing
* Responsive interface
* Clear validation feedback
* English/Bangla localization
* Error handling for invalid PDF files
* Professional document-processing workflow
* No participant-controlled backend or online document storage

---

## 🛠️ Technology Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* pdf-lib
* PDF.js
* Web Crypto API
* Browser File API

---

## 🔒 Privacy

The application is designed as a frontend-only application.

Tender documents are processed locally in the browser rather than being uploaded to a participant-controlled backend or database.

This helps keep sensitive tender documents on the user's device during the document preparation process.

---

## ▶️ How to Run the App

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_FOLDER>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The terminal will provide a local development URL, usually:

```text
http://localhost:5173
```

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

---

## 📋 Example Workflow

```text
Load Tender Requirements
        ↓
Upload PDF Documents
        ↓
Match Documents
        ↓
Enter Expiry Dates
        ↓
Validate Requirements
        ↓
Resolve Blocking Issues
        ↓
Review Package
        ↓
Generate Final PDF
        ↓
Download Tender Package
```

---

## 🤖 AI Tools Used

AI assistance was used during development for:

* Application architecture planning
* UI/UX design ideas
* React and TypeScript implementation assistance
* PDF processing logic
* Requirement validation logic
* Duplicate detection approach
* Error handling
* Debugging and troubleshooting
* README/documentation preparation
* Improving usability and bilingual interface design

### AI Tool

**Google AI Studio / Gemini**

AI was used as a development assistant. The final application logic, integration, testing, debugging, and project decisions were reviewed and adapted during development.

---

## 💡 Most Useful AI Prompt

The most useful prompt used during development was a detailed implementation prompt describing the complete tender workflow, validation rules, PDF generation rules, duplicate detection, bilingual interface, and browser-only processing requirements.

### Prompt

> Build a production-quality frontend-only Tender Package Builder using React, TypeScript, Vite, Tailwind CSS, pdf-lib, pdf.js, and the browser Web Crypto API.
>
> The application must load a requirements.json file containing tender information and an ordered list of required documents. Users must be able to upload multiple PDFs, see filenames and page counts, remove files, and match each uploaded PDF to exactly one requirement. Each requirement may have at most one document.
>
> Implement a centralized validation system with exactly these statuses: Missing, Expiry Date Needed, Expired, Not Provided, and OK.
>
> Mandatory requirements without a matched file must be Missing and block package generation. Optional requirements without a file must be Not Provided and must not block generation. If a matched requirement has has_expiry=true, require an expiry date. If the expiry date is before the tender submission deadline, mark it Expired and block generation. If the expiry date equals the deadline, mark it OK.
>
> Implement exact duplicate detection using SHA-256 hashing of the actual PDF file content so that identical PDFs with different filenames are still detected as duplicates. Do not allow duplicate files to satisfy different requirements.
>
> The Generate Package button must remain disabled while any blocking requirement exists.
>
> When generation is allowed, create one combined PDF using pdf-lib. The first page must be an English cover page containing the tender ID, tender title, procuring entity, bidder name, submission deadline, package creation date, and included documents in requirement order. Then append every matched document in the exact requirement order while preserving every original page and page order.
>
> Add a readable footer to every page, including the cover: "<tender_id> | Page X of Y". Ensure the footer never overlaps the original document content.
>
> The final file must automatically download as "<tender_id>_Package.pdf".
>
> Add a complete English/Bangla interface switch. Use title_en for English and title_bn for Bangla. The generated cover remains English.
>
> The application must process documents locally in the browser and must not require a backend, Firebase, Supabase, or online document storage.
>
> Make the interface feel like a professional enterprise/government document-processing application rather than a generic SaaS dashboard. Prioritize clarity, validation visibility, accessibility, responsive design, meaningful empty states, loading states, and clear error messages.
>
> Build the actual working application rather than only providing architecture or pseudocode. Test the complete workflow and resolve TypeScript/build errors before finishing.

---

## ⚠️ Known Problems

* The application currently depends on the browser environment for local PDF processing.
* Very large or severely damaged PDF files may take longer to process or may fail if the browser cannot parse them.
* Password-protected PDFs may not be readable by the application.
* PDF rendering and generation performance can depend on the user's device and browser.
* The live deployment may occasionally be affected by hosting or network availability.

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── layout/
│   ├── tender/
│   ├── upload/
│   ├── matching/
│   ├── review/
│   ├── package/
│   └── common/
│
├── hooks/
│   ├── useTender
│   ├── useDocuments
│   ├── useMatching
│   ├── useValidation
│   └── useLanguage
│
├── services/
│   ├── pdfService
│   ├── duplicateService
│   ├── validationService
│   └── packageService
│
├── types/
├── i18n/
├── utils/
└── App.tsx
```

---

## 🎯 Project Goal

The goal of Tender Package Builder is to make tender document preparation safer, faster, and easier by transforming a collection of PDF files into a validated, correctly ordered, submission-ready tender package.

Instead of manually checking dozens of documents, the user can rely on the application to identify missing documents, expiry problems, duplicates, and ordering issues before generating the final package.

---

## 📄 Competition Submission

**Project:** Tender Package Builder
**Participant:** Tasnia Tasnim
**Live Application:** https://tasnia-tasnim.vercel.app/
**Repository:** `<YOUR_PUBLIC_GITHUB_REPOSITORY_URL>`
