# Setup Guide

This guide describes a review or staging setup. Do not connect production credentials to the public exports.

## n8n

1. Import the required JSON from `n8n/` into a non-production n8n instance.
2. Keep every workflow inactive until credentials, account scope, rate limits, and destination sheets are reviewed.
3. Create separate credentials for Google Sheets and each social platform.
4. Replace redacted spreadsheet and credential references with staging values.
5. Test one platform and one reporting date before enabling the orchestrator.
6. Confirm collector output, duplicate behavior, and failure notifications.

## Apps Script

1. Create one Apps Script project per folder under `apps-script/`, or merge modules only when their sheet contracts are intentionally shared.
2. Bind each project to a staging spreadsheet and create the documented tabs.
3. Store provider URLs, API keys, channel IDs, email settings, and timezone values in Script Properties.
4. Run setup functions manually once, review generated triggers, and remove duplicate triggers before testing.
5. Use dry-run or test rows before enabling WhatsApp, email, or campaign delivery.
6. Review execution logs and failure sheets after each test batch.

## Required staging checks

- Use fictional recipients and synthetic learner records.
- Verify timezone and date behavior in `Asia/Kolkata`.
- Confirm provider acceptance is not treated as confirmed delivery.
- Confirm all credentials can be revoked independently.
- Document the sheet owner, trigger owner, escalation owner, and rollback procedure.
