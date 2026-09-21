# Operations And Error Handling

## Existing Controls In The Workflow

- Rows already marked as processed or routed are skipped.
- Candidate rows missing name, email, WhatsApp number, or resume link are not screened.
- WhatsApp numbers are normalized before optional messages.
- Resume text extraction happens before AI scoring so the model receives candidate evidence.
- The AI Agent uses a Structured Output Parser for predictable screening JSON.
- Score parsing falls back to category thresholds when the model omits category.
- Weak candidates are routed to HR approval before rejection.
- Optional WhatsApp nodes are disabled in the public workflow.
- The interview evaluator appends structured results instead of sending automatic decisions.

## Human Approval Points

| Situation | Control |
|---|---|
| Average candidate | HR manual review |
| Weak candidate | HR approval before rejection |
| Resume/project claims | Risk flags and interview questions for verification |
| WhatsApp messaging | Disabled until provider and consent controls are configured |
| Final hiring/rejection decision | Remains outside the automation |

## Production Hardening Plan

For a live deployment, add:

- n8n global error workflow with workflow name, node name, execution URL, email, and error message.
- `Workflow Errors` tab for dead-letter logging.
- Retry/backoff on Google Drive, Extract From File, OpenRouter, OpenAI, Gmail, Calendar, and HTTP Request nodes.
- Idempotency key based on candidate email and resume link.
- HR alert when scoring succeeds but sheet update fails.
- HR alert when Calendar event creation succeeds but email send fails.
- Daily reconciliation report for candidates stuck in `Scored`, `Manual Review`, or `Rejection Pending HR Approval`.
- Role-specific scoring calibration by job role.
- Data retention policy for resumes and interview transcripts.
