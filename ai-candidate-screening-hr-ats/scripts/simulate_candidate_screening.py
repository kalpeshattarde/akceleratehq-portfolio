"""Offline simulation for the AI Candidate Screening HR + ATS project.

The script mirrors the workflow's scoring and routing intent without calling
n8n, Google, Gmail, Calendar, OpenRouter, OpenAI, Vapi, or WhatsApp APIs.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CANDIDATES = PROJECT_ROOT / "sample-data" / "candidates.sample.csv"
DEFAULT_TRANSCRIPT = PROJECT_ROOT / "sample-data" / "interview-transcript.sample.txt"
DEFAULT_SCREENED = PROJECT_ROOT / "output-samples" / "screened-candidates.sample.csv"
DEFAULT_INTERVIEW = PROJECT_ROOT / "output-samples" / "interview-evaluation.sample.json"


def contains_any(text: str, keywords: list[str]) -> bool:
    value = (text or "").lower()
    return any(keyword.lower() in value for keyword in keywords)


def normalize_phone(value: str) -> str:
    digits = re.sub(r"[^0-9+]", "", value or "")
    if digits.startswith("+"):
        return digits
    if len(digits) == 10:
        return "+91" + digits
    if digits.startswith("91") and len(digits) == 12:
        return "+" + digits
    return digits


def score_candidate(row: dict[str, str]) -> dict[str, int]:
    combined = " ".join(
        [
            row.get("skills_checklist", ""),
            row.get("automation_built_end_to_end", ""),
            row.get("automation_outcome", ""),
            row.get("client_industries", ""),
        ]
    )

    n8n = 20 if row.get("has_n8n_production", "").lower() == "yes" else 12 if contains_any(combined, ["n8n", "make", "zapier"]) else 2
    ai_agents = 15 if contains_any(combined, ["agent", "llm", "openai", "classification", "reply drafting"]) else 8 if contains_any(combined, ["chatgpt", "ai"]) else 2
    rag = 15 if row.get("has_local_llm_rag", "").lower() == "yes" or contains_any(combined, ["rag", "vector", "ollama", "lm studio"]) else 3
    api = 15 if contains_any(combined, ["api", "webhook", "oauth", "gmail", "ms graph"]) else 6 if contains_any(combined, ["google sheets"]) else 2
    crm = 15 if contains_any(combined, ["crm", "hubspot", "zoho", "sales", "marketing", "finance", "lead"]) else 4
    code = 10 if contains_any(combined, ["python", "node", "docker", "deployment"]) else 5 if contains_any(combined, ["javascript"]) else 2
    communication = 10 if row.get("comfortable_presenting_to_founder_md", "").lower() == "yes" and row.get("automation_outcome") else 4

    return {
        "n8n_score": n8n,
        "ai_agent_score": ai_agents,
        "rag_score": rag,
        "api_score": api,
        "crm_score": crm,
        "code_deploy_score": code,
        "communication_score": communication,
    }


def route(score: int) -> tuple[str, str, str]:
    if score >= 75:
        return "Strong", "interview", "Interview Scheduled"
    if score >= 50:
        return "Average", "manual_review", "Manual Review"
    return "Weak", "hr_rejection_approval", "Rejection Pending HR Approval"


def screen_candidates(input_path: Path, output_path: Path) -> list[dict[str, str]]:
    with input_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    screened: list[dict[str, str]] = []
    for row in rows:
        if (row.get("processed") or "").strip().lower() in {"true", "yes", "1"}:
            continue
        if not row.get("full_name") or not row.get("email") or not row.get("resume_link"):
            continue

        components = score_candidate(row)
        ai_score = max(0, min(100, sum(components.values())))
        category, route_name, status = route(ai_score)

        if category == "Strong":
            recommended_action = "Interview"
            summary = "Strong AI automation profile with production workflow evidence and enough technical depth for interview."
        elif category == "Average":
            recommended_action = "Manual Review"
            summary = "Useful automation background, but HR should verify n8n depth, API experience, and production ownership."
        else:
            recommended_action = "HR Approval Before Rejection"
            summary = "Limited evidence for AI automation role fit. Keep HR approval before rejection."

        screened.append(
            {
                "full_name": row["full_name"],
                "email": row["email"],
                "whatsapp_number": normalize_phone(row.get("whatsapp_number", "") or row.get("phone", "")),
                "job_role": row.get("job_role", ""),
                "ai_score": str(ai_score),
                "ai_category": category,
                "recommended_action": recommended_action,
                "route": route_name,
                "status": status,
                "ai_summary": summary,
                "risk_flags": "Verify production ownership and portfolio evidence",
                **{key: str(value) for key, value in components.items()},
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(screened[0].keys()) if screened else ["message"])
        writer.writeheader()
        writer.writerows(screened)
    return screened


def evaluate_interview(transcript_path: Path, output_path: Path) -> dict[str, object]:
    transcript = transcript_path.read_text(encoding="utf-8")
    answers = re.findall(r"User:\s*(.+)", transcript)
    joined = " ".join(answers).lower()

    name_match = re.search(r"my name is ([a-zA-Z ]+?)(?: and|\\.|\n)", transcript, re.IGNORECASE)
    exp_match = re.search(r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten) years", transcript, re.IGNORECASE)
    number_words = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10,
    }

    exp_raw = exp_match.group(1).lower() if exp_match else "0"
    exp = int(exp_raw) if exp_raw.isdigit() else number_words.get(exp_raw, 0)

    easy = 0
    easy += 5 if "workflow automation" in joined or "workflow" in joined else 2
    easy += 5 if "http callback" in joined or "webhook" in joined else 2
    easy += 5 if "retries" in joined and "logging" in joined else 3

    medium = 0
    medium += 8 if "vector" in joined and "private knowledge" in joined else 4
    medium += 8 if "oauth" in joined and "credentials" in joined else 4
    medium += 8 if "classify" in joined and "review" in joined else 4

    hard = 0
    hard += 10 if "idempotency" in joined and "duplicate" in joined else 4
    hard += 10 if "time saved" in joined and "sla" in joined else 5
    hard += 10 if "irreversible" in joined and "confidence" in joined else 5
    hard += 10 if "ollama" in joined and "private network" in joined else 5

    total = easy + medium + hard
    percent = total / 79 * 100
    if percent >= 85:
        recommendation = "STRONG_HIRE"
    elif percent >= 70:
        recommendation = "HIRE"
    elif percent >= 55:
        recommendation = "MAYBE"
    elif percent >= 40:
        recommendation = "NO_HIRE"
    else:
        recommendation = "STRONG_NO_HIRE"

    result = {
        "name": name_match.group(1).strip() if name_match else "Not found",
        "exp": exp,
        "easy": easy,
        "medium": medium,
        "hard": hard,
        "total": total,
        "recommendation": recommendation,
        "feedback": "Candidate gave practical workflow, RAG, error handling, idempotency, and local LLM answers. Validate claims against portfolio before final decision.",
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def main(argv: list[str]) -> int:
    candidates_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_CANDIDATES
    transcript_path = Path(argv[2]) if len(argv) > 2 else DEFAULT_TRANSCRIPT

    screened = screen_candidates(candidates_path, DEFAULT_SCREENED)
    interview = evaluate_interview(transcript_path, DEFAULT_INTERVIEW)

    by_route = Counter(row["route"] for row in screened)
    print(f"screened={len(screened)} output={DEFAULT_SCREENED}")
    for route_name, count in sorted(by_route.items()):
        print(f"{route_name}={count}")
    print(f"interview_total={interview['total']} recommendation={interview['recommendation']} output={DEFAULT_INTERVIEW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
