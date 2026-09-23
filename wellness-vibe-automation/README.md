# Wellness Vibe Automation

Portfolio case study for a collection of Google Sheets, Google Apps Script, and n8n automations supporting learner operations, payment reminders, voice-scan follow-up, campaigns, and social-media reporting.

The public implementation is intentionally split by runtime:

- `n8n/` contains inactive, sanitized workflow exports for the social analytics system.
- `apps-script/` contains sanitized Google Apps Script source grouped by business function.
- `docs/` contains architecture, setup, field, security, operations, and demo notes.

## Business Systems

| System | Runtime | Primary outcome | Evidence status |
|---|---|---|---|
| Social analytics dashboard | n8n plus Google Sheets | Collect platform metrics, discover posts, sync a reporting master, and monitor failures. | Workflow export; validation required |
| Mentorship payment reminders | Google Apps Script | Send scheduled WhatsApp and email reminders with channel-level duplicate protection. | Implementation source; provider validation required |
| Voice Clarity learner operations | Google Apps Script plus Graphy API | Retrieve learners, synchronize all-time usage and last-login data, and retain sync failures. | Implementation source; API validation required |
| Voice-scan internal alerts | Google Apps Script | Monitor voice-scan status fields and notify internal owners. | Implementation source; validation required |
| Immediate campaign system | Google Apps Script | Accept campaign requests, queue recipients, process delivery jobs, and record retry-safe logs. | Implementation source; validation required |
| Social dashboard UI | Google Apps Script HTML service | Present spreadsheet-backed reporting data for operational review. | Test dashboard source; validation required |

## Architecture

Google Sheets is the shared operational boundary. n8n owns scheduled social analytics orchestration and platform collection. Apps Script owns Google-native triggers, Graphy synchronization, payment reminders, campaign queues, email, and sheet-level logging.

See [architecture.md](docs/architecture.md) and [integration-boundaries.md](docs/integration-boundaries.md).

## Files

- [n8n workflow exports](n8n/)
- [Apps Script implementations](apps-script/)
- [Setup guide](docs/setup-guide.md)
- [Field map](docs/field-map.md)
- [Security notes](docs/security-notes.md)
- [Operations and error handling](docs/operations-and-error-handling.md)
- [Demo guide](docs/demo-guide.md)

## Public Safety

The files in this folder are sanitized review copies. Credentials, spreadsheet IDs, payment links, provider URLs, recipient data, and contact details are replaced with placeholders. The exports are inactive and do not prove live execution, delivery, production deployment, or business outcomes.
