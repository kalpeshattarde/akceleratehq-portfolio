# n8n AI Automations Portfolio

This repository contains portfolio-ready n8n automation projects. Each project is organized as a case study with a workflow export, implementation notes, setup guidance, supporting files, and a preview image.

## Projects

| # | Project | Summary | Main tools |
|---|---|---|---|
| 01 | [AKcelerateHQ Lead Generation Engine](01-akceleratehq-lead-generation-engine/README.md) | Google Form and Google Sheets intake automation that scores leads, generates proposal content, sends email/WhatsApp follow-ups, logs outcomes, and supports an inbound WhatsApp AI assistant. | n8n, Google Forms, Google Sheets, Gmail, OpenAI, Wassenger |

## Repository Standard

- Public workflow exports do not include OAuth credentials, API keys, or real n8n credential IDs.
- Each project includes a README, setup guide, security notes, workflow export, and relevant supporting artifacts.
- Project write-ups are written as technical portfolio case studies for recruiters and hiring teams.

## How To Review

Start with the project README, then inspect the workflow JSON under the project `workflows` folder. The workflow export is designed for review and import into n8n after replacing placeholders and connecting your own credentials.
