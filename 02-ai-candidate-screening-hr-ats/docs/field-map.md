# Field Map

Use these normalized column names in the `Applications` sheet.

## Application Input Fields

| Field | Purpose |
|---|---|
| `timestamp` | Application submission timestamp |
| `full_name` | Candidate name |
| `email` | Candidate email and sheet matching key |
| `whatsapp_number` | WhatsApp number for optional messaging |
| `phone` | Backup phone field |
| `city_state` | Candidate location context, not used for score |
| `linkedin_url` | Candidate LinkedIn profile |
| `portfolio_url` | Portfolio or demo URL |
| `github_url` | GitHub URL |
| `resume_link` | Google Drive PDF link used by the Drive download node |
| `job_role` | Role applied for |
| `experience_years` | Years of experience |
| `notice_period` | Availability signal |
| `expected_salary_or_charges` | Compensation expectation |
| `employment_type` | Full-time, remote, freelance, or project |
| `skills_checklist` | Skills self-reported by candidate |
| `has_n8n_production` | Production n8n experience signal |
| `has_local_llm_rag` | RAG/local LLM signal |
| `automation_built_end_to_end` | Project evidence |
| `automation_outcome` | Business outcome evidence |
| `client_industries` | Domain exposure |
| `comfortable_presenting_to_founder_md` | Founder-facing communication signal |
| `whatsapp_opt_in` | Consent signal for optional WhatsApp path |
| `source_post` | Application source |
| `processed` | Used to skip already-screened rows |
| `status` | Current ATS state |

## AI Screening Output Fields

| Field | Purpose |
|---|---|
| `ai_score` | 0 to 100 candidate fit score |
| `ai_category` | `Strong`, `Average`, or `Weak` |
| `ai_summary` | Short candidate summary |
| `strengths` | Evidence supporting the score |
| `weaknesses` | Gaps to verify |
| `recommended_action` | `Interview`, `Manual Review`, or `HR Approval Before Rejection` |
| `risk_flags` | Claims or concerns HR should verify |
| `interview_questions` | Suggested follow-up questions |
| `updated_at` | Last workflow update timestamp |

## Routing Statuses

| Status | Meaning |
|---|---|
| `Scored` | AI screening completed, not routed yet |
| `Interview Scheduled` | Calendar and email interview path completed |
| `Manual Review` | HR needs to review manually |
| `Rejection Pending HR Approval` | Candidate should not be rejected until HR approves |
| `Rejected` | Final HR-approved rejection |
| `Hired` | Final hiring outcome |
| `On Hold` | Candidate parked for later review |

## Interview Evaluation Output Fields

| Field | Purpose |
|---|---|
| `Name` | Candidate name extracted from transcript |
| `Exp` | Experience years extracted from transcript |
| `Easy(15)` | Easy-question subtotal |
| `Medium(24)` | Medium-question subtotal |
| `Hard(40)` | Hard-question subtotal |
| `Total(80)` | Total interview score from evaluator path |
| `Recomendation` | Final evaluator recommendation field used by the workflow |
