"""Clinical and Triage Rules for Health Assessments."""

def evaluate_medical_red_flags(user_symptoms: dict) -> list[str]:
    """
    Checks for specific acute symptom combinations or high intensities
    that require immediate attention (Red Flags).
    """
    flags = []
    CRITICAL_INTENSITY = 0.6

    # 1. Dizziness + Palpitations + Hypotension
    if (user_symptoms.get("Dizziness", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Palpitations", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Hypotension", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Cardiovascular alert: Combined dizziness, palpitations, and hypotension detected.")

    # 2. Numbness + Physical Instability + Coordination Problems
    if (user_symptoms.get("Numbness", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Physical_Instability", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Coordination_Problems", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Neurological alert: Combined numbness, physical instability, and coordination issues detected.")

    # 3. Headache + Nausea + Light Sensitivity
    if (user_symptoms.get("Headache", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Nausea", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Light_Sensitivity", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Migraine/Neurological alert: Combined severe headache, nausea, and light sensitivity detected.")

    # 4. Nose or Gum Bleeding + Easy Bruising
    if (user_symptoms.get("Nose_or_Gum_Bleeding", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Easy_Bruising", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Hematological alert: Combined easy bruising and nose or gum bleeding detected.")

    # 5. Diarrhea + Muscle Weakness + Cramps
    if (user_symptoms.get("Diarrhea", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Muscle_Weakness", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Cramps", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Electrolyte depletion alert: Combined diarrhea, muscle weakness, and muscle cramps detected.")

    # 6. Memory Loss + Difficulty Concentrating + Tremors
    if (user_symptoms.get("Memory_Loss", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Difficulty_Concentrating", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Tremors", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Cognitive/Neurological alert: Combined memory loss, difficulty concentrating, and tremors detected.")

    # 7. Bone Pain + Muscle Weakness + Physical Instability
    if (user_symptoms.get("Bone_Pain", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Muscle_Weakness", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Physical_Instability", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Musculoskeletal alert: Combined bone pain, muscle weakness, and physical instability detected.")

    # 8. Insomnia + Depression/Anxiety/Mood Changes + Irritability
    if (user_symptoms.get("Insomnia", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Depression_Anxiety_Mood_Changes", 0.0) >= CRITICAL_INTENSITY and
            user_symptoms.get("Irritability", 0.0) >= CRITICAL_INTENSITY):
        flags.append("Neuropsychiatric alert: Combined insomnia, mood changes (depression/anxiety), and irritability detected.")

    return flags


def evaluate_multi_deficiency_alerts(predicted_deficiencies: dict) -> list[str]:
    """
    Checks if the ML model detected too many severe deficiencies simultaneously,
    indicating a deeply compromised systemic health condition.
    """
    flags = []
    SEVERE_THRESHOLD = 0.70
    MAX_ALLOWED_SEVERE_DEFICIENCIES = 3

    severe_deficiencies = [
        deficiency for deficiency, prob in predicted_deficiencies.items()
        if prob >= SEVERE_THRESHOLD
    ]

    if len(severe_deficiencies) >= MAX_ALLOWED_SEVERE_DEFICIENCIES:
        flags.append(
            f"Systemic alert: Multiple critical nutrient vulnerabilities detected, indicating a deeply compromised general health condition."
        )

    return flags