# Field Map

The workflow accepts stable internal field names and several Google Form label variants. For clean imports, use the normalized field names below.

## Input Fields

| Field | Purpose |
|---|---|
| `timestamp` | Submission timestamp from the form or sheet |
| `full_name` | Lead contact name |
| `work_email` | Primary email used for Gmail follow-up |
| `contact_no` | Phone or WhatsApp number, normalized by the workflow |
| `role_in_business` | Decision role or business role |
| `company_name` | Company name, required for processing |
| `website` | Optional company website |
| `industry` | Industry used for context and routing |
| `company_size` | Size signal for fit scoring |
| `monthly_revenue` | Revenue signal for fit scoring |
| `country` | Country or operating market |
| `tools_currently_use` | Current CRM, sheets, email, helpdesk, or reporting tools |
| `operation_today` | Description of current manual process |
| `biggest_pain` | Main operational pain points |
| `hours_lost_per_week` | Manual-work loss estimate |
| `team_ai_experience` | AI adoption readiness |
| `existing_automations` | Zapier, scripts, n8n, or other existing automation |
| `data_readiness` | Data quality and system readiness |
| `workflows_ai_handle` | Workflows the lead wants AI to handle |
| `desired_outcomes` | Expected business outcomes |
| `timeline` | Urgency signal |
| `budget` | Budget signal |
| `decision_authority` | Authority or buying-committee signal |
| `anything_else` | Constraints, integrations, or security requirements |
| `heard_about_us` | Attribution source |
| `processed` | Used to prevent repeat scoring |
| `status` | Current lead status |

## Output Fields

| Field | Purpose |
|---|---|
| `audit_score` | 0 to 100 AI audit score |
| `lead_category` | `Hot`, `Warm`, or `Cold` |
| `priority_reason` | Short reason for the score/category |
| `recommended_offer` | Suggested AKcelerateHQ offer |
| `recommended_workflow` | Suggested workflow type from the AI output |
| `next_action` | Recommended next step |
| `assigned_owner` | Internal owner |
| `call_status` | Discovery/manual/nurture call state |
| `proposal_status` | Proposal or qualification state |
| `n8n_sent` | Whether n8n completed the action path |
| `n8n_response` | Operational response or route note |
| `notes` | Internal notes and route reason |
| `updated_at` | Last workflow update timestamp |
