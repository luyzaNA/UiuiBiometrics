from src.utils.constants.defienciency_recovery_timeline import DEFICIENCY_RECOVERY_TIMELINE

def calculate_review_days(deficiencies: list) -> int:
    """
    Computes global reassessment time based on worst-case deficiency in days.
    """
    max_days = 0

    for d in deficiencies:
        if isinstance(d, str):
            name = d
            score = 1.0
        elif isinstance(d, dict):
            name = d.get("name") or d.get("deficiency_name")
            score = float(d.get("score", 0))
        else:
            continue

        if not name or score < 0.5:
            continue

        severity = "medium" if score < 0.70 else "high"

        if name in DEFICIENCY_RECOVERY_TIMELINE:
            days = DEFICIENCY_RECOVERY_TIMELINE[name][severity]
            max_days = max(max_days, days)

    return max_days