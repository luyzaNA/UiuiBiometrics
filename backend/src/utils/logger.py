import logging

def get_logger(name: str | None = None) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    return logger


logging.getLogger("botocore").setLevel(logging.WARNING)
logging.getLogger("boto3").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)


def log_ctx(**kwargs):
    """Logger concat helper"""
    return " | ".join(f"{k}={v}" for k, v in kwargs.items())
