# Security and Reliability

This document defines the controls that should govern an automation delivery. Describing a control does not mean that every portfolio export implements it.

## Observed in the Repository

- Workflow exports use n8n credential references and include placeholder values rather than complete production secrets in many HTTP nodes.
- Several workflows include input parsing, conditional routing, Airtable state operations, and error-trigger nodes.
- ZedProp includes a webhook verification branch in its message parser, and multiple projects include human-review descriptions or branches.
- The repository contains hardcoded-looking base, table, document, and channel identifiers that should be reviewed before public distribution.

These observations are implementation evidence, not a security or compliance certification.

## Required Before Production

- Store all secrets in n8n credentials or an approved secret manager; rotate anything that may have been exposed.
- Apply least-privilege access and separate development, test, and production credentials.
- Minimise sensitive data, define retention, and document data processors and access owners.
- Validate webhook signatures, request origin, input shape, and replay behavior for every channel.
- Add idempotency keys and duplicate handling for every retried or replayed event.
- Define timeout, retry, backoff, rate-limit, and partial-failure behavior per provider.
- Log correlation IDs, outcomes, and safe metadata without copying unnecessary sensitive payloads.
- Require human approval for clinical, financial, contractual, public-facing, or irreversible actions.
- Test recovery, backup, rollback, credential rotation, and alert escalation with named owners.
- Review applicable legal and regulatory requirements with qualified advisers. No HIPAA, GDPR, SOC 2, or other compliance status is claimed here.

## Review Standard

A workflow is ready for production only when its credentials, data handling, success paths, failure paths, duplicate behavior, monitoring, access model, test evidence, and handover procedure have been reviewed for the specific environment.

[Implementation readiness](docs/IMPLEMENTATION-READINESS.md) · [Workflow quality standards](docs/WORKFLOW-QUALITY-STANDARDS.md)
