# Integration Boundaries

| Boundary | Owner | Contract |
|---|---|---|
| Google Sheets to n8n | n8n | Account, date, platform, metrics, post, and run-status fields |
| Google Sheets to Apps Script | Apps Script | Sheet names, headers, row status, trigger ownership, and log schemas |
| Apps Script to Graphy | Voice Clarity sync | Learner ID, product ID, usage snapshot, last login, and failure fallback |
| Apps Script to WhatsApp provider | Reminders and campaigns | Template name, recipient, variables, provider response, and delivery status |
| Apps Script to Gmail | Reminders and campaigns | Recipient, subject, rendered body, sender identity, and reply-to configuration |
| n8n to platform APIs | Social collectors | Account credential, platform identifier, reporting date, pagination, and rate-limit behavior |

Each boundary requires explicit credentials, least-privilege access, timeout behavior, retry policy, and an owner for failed records. A successful HTTP response is not automatically proof of user delivery or business completion.
