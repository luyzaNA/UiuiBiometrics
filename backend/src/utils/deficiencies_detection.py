import os
import threading

from src.utils.constants.deficiency import DEFICIENCY_COLS
from src.utils.constants.symptoms import SYMPTOM_COLS
from src.utils.enums import Gender
from src.utils.logger import get_logger

logger = get_logger(__name__)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../ml_assets/model_bundle_final.joblib"
)

_ml_model = None
_model_lock = threading.Lock()

logger.info(
    f"[BOOT] PID={os.getpid()} "
    f"MODEL_PATH={MODEL_PATH}"
)


def _log_memory(label: str):
    try:
        with open("/proc/self/status") as f:
            rss = None
            hwm = None

            for line in f:
                if line.startswith("VmRSS:"):
                    rss = line.split(":", 1)[1].strip()

                if line.startswith("VmHWM:"):
                    hwm = line.split(":", 1)[1].strip()

            logger.info(
                f"[MEMORY] {label} "
                f"RSS={rss} "
                f"PEAK={hwm}"
            )

    except Exception as ex:
        logger.warning(
            f"[MEMORY] Failed to read memory: {ex}"
        )


def preload_ml_model(force_reload: bool = False):
    """
    Loads the model into memory and keeps it cached.

    Safe to call multiple times.
    """
    global _ml_model

    if _ml_model is not None and not force_reload:
        logger.info(
            "[ML_MODEL] Returning cached model"
        )
        return _ml_model

    with _model_lock:
        if _ml_model is not None and not force_reload:
            logger.info(
                "[ML_MODEL] Returning cached model "
                "(inside lock)"
            )
            return _ml_model

        import joblib
        import time

        start = time.perf_counter()

        logger.info("[ML_MODEL] Loading model...")

        try:
            file_size_mb = (
                    os.path.getsize(MODEL_PATH)
                    / 1024
                    / 1024
            )

            logger.info(
                f"[ML_MODEL] File size: "
                f"{file_size_mb:.2f} MB"
            )

        except Exception as ex:
            logger.warning(
                f"[ML_MODEL] Failed to read "
                f"file size: {ex}"
            )

        _log_memory("before joblib.load")

        try:
            logger.info(
                "[ML_MODEL] Starting joblib.load()"
            )

            _ml_model = joblib.load(MODEL_PATH)

            logger.info(
                "[ML_MODEL] joblib.load() completed"
            )

            _log_memory("after joblib.load")

            logger.info(
                f"[ML_MODEL] Loaded type: "
                f"{type(_ml_model)}"
            )

            try:
                if hasattr(_ml_model, "estimators_"):
                    logger.info(
                        f"[ML_MODEL] Outputs: "
                        f"{len(_ml_model.estimators_)}"
                    )

                    if len(_ml_model.estimators_) > 0:
                        first = _ml_model.estimators_[0]

                        if hasattr(first, "n_estimators"):
                            logger.info(
                                f"[ML_MODEL] Trees per output: "
                                f"{first.n_estimators}"
                            )

            except Exception as ex:
                logger.warning(
                    f"[ML_MODEL] Failed model inspection: "
                    f"{ex}"
                )

            elapsed = time.perf_counter() - start

            logger.info(
                f"[ML_MODEL] Model loaded successfully "
                f"in {elapsed:.2f}s"
            )

            return _ml_model

        except Exception as e:
            _log_memory(
                "during exception handling"
            )

            logger.exception(
                f"[ML_MODEL] Critical error loading "
                f"ML model: {e}"
            )

            raise RuntimeError(
                "The model for deficiencies detection "
                "is not available."
            ) from e


def get_ml_model():
    """
    Returns cached model.
    Loads it only once if necessary.
    """
    global _ml_model

    if _ml_model is None:
        logger.info(
            "[ML_MODEL] Cache miss"
        )
        return preload_ml_model()

    logger.info(
        "[ML_MODEL] Cache hit"
    )

    return _ml_model


def is_model_loaded() -> bool:
    return _ml_model is not None


def clear_model_cache():
    """
    Useful for tests.
    """
    global _ml_model
    _ml_model = None


def detect_deficiencies(
        age: int,
        gender: Gender,
        user_symptoms: dict,
) -> dict:
    import pandas as pd

    logger.info(
        f"[ML_MODEL] Predict request "
        f"age={age} "
        f"gender={gender.value}"
    )

    _log_memory("before prediction")

    model = get_ml_model()

    sex_encoded = 0 if gender.value.lower() == "female" else 1

    full_input = {
        "Age": age,
        "Sex": sex_encoded,
    }

    for symptom in SYMPTOM_COLS:
        full_input[symptom] = float(
            user_symptoms.get(symptom, 0.0)
        )

    input_df = pd.DataFrame([full_input])

    ordered_cols = [
        "Age",
        "Sex",
        *SYMPTOM_COLS,
    ]

    input_df = input_df[ordered_cols]

    prediction_vector = model.predict(input_df)[0]

    logger.info(
        f"[ML_MODEL] Prediction completed "
        f"outputs={len(prediction_vector)}"
    )

    _log_memory("after prediction")

    return {
        deficiency_name: round(
            float(prediction_vector[index]),
            4
        )
        for index, deficiency_name
        in enumerate(DEFICIENCY_COLS)
    }