# Business Case

## Problem

AI automation hiring produces noisy applicant pipelines. Strong candidates may mention n8n, RAG, APIs, deployment, and business outcomes in different places across forms, resumes, portfolios, and interviews. Manual review is slow, and automatic rejection creates risk when the model is uncertain.

## Solution

This workflow turns a hiring sheet into an AI-assisted ATS queue:

- Candidate rows are normalized and deduplicated.
- Resume PDFs are downloaded and converted to text.
- The AI screening prompt evaluates role fit using weighted criteria.
- Structured output stores score, category, strengths, weaknesses, risk flags, and interview questions.
- Strong candidates are scheduled for interview.
- Average candidates go to HR manual review.
- Weak candidates require HR approval before rejection.
- AI interview transcripts are parsed and scored into a separate evaluation sheet.

## Business Value

- Faster shortlisting for high-fit AI automation candidates.
- More consistent screening criteria than ad hoc resume review.
- Clear audit trail in the `Applications` sheet.
- Human oversight before rejection decisions.
- Interview feedback stored in a structured format for comparison.

## What This Proves For An AI Automation Engineer Role

- Ability to design a multi-stage HR workflow with ingestion, AI scoring, routing, calendar, email, and webhook evaluation.
- Practical use of n8n Schedule Trigger, Google Sheets, Google Drive, Extract From File, AI Agent, OpenRouter, OpenAI, Gmail, Google Calendar, Switch, and Webhook nodes.
- Awareness of candidate-data privacy, human approval, model-risk limits, and disabled optional messaging channels.
- Ability to provide mock data and offline validation so reviewers can inspect logic without API access.

## Current Scope And Limits

This public repository provides a sanitized workflow export, workbook template, form PDF reference, and local simulation. Production hardening would add dedicated error logging, retry policies, dead-letter queues, HR audit reporting, role-specific scoring calibration, and consent/retention controls.
