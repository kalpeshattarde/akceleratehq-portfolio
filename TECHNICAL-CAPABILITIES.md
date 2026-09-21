# Technical Capabilities

The labels below keep repository evidence separate from general delivery capability.

| Capability | Evidence in this repository | Classification |
|---|---|---|
| n8n workflow design | Multiple exported workflows with webhooks, schedules, switches, code nodes, and service nodes | Demonstrated in repository |
| Webhooks and event-driven flows | Intake and messaging webhooks in AgencyOS, MedFlow, RestoFlow, and ZedProp | Demonstrated in repository; deployment validation required |
| API integration | HTTP Request nodes for AI, search, enrichment, insurance, weather, PDF, and messaging APIs | Demonstrated in repository; credentials and contracts require validation |
| AI/LLM orchestration | OpenAI and Anthropic HTTP calls, classification/drafting descriptions, and routing logic | Demonstrated in repository; evaluation evidence required |
| Structured data processing | JavaScript parsing, field mapping, conditionals, switches, and Airtable operations | Demonstrated in repository |
| Google Workspace and Apps Script | Gmail and Google Calendar nodes; no complete Apps Script project is present | Partly demonstrated; additional implementation may be required |
| WhatsApp communication | WhatsApp-oriented flows and API references in RestoFlow and ZedProp | Demonstrated as workflow design; channel verification required |
| CRM and database integrations | Airtable nodes and documented schemas across projects | Demonstrated in repository; schema and access review required |
| Validation and deduplication | Intake validation and duplicate-check nodes in several workflows | Demonstrated in repository; edge-case testing required |
| Error handling and monitoring | Error Trigger nodes and Slack/logging patterns appear in exports | Partly demonstrated; operational monitoring requires implementation and verification |
| Reporting and dashboards | Scheduled summaries, Slack/email reports, and data aggregation patterns | Demonstrated as workflow concepts; metric validation required |
| Production operations, compliance, and support | Not proven by exported JSON alone | Requires additional implementation and evidence |

[Delivery proof](docs/DELIVERY-PROOF.md) · [Quality standards](docs/WORKFLOW-QUALITY-STANDARDS.md)
