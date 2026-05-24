import os
import joblib
import pandas as pd

from src.utils.constants.deficiency import DEFICIENCY_COLS
from src.utils.constants.symptoms import SYMPTOM_COLS
from src.utils.enums import Gender
from src.utils.logger import get_logger

logger = get_logger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../ml_assets/rf_mode.joblib')

try:
    ml_model = joblib.load(MODEL_PATH)
    logger.info("[ML_MODEL] Modelul Random Forest a fost încărcat cu succes.")
except Exception as e:
    logger.exception(f"[ML_MODEL] Critical error loading the ML model: {e}")
    ml_model = None

def detect_deficiencies(age: int, gender: Gender, user_symptoms: dict) -> dict:
    if not ml_model:
        raise RuntimeError("The model for deficiencies detection is not available.")

    sex_encoded = 0 if gender.value.lower() == "female" else 1

    full_input = {"Age": age, "Sex": sex_encoded}
    for symptom in SYMPTOM_COLS:
        full_input[symptom] = float(user_symptoms.get(symptom, 0.0))

    input_df = pd.DataFrame([full_input])
    ordered_cols = ['Age', 'Sex'] + SYMPTOM_COLS
    input_df = input_df[ordered_cols]

    prediction_vector = ml_model.predict(input_df)[0]

    predictions_dict = {}
    for index, deficiency_name in enumerate(DEFICIENCY_COLS):
        predictions_dict[deficiency_name] = round(float(prediction_vector[index]), 4)

    return predictions_dict