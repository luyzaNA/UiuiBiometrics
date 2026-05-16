"""HTTP Exceptions"""


class NotFoundException(Exception):
    """Exception raised for an object not found in the database."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
