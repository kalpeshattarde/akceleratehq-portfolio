# Field Map

## Social analytics

| Contract | Representative fields |
|---|---|
| Account master | account identifier, platform, active flag, timezone, page/channel identifier |
| Daily metrics | reporting date, account identifier, platform, followers, reach, impressions, engagement, video views |
| Post master | post identifier, published timestamp, platform, caption/title, permalink, engagement metrics |
| Run metadata | run identifier, target date, status, started timestamp, completed timestamp, error |

## Payment reminders

The source sheet is `Pending Payment Reminder - Auto`. The documented source fields are client name, phone, email, client ID, program name, latest payment date, program price, received amount, and pending amount. The log contract records reminder date, reminder number, channel, idempotency key, provider result, status, and error context.

## Voice Clarity

The retrieval output feeds `Voice Clarity Track Users - Retrieved`. The master includes product ID, learner ID, customer identity, contact fields, active state, assignment dates, progress, completion, total seconds, total hours, total days, last login, and last sync. Sync logs and failed-record sheets retain execution-level diagnostics.

## Immediate campaigns

The campaign project uses `Campaigns`, `Campaign Recipients`, `Campaign Jobs`, `Execution Logs`, and `Settings`. Jobs move through queued, processing, submitted, completed, failed, and skipped states. Request IDs and campaign IDs provide traceability.

Exact production column names and provider payload mappings must be confirmed in staging before deployment.
