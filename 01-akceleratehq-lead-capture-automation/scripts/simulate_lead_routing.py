"""Offline simulation for the AKcelerateHQ lead capture workflow.

This mirrors the workflow's scoring and routing intent without calling n8n,
Google, Gmail, Calendar, OpenRouter, or a WhatsApp provider.
"""

from __future__ import annotations

import csv
import re
import sys
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "sample-data" / "audit-leads.sample.csv"
DEFAULT_OUTPUT = PROJECT_ROOT / "output-samples" / "routed-leads.sample.csv"


def contains_any(text: str, keywords: list[str]) -> bool:
    haystack = (text or "").lower()
    return any(keyword.lower() in haystack for keyword in keywords)


def normalize_phone(value: str) -> str:
    digits = re.sub(r"[^0-9+]", "", value or "")
    if digits.startswith("+"):
        return digits
    if len(digits) == 10:
        return "+91" + digits
    if digits.startswith("91") and len(digits) == 12:
        return "+" + digits
    return digits


def classify_workflow(row: dict[str, str]) -> tuple[str, str]:
    text = " ".join(
        [
            row.get("biggest_pain", ""),
            row.get("workflows_ai_handle", ""),
            row.get("tools_currently_use", ""),
            row.get("industry", ""),
        ]
    )

    if contains_any(text, ["lead", "crm", "sales", "conversion"]):
        return "lead_crm_automation", "Lead Qualification + CRM Follow-up System"
    if contains_any(text, ["report", "dashboard", "analytics", "power bi"]):
        return "reporting_dashboard", "Reporting Dashboard + Owner Summary"
    if contains_any(text, ["support", "reply", "inbound emails", "customer"]):
        return "support_email_ai", "AI Customer Support Triage + Reply Drafting"
    if contains_any(text, ["document", "invoice", "approval", "processing"]):
        return "document_processing", "Document Processing + Approval Workflow"
    return "general_automation", "Automation Audit + Starter Workflow Demo"


def score_lead(row: dict[str, str]) -> dict[str, int]:
    pain = row.get("biggest_pain", "") + " " + row.get("hours_lost_per_week", "")
    budget = row.get("budget", "")
    timeline = row.get("timeline", "")
    authority = row.get("decision_authority", "")
    readiness = row.get("data_readiness", "")
    tools = row.get("tools_currently_use", "") + " " + row.get("workflows_ai_handle", "")
    revenue = row.get("monthly_revenue", "")

    pain_score = 20 if contains_any(pain, ["40-100", "100+", "manual data entry", "lead qualification"]) else 14 if contains_any(pain, ["15-40", "support", "reporting"]) else 7
    automation_score = 20 if contains_any(tools, ["crm", "sync", "classify", "dashboard", "reply", "reminders"]) else 12 if tools.strip() else 6
    budget_score = 15 if contains_any(budget, ["$2,000", "$6,000", "prefer to discuss"]) else 9 if contains_any(budget, ["$1,000"]) else 3
    urgency_score = 15 if contains_any(timeline, ["asap", "< 21 days"]) else 9 if contains_any(timeline, ["1-3 months"]) else 3
    authority_score = 10 if contains_any(authority, ["yes", "buying committee"]) else 6 if contains_any(authority, ["influence"]) else 3
    data_score = 10 if contains_any(readiness, ["clean", "weekly", "exists"]) else 6 if readiness.strip() else 3
    revenue_score = 10 if contains_any(revenue, ["$100,000", "100,000+"]) else 8 if contains_any(revenue, ["$25,000"]) else 2

    return {
        "pain_severity_score": pain_score,
        "automation_fit_score": automation_score,
        "budget_score": budget_score,
        "urgency_score": urgency_score,
        "authority_score": authority_score,
        "data_readiness_score": data_score,
        "revenue_fit_score": revenue_score,
    }


def route_lead(row: dict[str, str], score: int) -> tuple[str, str, str, str]:
    text = " ".join(
        [
            row.get("budget", ""),
            row.get("timeline", ""),
            row.get("decision_authority", ""),
            row.get("biggest_pain", ""),
            row.get("hours_lost_per_week", ""),
        ]
    )

    strong_fit = score >= 75 or (
        contains_any(text, ["$2,000", "$6,000", "prefer to discuss"])
        and contains_any(text, ["asap", "< 21 days"])
        and contains_any(text, ["yes", "buying committee"])
    )
    warm_fit = score >= 45 or contains_any(text, ["1-3 months", "influence", "15-40"])

    if strong_fit:
        return (
            "Hot",
            "discovery_call",
            "Discovery Scheduled",
            "High-intent lead with strong pain, urgency, authority, or budget.",
        )
    if warm_fit:
        return (
            "Warm",
            "manual_review",
            "Manual Review",
            "Potential fit, but needs more clarity on scope, budget, authority, or timeline.",
        )
    return (
        "Cold",
        "nurture",
        "Nurture",
        "Low urgency, weak budget, unclear ROI, or early exploration stage.",
    )


def simulate(input_path: Path, output_path: Path) -> list[dict[str, str]]:
    with input_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    output: list[dict[str, str]] = []
    for index, row in enumerate(rows, start=2):
        if (row.get("processed") or "").strip().lower() in {"true", "yes", "1"}:
            continue
        if not row.get("full_name") or not row.get("work_email") or not row.get("company_name"):
            continue

        workflow_type, recommended_offer = classify_workflow(row)
        components = score_lead(row)
        audit_score = max(0, min(100, sum(components.values())))
        category, route, status, route_reason = route_lead(row, audit_score)

        next_action = {
            "discovery_call": "Book discovery call and prepare ROI-based automation recommendation.",
            "manual_review": "Send qualification questions and review manually.",
            "nurture": "Send helpful nurture email and follow up later.",
        }[route]

        output.append(
            {
                "row_number": str(index),
                "full_name": row["full_name"],
                "company_name": row["company_name"],
                "work_email": row["work_email"],
                "contact_no": normalize_phone(row.get("contact_no", "")),
                "workflow_type": workflow_type,
                "audit_score": str(audit_score),
                "lead_category": category,
                "route": route,
                "status": status,
                "recommended_offer": recommended_offer,
                "next_action": next_action,
                "route_reason": route_reason,
                **{key: str(value) for key, value in components.items()},
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output[0].keys()) if output else ["message"])
        writer.writeheader()
        writer.writerows(output)

    return output


def main(argv: list[str]) -> int:
    input_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_INPUT
    output_path = Path(argv[2]) if len(argv) > 2 else DEFAULT_OUTPUT

    routed = simulate(input_path, output_path)
    by_route = Counter(row["route"] for row in routed)
    print(f"processed={len(routed)} output={output_path}")
    for route, count in sorted(by_route.items()):
        print(f"{route}={count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
