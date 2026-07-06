# Security Notes

This project is prepared for public portfolio review. The workflow export is a credential-ready skeleton, not a live deployment export.

## Removed From The Public Workflow

- OAuth credential objects.
- n8n credential IDs and credential names.
- Live Google Sheet ID and cached Google Sheet URLs.
- n8n instance ID and workflow version ID.
- API keys, bearer tokens, and WhatsApp provider secrets.
- Real lead or customer data.

## Placeholder Values

The workflow intentionally keeps these placeholders:

```text
YOUR_GOOGLE_SHEET_ID
YOUR_OWNER_EMAIL
YOUR_WHATSAPP_PROVIDER_API
YOUR_WHATSAPP_PROVIDER_TOKEN
```

Replace them only in a private n8n instance or private environment file.

## WhatsApp Controls

The WhatsApp HTTP nodes are disabled in the public export. Before enabling them in a real environment, confirm:

- The lead has clearly consented to WhatsApp contact.
- The provider supports opt-out handling.
- Message templates comply with the provider and local regulations.
- Failed sends are logged for review instead of silently ignored.

## Before Publishing Updates

- Re-scan workflow JSON for `credentials`, private Google Sheet IDs, cached Google URLs, bearer tokens, and owner-only links.
- Confirm sample data is fictional.
- Confirm screenshots or diagrams do not expose live workspace URLs or account names.
- Keep the workflow inactive by default in exported public JSON.
