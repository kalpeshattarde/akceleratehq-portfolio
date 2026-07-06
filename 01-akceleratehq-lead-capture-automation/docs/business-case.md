# Business Case

## Problem

Small service businesses often receive automation-audit requests through forms or spreadsheets, then manually review each submission to decide who deserves immediate follow-up. That creates slow response times, inconsistent qualification, and missed high-intent prospects.

## Solution

This n8n workflow turns the intake sheet into a lightweight AI-assisted CRM queue:

- New rows are normalized and filtered for required fields.
- The AI scoring prompt evaluates pain, automation fit, budget, urgency, authority, data readiness, and company fit.
- Structured output keeps the score, category, summary, and recommended offer machine-readable.
- Sheet updates create a single operational record.
- Hot leads are routed to a discovery call.
- Warm leads are sent to owner review and qualification.
- Cold leads receive nurture follow-up.

## Business Value

- Faster response for high-intent prospects.
- Less manual review time for the owner.
- More consistent scoring than ad hoc spreadsheet review.
- Clear status tracking in the same Google Sheet the business already uses.
- Safer escalation because uncertain leads route to manual review instead of automatic booking.

## What This Proves For An AI Automation Engineer Role

- Ability to design real business workflows instead of isolated demos.
- Practical use of n8n triggers, Code nodes, AI Agent nodes, structured output parsing, Gmail, Google Sheets, and Google Calendar.
- Awareness of consent, credential safety, disabled optional channels, and human review paths.
- Ability to provide mock data and offline validation so reviewers can inspect logic without API access.

## Current Scope And Limits

This public repository provides a sanitized workflow export and local simulation. Production hardening would add a dedicated n8n error workflow, retry policies, dead-letter logging, monitoring, opt-out management, and environment-specific credentials.
