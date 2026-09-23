# Architecture

## Runtime split

```text
Google Sheets
   |\
   | \-- n8n: social metrics orchestrator -> platform collectors -> reporting sheets
   |
   \---- Apps Script: learner sync, reminders, campaigns, alerts, dashboard UI
```

## n8n social analytics

The daily orchestrator reads active accounts, computes a reporting date, and routes each account to a platform collector. Collector workflows call platform APIs and write normalized metrics to Google Sheets. Post discovery and master-sync workflows maintain content-level reporting. An error-monitoring workflow receives failures for operational review.

The exports are stored as inactive JSON files so they can be inspected without implying that credentials or production activation are present.

## Apps Script systems

- **Payment reminders:** reads a pending-payment sheet, applies date and amount eligibility rules, sends WhatsApp and email independently, and writes idempotent channel logs.
- **Voice Clarity:** retrieves learners into an intermediate sheet, then refreshes the master sheet with all-time usage and last login values from Graphy.
- **Voice scan alerts:** reacts to status columns and sends internal notifications while retaining row context.
- **Immediate campaigns:** accepts a webhook request, creates campaign and recipient records, queues delivery jobs, processes retries, and records logs.
- **Dashboard UI:** serves a spreadsheet-backed operational view through HTML service.

## Ownership boundary

n8n is the owner of social analytics orchestration. Apps Script is the owner of Google-native operational automations. Shared sheets are contracts, not an implicit permission to let either runtime mutate the other system's tables.
