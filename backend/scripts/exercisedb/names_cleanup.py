"""Shared name cleanup for the ExerciseDB import.

The source repeats the same movement under several names ("(male)", "v. 2",
"(side pov)"): those suffixes mark another camera angle, not another exercise.
"""

import re

# Suffixes that mark the same movement filmed again, not a different exercise.
NOISE_PATTERN = re.compile(
    r"\s*(\((male|female|back pov|side pov|front pov)\)|v\.\s*\d+)", re.IGNORECASE
)


def clean_name(name: str) -> str:
    return NOISE_PATTERN.sub("", name).strip()


def normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", clean_name(name).lower())
