# Security Notes

This project is prepared for portfolio review. The public workflow export removes n8n credential objects and replaces live sheet/form identifiers with placeholders.

## Not Stored In This Repo

- OAuth client secrets.
- n8n credential IDs.
- API keys or bearer tokens.
- Wassenger API token.
- Private customer data.

## Included Implementation Reference

The connected Google Form owner link is included because it is part of the project reference:

https://docs.google.com/forms/d/1_AVbRMX2Zg6QNvDy--bsAelCtkCoHuaPF0LdmwLokok/edit

If this repository becomes public and the form should not be visible to reviewers, move that link to a private note and keep only a public form/demo link in the README.

## Before Publishing

- Confirm the Google Form link has the intended sharing permissions.
- Confirm the workbook does not contain real lead/customer data.
- Confirm any screenshot is redacted before upload.
- Re-scan workflow exports for tokens, OAuth IDs, and private URLs after every update.
