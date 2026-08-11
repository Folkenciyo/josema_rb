"""Turning a 2.000 kcal menu into a 2.400 one without rewriting it by hand.

Everything here is arithmetic on plain numbers: no database, no models. The
service layer decides what to persist; this decides how much of each food.
"""

from decimal import ROUND_HALF_UP, Decimal

# Units that only make sense in halves: nobody serves 2,3 eggs.
COUNTABLE_UNITS = {"unidad", "unidades", "ud", "uds", "pieza", "piezas"}
HALF = Decimal("0.5")


def scaling_factor(current_calories: float, target_calories: float) -> float:
    """How much bigger every portion has to get. 0 kcal cannot be scaled at all."""
    if current_calories <= 0:
        return 1.0
    return target_calories / current_calories


def scale_amount(
    amount: Decimal | float | None, factor: float, unit: str | None
) -> Decimal | None:
    """Scale a served amount, rounded to something a person can actually serve.

    Grams and millilitres go to whole units — 187,5 g of rice is a fiction — and
    countable foods to halves, so half an egg stays possible and 2,3 does not.
    """
    if amount is None:
        return None

    scaled = Decimal(str(amount)) * Decimal(str(factor))

    if unit and unit.strip().lower() in COUNTABLE_UNITS:
        halves = (scaled / HALF).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        rounded = halves * HALF
    else:
        rounded = scaled.quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    # Never round a real portion down to nothing.
    smallest = HALF if unit and unit.strip().lower() in COUNTABLE_UNITS else Decimal(1)
    return max(rounded, smallest) if scaled > 0 else Decimal(0)


def scale_nutrient(value: Decimal | float | None, factor: float) -> Decimal | None:
    """Macros follow the portion actually served, not the requested target.

    Rounding the amount first and the macros after is what keeps the printed
    numbers consistent with the printed quantity.
    """
    if value is None:
        return None
    return (Decimal(str(value)) * Decimal(str(factor))).quantize(
        Decimal("0.1"), rounding=ROUND_HALF_UP
    )


def realised_factor(
    original_amount: Decimal | float | None,
    scaled_amount: Decimal | None,
    factor: float,
) -> float:
    """The factor that the rounded portion really represents.

    Asking for 1,2× on 100 g of rice gives 120 g and a factor of 1,2; asking for
    the same on one egg gives 1,5 eggs and a factor of 1,5. The macros must
    follow the egg, not the wish.
    """
    if original_amount is None or scaled_amount is None:
        return factor

    original = Decimal(str(original_amount))
    if original == 0:
        return factor
    return float(scaled_amount / original)
