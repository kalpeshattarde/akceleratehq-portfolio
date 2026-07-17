# Demo Guide

## Review Flow

1. Open the project README and workflow screenshot.
2. Inspect `workflows/ai-candidate-screening-hr-ats.public.json`.
3. Review the workbook template and Google Form PDF reference.
4. Run the offline simulation script.
5. Compare generated outputs in `output-samples/`.

## What To Watch For

- Resume ingestion from the `Applications` sheet.
- Resume PDF download and text extraction.
- `Build AI Hiring Score Prompt` using role-specific criteria.
- `AI Agent - Score Candidate` with OpenRouter and a Structured Output Parser.
- Smart routing into interview, manual review, or HR approval before rejection.
- Calendar and Gmail interview scheduling path.
- Webhook-based AI interview transcript evaluation.
- Disabled optional WhatsApp nodes.
