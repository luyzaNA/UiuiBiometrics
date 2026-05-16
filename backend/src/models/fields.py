"""Field utils."""

from pydantic import Field

from src.utils.time import current_millis


def label_field(description: str, max_length: int = 255):
    """Label field."""
    return Field(
        min_length=2,
        max_length=max_length,
        pattern=r"^[A-Za-z0-9\s\.,:\+-]{3,160}$",
        description=description,
    )


def timestamp_field(description: str = "Unix timestamp in milliseconds (13 digits)"):
    """Timestamp field."""
    return Field(
        default_factory=current_millis,
        ge=1_000_000_000_000,
        le=9_999_999_999_999,
        description=description,
    )


def optional_label_field(description: str):
    """Optional label field."""
    return Field(
        max_length=255, pattern=r"^[A-Za-z0-9\s\.,:-]{0,160}$", description=description
    )


def phone_number_field():
    """Phone number field for Romanian numbers starting with +40."""
    return Field(
        min_length=12,
        max_length=12,
        pattern=r"^\+407\d{8}$",
        description="Romanian phone number starting with +40 followed by 9 digits",
    )
