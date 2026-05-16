"""Settings"""

from os import getenv

STAGE: str = getenv("STAGE", "local")
IS_OFFLINE: bool = getenv("IS_OFFLINE", "false").lower() == "true"
UIUI_BIOMETRICS_TABLE: str | None = getenv("DYNAMODB_TABLE")