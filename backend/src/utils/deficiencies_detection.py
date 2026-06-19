import os
import boto3
from src.utils.constants.deficiency import DEFICIENCY_COLS
from src.utils.constants.symptoms import SYMPTOM_COLS
from src.utils.enums import Gender
from src.utils.logger import get_logger

logger = get_logger(__name__)

MODEL_BUCKET = os.environ.get("AVATAR_BUCKET", "my-biometrics-models-bucket")
MODEL_KEY = os.environ.get("MODEL_KEY", "rf_mode.joblib")
LOCAL_MODEL_PATH = "/tmp/rf_mode.joblib"

if os.environ.get("IS_OFFLINE") == "true":
    s3_client = boto3.client(
        "s3",
        endpoint_url="http://localhost:4569",
        aws_access_key_id="S3RVER",
        aws_secret_access_key="S3RVER",
        region_name="eu-north-1"
    )
else:
    s3_client = boto3.client("s3", region_name="eu-north-1")

_ml_model = None

def _load_model_from_s3():
    """Helper function to lazy-load the model into memory from S3."""
    global _ml_model
    import joblib

    if _ml_model is None:
        try:
            if not os.path.exists(LOCAL_MODEL_PATH):
                logger.info(f"[ML_MODEL] Downloading model from S3 bucket '{MODEL_BUCKET}' key '{MODEL_KEY}'...")
                s3_client.download_file(MODEL_BUCKET, MODEL_KEY, LOCAL_MODEL_PATH)
                logger.info("[ML_MODEL] Model downloaded successfully to /tmp.")

            _ml_model = joblib.load(LOCAL_MODEL_PATH)
            logger.info("[ML_MODEL] Model loaded into memory successfully.")

        except Exception as e:
            logger.exception(f"[ML_MODEL] Critical error fetching/loading the ML model: {e}")
            raise RuntimeError("The model for deficiencies detection is not available.") from e

    return _ml_model

def detect_deficiencies(age: int, gender: Gender, user_symptoms: dict) -> dict:
    model = _load_model_from_s3()

    sex_encoded = 0 if gender.value.lower() == "female" else 1

    ordered_values = [age, sex_encoded]

    for symptom in SYMPTOM_COLS:
        ordered_values.append(
            float(user_symptoms.get(symptom, 0.0))
        )

    prediction_vector = model.predict([ordered_values])[0]

    predictions_dict = {}

    for index, deficiency_name in enumerate(DEFICIENCY_COLS):
        predictions_dict[deficiency_name] = round(
            float(prediction_vector[index]),
            4
        )

    return predictions_dict