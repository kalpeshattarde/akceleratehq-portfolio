# Security Notes

The public copies are sanitized review artifacts. They must not be connected directly to production systems.

- Store secrets in n8n credentials or Google Apps Script Properties, never in workflow JSON, source, sample data, or README files.
- Replace all redacted spreadsheet IDs, provider URLs, payment links, channel IDs, and contact details with staging values.
- Use fictional names, phones, emails, learner IDs, and payment records for demos.
- Limit Google Sheets, Graphy, social platform, Gmail, and WhatsApp permissions to the smallest required scope.
- Treat learner, payment, communication, and voice-scan data as sensitive operational data.
- Configure retention and deletion rules for logs and failed records.
- Require consent and opt-out handling before communication delivery.
- Review webhook authentication, replay protection, request IDs, and rate limits before deployment.
- Revoke and rotate any credential that has appeared in a working copy or shared export.

Status labels in this repository describe the evidence available here. They do not certify compliance, security, delivery, or production readiness.
