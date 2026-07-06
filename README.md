# n8n AI Automations Portfolio

Project-centric portfolio of AI automation workflows built for business review. Each project folder contains its own workflow export, setup notes, security notes, sample data, and offline validation assets.

## Projects

| # | Project | Business value | Main tools |
|---|---|---|---|
| 01 | [AKcelerateHQ Lead Capture Automation](01-akceleratehq-lead-capture-automation/README.md) | Scores automation-audit leads, confirms receipt, and routes each lead to discovery, manual review, or nurture follow-up based on score and form context. | n8n, Google Sheets, Gmail, Google Calendar, OpenAI, optional WhatsApp provider |

## Repository Standard

- Public workflow exports remove OAuth credentials, API keys, private sheet IDs, and live n8n credential IDs.
- Project documentation is written as a case study: business problem, workflow behavior, setup, security, and validation.
- Offline scripts use mock/sample data and standard library code so reviewers can inspect logic without external API access.
- API-dependent n8n workflows are clearly labeled as credential-ready public exports, not claimed as production deployments.

## How To Review

Start with the project README, inspect the sanitized workflow JSON under the project `workflows` folder, then run the local simulation script listed in the project README. The workflow export is designed for n8n import after replacing placeholders and connecting your own credentials.
