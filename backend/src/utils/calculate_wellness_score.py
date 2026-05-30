from src.utils.constants.symptom_weights import SYMPTOM_WEIGHTS


def calculate_wellness_score(symptoms: dict[str, float]) -> float:
    """
    Calculate a wellness score based on the provided symptoms and their intensities.
    The wellness score starts at 100 and is reduced based on the intensity of each symptom,
    weighted by predefined symptom weights. The final score is rounded to 2 decimal places and cannot be negative.
    """
    total_deduction = 0.0

    for symptom, intensity in symptoms.items():
        weight = SYMPTOM_WEIGHTS.get(symptom, 1.0)
        total_deduction += intensity * weight

    wellness_score = 100.0 - total_deduction

    return max(0.0, round(wellness_score, 2))
