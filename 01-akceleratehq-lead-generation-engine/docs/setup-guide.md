# Setup Guide

This guide explains how to run the AKcelerateHQ Lead Generation Engine after importing the public workflow export into n8n.

## 1. Import Workflow

Import this file into n8n:

`01-akceleratehq-lead-generation-engine/workflows/akceleratehq-lead-generation-engine.public.json`

Keep the workflow inactive until all credentials and placeholders are configured.

## 2. Connect Google Form And Sheet

Connected form configuration:

https://docs.google.com/forms/d/1_AVbRMX2Zg6QNvDy--bsAelCtkCoHuaPF0LdmwLokok/edit

Use the form response spreadsheet as the source for the Google Sheets Trigger node.

Required tabs:

- `Form responses 1` or the actual response tab name used by the connected form.
- `Proposal Log` for generated proposal and follow-up status.

## 3. Configure n8n Credentials

Connect these credentials inside n8n:

- Google Sheets OAuth credential for the form response sheet.
- Gmail OAuth credential for proposal emails and internal alerts.
- OpenAI credential for the WhatsApp assistant model.
- WhatsApp provider API token for Wassenger HTTP request nodes.

## 4. Replace Placeholders

Search the workflow for these values and replace them:

```text
YOUR_GOOGLE_SHEET_ID
YOUR_GOOGLE_FORM_ID
YOUR_GOOGLE_ACCOUNT_ID
PASTE_WASSENGER_API_TOKEN_HERE
```

If using a different WhatsApp provider, replace only the HTTP request nodes and keep the rest of the routing logic.

## 5. Test Flow

1. Submit one test response through the Google Form.
2. Confirm n8n receives the new row from Google Sheets.
3. Verify the Code node outputs `lead_score`, `lead_type`, `recommended_package`, `email_html`, and `whatsapp_message`.
4. Confirm email and WhatsApp branches only run when contact details exist.
5. Confirm the proposal log is updated.
6. Activate the workflow after the test run is clean.
