# Security Notes

This project is prepared for public portfolio review. The workflow export is a credential-ready skeleton, not a live deployment export.

## Removed From The Public Workflow

- OAuth credential objects.
- n8n credential IDs and credential names.
- Live Google Sheet IDs and cached Google Sheet URLs.
- n8n instance ID and workflow version ID.
- OpenRouter and OpenAI API keys.
- WhatsApp provider secrets.
- Private HR destination email addresses.
- Real candidate data.

## Placeholder Values

The workflow intentionally keeps these placeholders:

```text
YOUR_HIRING_GOOGLE_SHEET_ID
YOUR_INTERVIEW_EVALUATION_SHEET_ID
YOUR_HR_EMAIL
YOUR_WHATSAPP_PROVIDER_API
YOUR_WHATSAPP_PROVIDER_TOKEN
```

Replace them only in a private n8n instance or private environment file.

## Candidate Data Controls

- Do not commit real resumes, phone numbers, salary expectations, or interview transcripts.
- Use fictional sample candidates in public files.
- Keep resume Drive links private unless they point to explicit demo files.
- Avoid screening on protected attributes such as age, gender, religion, caste, photo, marital status, or personal background.
- Keep HR approval before rejection for weak candidates.

## WhatsApp Controls

The WhatsApp HTTP nodes are disabled in the public export. Before enabling them in a real environment, confirm:

- The candidate opted in to WhatsApp contact.
- The provider supports opt-out handling.
- Message templates comply with provider and local requirements.
- Failed sends are logged for HR review.

## Before Publishing Updates

- Re-scan workflow JSON for `credentials`, live sheet IDs, cached Google URLs, bearer tokens, and private emails.
- Confirm workbook and CSV data are fictional.
- Confirm screenshots do not expose live candidate records.
- Keep the workflow inactive by default in exported public JSON.
