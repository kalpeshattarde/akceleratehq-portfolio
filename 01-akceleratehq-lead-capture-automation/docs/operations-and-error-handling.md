# Operations And Error Handling

## Existing Controls In The Workflow

- Rows marked as already processed or already routed are skipped to reduce duplicate sends.
- Required fields are checked before AI scoring.
- Consent is checked when the source row includes a consent field.
- WhatsApp numbers are normalized before optional message sends.
- The AI Agent uses a Structured Output Parser so downstream nodes receive predictable JSON.
- Score parsing includes fallback handling when the model response is wrapped as text.
- Lead routes are constrained to `discovery_call`, `manual_review`, and `nurture`.
- Warm or ambiguous leads are sent to owner review instead of being automatically booked.
- Optional WhatsApp nodes are disabled in the public workflow.

## Human Approval Points

| Situation | Control |
|---|---|
| Medium score or unclear fit | Route to `Manual Review` |
| Low authority or unclear budget | Owner review before proposal work |
| Optional WhatsApp messaging | Disabled until provider and consent controls are configured |
| Proposal work | Sheet status moves to `Prepare Draft` or `Wait for Qualification` rather than auto-sending a proposal |

## Production Hardening Plan

For a live deployment, add:

- n8n global error workflow that captures workflow name, node name, execution URL, row number, and error message.
- `Workflow Errors` sheet tab for dead-letter logging.
- Retry/backoff on Gmail, Calendar, OpenAI, and HTTP Request nodes.
- Idempotency key based on sheet row number plus work email.
- Owner alert when scoring succeeds but sheet update fails.
- Owner alert when Calendar event creation succeeds but the email send fails.
- Opt-out and quiet-hours checks before enabling WhatsApp sends.
- Daily reconciliation job that reports leads stuck in `Scored` or `Manual Review`.
