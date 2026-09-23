# Operations And Error Handling

## Common controls

- Use a lock or job lease to prevent concurrent processing.
- Give every run, campaign, and outbound channel action a traceable identifier.
- Keep successful and ambiguous sends protected from automatic duplicate delivery.
- Isolate row-level failures so later records can continue.
- Preserve the previous learner master value when a usage API fails rather than writing zero.
- Retry only transient API failures and cap attempts.
- Keep provider acceptance separate from confirmed delivery.

## Review queues

Operations should review failed records, ambiguous provider responses, stale job leases, missing credentials, invalid recipient fields, rate-limit responses, and mismatched sheet headers. A manual re-run must be deliberate and must not bypass idempotency controls.

## Recovery

Pause the relevant trigger or workflow, capture the run ID and failing payload shape without copying sensitive values, correct the configuration or source row, and replay only records whose idempotency state allows replay. Verify logs and downstream sheets after recovery.
