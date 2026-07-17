# n8n AI Automations Portfolio

Project-centric portfolio of AI automation workflows built for business review. Each project folder contains its own workflow export, setup notes, security notes, sample data, and offline validation assets.

## Projects

| # | Project | Business value | Main tools | Demo |
|---|---|---|---|---|
| 01 | [AKcelerateHQ Lead Capture Automation](01-akceleratehq-lead-capture-automation/README.md) | Scores automation-audit leads, confirms receipt, and routes each lead to discovery, manual review, or nurture follow-up based on score and form context. | n8n, Google Sheets, Gmail, Google Calendar, OpenRouter, optional WhatsApp provider | [Loom demo](https://www.loom.com/share/7a2b5bc245ad4109b7e8fc2a329a2079) |
| 02 | [AI Candidate Screening HR + ATS](02-ai-candidate-screening-hr-ats/README.md) | Screens AI automation applicants from a hiring sheet, scores resume fit, routes candidates to interview/manual review/HR approval, and evaluates AI interview transcripts. | n8n, Google Sheets, Google Drive, Gmail, Google Calendar, OpenRouter, OpenAI, optional WhatsApp provider | [Workflow screenshot](02-ai-candidate-screening-hr-ats/assets/workflow-preview.png) |

## Repository Standard

- Public workflow exports remove OAuth credentials, API keys, private sheet IDs, and live n8n credential IDs.
- Project documentation is written as a case study: business problem, workflow behavior, setup, security, and validation.
- Offline scripts use mock/sample data and standard library code so reviewers can inspect logic without external API access.
- API-dependent n8n workflows are clearly labeled as credential-ready public exports, not claimed as production deployments.

## How To Review

Start with the project README, inspect the sanitized workflow JSON under the project `workflows` folder, then run the local simulation script listed in the project README. The workflow export is designed for n8n import after replacing placeholders and connecting your own credentials.
