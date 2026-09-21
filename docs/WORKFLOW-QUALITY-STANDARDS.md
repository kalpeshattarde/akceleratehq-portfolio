# Workflow Quality Standards

[Portfolio home](../README.md) · [Projects index](../PROJECTS.md) · [Security and reliability](../SECURITY-AND-RELIABILITY.md)

These standards guide workflow design and review across the portfolio.

## Design and data

- Name triggers, actions, inputs, outputs, and state clearly
- Separate deterministic rules from AI-assisted behavior
- Validate inputs and handle missing, duplicate, and malformed records
- Keep irreversible or sensitive actions behind an approval gate
- Document assumptions, field mappings, and integration boundaries

## Reliability and security

- Define timeout, retry, rate-limit, permission, and vendor-error behavior
- Make partial failures and escalation ownership observable
- Store secrets in the platform credential manager
- Apply least-privilege access and protect sensitive data
- Keep public demo content separate from production data

## Testing and handover

- Test representative success and failure scenarios
- Review generated outputs against realistic examples
- Record known gaps, limitations, and operational risks
- Provide runbooks, support ownership, monitoring, and rollback guidance
- Preserve evidence of validation and stakeholder acceptance

A quality workflow is traceable, explainable, safe, and operable.

[Back to portfolio home](../README.md)
