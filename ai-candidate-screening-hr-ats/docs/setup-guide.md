# Setup Guide

This guide explains how to run the AI Candidate Screening HR + ATS workflow after importing the public workflow export into n8n.

## 1. Import Workflow

Import this file into n8n:

`02-ai-candidate-screening-hr-ats/workflows/ai-candidate-screening-hr-ats.public.json`

Keep the workflow inactive until credentials, sheet IDs, HR email, and optional WhatsApp settings are configured.

## 2. Prepare Google Sheets

Use the sanitized workbook template:

`docs/ai-automation-hiring-template.public.xlsx`

Required workbook tabs:

- `Applications`
- `Jobs`
- `Screening Criteria`
- `Routing Rules`
- `Interview Slots`
- `Dashboard`
- `Lookups`

The interview evaluator path appends to a separate evaluation sheet. The public export uses:

- Spreadsheet placeholder: `YOUR_INTERVIEW_EVALUATION_SHEET_ID`
- Tab: `Sheet1`

## 3. Prepare Candidate Intake

Use the exported form reference:

`docs/ai-automation-hiring-application-form.pdf`

For a live setup, connect a Google Form to the workbook and map responses into the normalized `Applications` columns documented in `docs/field-map.md`.

## 4. Configure n8n Credentials

Connect these credentials inside n8n:

- Google Sheets OAuth credential for reading and updating candidate rows.
- Google Drive OAuth credential for downloading resume PDFs.
- Gmail OAuth credential for candidate and HR emails.
- Google Calendar OAuth credential for interview scheduling.
- OpenRouter credential for the resume-screening AI Agent.
- OpenAI credential for the AI interview transcript evaluator.
- Optional WhatsApp provider token for disabled HTTP Request nodes.

## 5. Replace Placeholders

Search the workflow for these values and replace them:

```text
YOUR_HIRING_GOOGLE_SHEET_ID
YOUR_INTERVIEW_EVALUATION_SHEET_ID
YOUR_HR_EMAIL
YOUR_WHATSAPP_PROVIDER_API
YOUR_WHATSAPP_PROVIDER_TOKEN
```

The public export intentionally removes n8n credential objects. After import, select the correct credential from each node credential dropdown.

## 6. Test Resume Screening

1. Add a mock candidate row to `Applications`.
2. Confirm the row has `full_name`, `email`, `whatsapp_number`, and `resume_link`.
3. Execute the resume ingestion path manually.
4. Confirm `Download Resume PDF` can access the Google Drive PDF.
5. Confirm `Extract Resume Text` returns usable text.
6. Confirm `AI Agent - Score Candidate` returns structured JSON through the output parser.
7. Confirm `Parse AI Hiring Score` writes `ai_score`, `ai_category`, and `recommended_action`.
8. Confirm `Update Sheet - AI Scored` updates the same candidate row.

## 7. Test Smart Routing

Run the routing path manually and verify:

- `Strong` candidates route to interview scheduling.
- `Average` candidates route to HR manual review.
- `Weak` candidates route to `Rejection Pending HR Approval`.
- No rejection email is sent automatically.

## 8. Test Interview Evaluation

Post a mock transcript payload to the `final_report` webhook in a private n8n test environment. Confirm the evaluator appends:

- `Name`
- `Exp`
- `Easy(15)`
- `Medium(24)`
- `Hard(40)`
- `Total(80)`
- `Recomendation`

## 9. Validate Offline Logic

The local simulation does not require external APIs:

```bash
python 02-ai-candidate-screening-hr-ats/scripts/simulate_candidate_screening.py
```
