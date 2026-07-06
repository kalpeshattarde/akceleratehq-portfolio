# Setup Guide

This guide explains how to run the AKcelerateHQ Lead Capture Automation after importing the public workflow export into n8n.

## 1. Import Workflow

Import this file into n8n:

`01-akceleratehq-lead-capture-automation/workflows/akceleratehq-lead-capture-automation.public.json`

Keep the workflow inactive until every credential, sheet ID, owner email, and optional WhatsApp setting is configured.

## 2. Prepare The Google Sheet

Create or copy a workbook with an `Audit Leads` tab. The workbook template in this project is a sanitized reference:

`docs/akceleratehq-automation-audit-crm-template.public.xlsx`

The workflow can read either normalized field names or the longer Google Form labels. See `docs/field-map.md` for the full field list.

Minimum required input fields:

- `full_name`
- `work_email`
- `company_name`

Recommended input fields for useful scoring:

- `contact_no`
- `role_in_business`
- `industry`
- `company_size`
- `monthly_revenue`
- `tools_currently_use`
- `operation_today`
- `biggest_pain`
- `hours_lost_per_week`
- `team_ai_experience`
- `existing_automations`
- `data_readiness`
- `workflows_ai_handle`
- `desired_outcomes`
- `timeline`
- `budget`
- `decision_authority`
- `anything_else`

Important output fields:

- `processed`
- `status`
- `audit_score`
- `lead_category`
- `priority_reason`
- `recommended_offer`
- `next_action`
- `assigned_owner`
- `call_status`
- `proposal_status`
- `n8n_sent`
- `n8n_response`
- `notes`
- `updated_at`

## 3. Configure n8n Credentials

Connect these credentials inside n8n:

- Google Sheets OAuth credential for the `Audit Leads` sheet trigger, read, and update nodes.
- Gmail OAuth credential for lead confirmation, discovery, qualification, nurture, and owner review emails.
- Google Calendar OAuth credential for hot-lead discovery calls.
- OpenAI credential for the AI Agent scoring path.
- Optional WhatsApp provider token for the disabled HTTP Request nodes.

## 4. Replace Placeholders

Search the workflow for these values and replace them:

```text
YOUR_GOOGLE_SHEET_ID
YOUR_OWNER_EMAIL
YOUR_WHATSAPP_PROVIDER_API
YOUR_WHATSAPP_PROVIDER_TOKEN
```

The public export intentionally removes n8n credential objects. After import, choose the correct credential from each n8n node credential dropdown.

## 5. Test In n8n

1. Add a mock row to `Audit Leads`.
2. Execute the Google Sheets trigger path manually.
3. Confirm the normalize node emits a row with stable fields such as `full_name`, `work_email`, `company_name`, and `contact_no`.
4. Confirm the AI Agent returns structured JSON through the output parser.
5. Confirm `Parse AI Audit Score` writes `audit_score`, `lead_category`, `recommended_offer`, and `next_action`.
6. Confirm `Update Sheet - AI Scored` updates the same row.
7. Run the scheduled routing path manually and verify the route is one of `discovery_call`, `manual_review`, or `nurture`.
8. Keep WhatsApp nodes disabled until provider credentials, consent language, and opt-out handling are configured.

## 6. Validate Offline Logic

The local simulation does not require external APIs:

```bash
python 01-akceleratehq-lead-capture-automation/scripts/simulate_lead_routing.py
```

If your terminal is already inside the project folder, use:

```bash
python scripts/simulate_lead_routing.py
```

Use this to review the scoring/routing logic quickly before connecting n8n credentials.
