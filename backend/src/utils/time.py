"""Time utilities."""

import time
from datetime import datetime


def current_millis() -> int:
    """Return the current time in milliseconds as an int."""
    return int(time.time() * 1000)


def get_start_of_current_week_millis():
    """Get start of the current week (Monday 00:00:00) in millis"""
    now = time.gmtime()
    days_to_monday = now.tm_wday
    start_of_week_day = now.tm_mday - days_to_monday

    start_of_week = time.struct_time(
        (now.tm_year, now.tm_mon, start_of_week_day, 0, 0, 0, 0, 0, -1)
    )

    return int(time.mktime(start_of_week) * 1000)


def get_end_of_current_week_millis():
    """Get end of the current week (Sunday 23:59:59) in millis"""
    now = time.gmtime()
    days_to_sunday = 6 - now.tm_wday6
    end_of_week_day = now.tm_mday + days_to_sunday

    end_of_week = time.struct_time(
        (now.tm_year, now.tm_mon, end_of_week_day, 23, 59, 59, 0, 0, -1)
    )

    return int(time.mktime(end_of_week) * 1000)


def get_start_of_current_month_millis():
    """Get start of current month in millis"""
    now = time.gmtime()
    start_of_month = time.struct_time(
        (now.tm_year, now.tm_mon, 1, 0, 0, 0, now.tm_wday, now.tm_yday, now.tm_isdst)
    )
    return int(time.mktime(start_of_month) * 1000)


def get_end_of_current_month_millis():
    """Get end of current month in millis"""
    now = time.gmtime()
    year = now.tm_year + (1 if now.tm_mon == 12 else 0)
    month = 1 if now.tm_mon == 12 else now.tm_mon + 1
    start_of_next_month = time.struct_time((year, month, 1, 0, 0, 0, 0, 0, -1))
    end_of_month_seconds = time.mktime(start_of_next_month) - 1
    return int(end_of_month_seconds * 1000)


def get_start_of_current_day_millis():
    """Get start of current day in millis (UTC)"""
    now = time.gmtime()
    start_of_day = time.struct_time(
        (
            now.tm_year,
            now.tm_mon,
            now.tm_mday,
            0,
            0,
            0,
            now.tm_wday,
            now.tm_yday,
            now.tm_isdst,
        )
    )
    return int(time.mktime(start_of_day) * 1000)


def get_end_of_current_day_millis():
    """Get end of current day in millis (UTC)"""
    now = time.gmtime()
    next_day = time.struct_time(
        (now.tm_year, now.tm_mon, now.tm_mday + 1, 0, 0, 0, 0, 0, -1)
    )
    end_of_day_seconds = time.mktime(next_day) - 1
    return int(end_of_day_seconds * 1000)


def get_current_year_month_utc() -> str:
    """Get the current UTC year and month"""
    return time.strftime("%Y-%m", time.gmtime())


def to_unix_ms(dt_str: str | None) -> int | None:
    """Convert 'YYYY-MM-DD HH:MM:SS' string to Unix timestamp in milliseconds"""
    if not dt_str:
        return None
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        return int(dt.timestamp() * 1000)
    except ValueError:
        return None


def get_last_12_months():
    """Return a list of the last 12 months in 'YYYY-MM' format."""
    today = datetime.today()
    months = []
    for i in range(12):
        month = today.month - i
        year = today.year
        if month <= 0:
            month += 12
            year -= 1
        months.append(f"{year}-{month:02d}")
    months.reverse()
    return months
