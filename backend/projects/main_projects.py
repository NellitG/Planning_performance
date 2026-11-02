"""Shared helpers for safely reusing Main Project records."""

import unicodedata

from django.db import IntegrityError, transaction
from django.db.models import CharField
from django.db.models.functions import Lower, Trim

from .models import MainProject


def normalize_main_project_name(value):
    return unicodedata.normalize("NFKC", str(value or "")).strip().casefold()


def find_main_project_by_name(name, exclude_pk=None):
    normalized = normalize_main_project_name(name)
    if not normalized:
        return None
    queryset = (
        MainProject.objects.annotate(
            _normalized_name=Lower(Trim("name"), output_field=CharField())
        )
        .filter(_normalized_name=normalized.lower())
        .order_by("id")
    )
    if exclude_pk is not None:
        queryset = queryset.exclude(pk=exclude_pk)
    return queryset.first()


def get_or_create_main_project(name, defaults=None):
    """Return an existing trimmed, case-insensitive match or create one."""
    display_name = unicodedata.normalize("NFKC", str(name or "")).strip()
    if not display_name:
        raise ValueError("Main Project name cannot be empty.")

    existing = find_main_project_by_name(display_name)
    if existing:
        return existing, False

    values = dict(defaults or {})
    values["name"] = display_name
    try:
        with transaction.atomic():
            return MainProject.objects.create(**values), True
    except IntegrityError:
        # A concurrent request may have inserted a case/space-equivalent name.
        existing = find_main_project_by_name(display_name)
        if existing:
            return existing, False
        raise
