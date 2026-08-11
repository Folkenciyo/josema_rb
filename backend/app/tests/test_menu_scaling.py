from decimal import Decimal

from app.services.menu_scaling import (
    realised_factor,
    scale_amount,
    scale_nutrient,
    scaling_factor,
)


def test_the_factor_is_the_target_over_what_the_menu_already_has():
    assert scaling_factor(2000, 2400) == 1.2


def test_a_menu_with_no_calories_cannot_be_scaled():
    """Nothing times anything is still nothing; leave the portions alone."""
    assert scaling_factor(0, 2400) == 1.0


def test_grams_are_rounded_to_whole_units():
    # 187,5 g of rice is a fiction: nobody weighs that.
    assert scale_amount(Decimal("150"), 1.25, "g") == Decimal("188")


def test_countable_foods_are_rounded_to_halves():
    # 2,4 eggs becomes two and a half, which somebody can actually serve.
    assert scale_amount(Decimal("2"), 1.2, "unidades") == Decimal("2.5")


def test_a_portion_never_rounds_away_to_nothing():
    assert scale_amount(Decimal("1"), 0.1, "g") == Decimal("1")
    assert scale_amount(Decimal("1"), 0.1, "unidad") == Decimal("0.5")


def test_an_amount_that_was_never_written_stays_empty():
    assert scale_amount(None, 1.2, "g") is None


def test_macros_keep_one_decimal():
    assert scale_nutrient(Decimal("120.5"), 1.2) == Decimal("144.6")
    assert scale_nutrient(None, 1.2) is None


def test_macros_follow_the_portion_that_was_really_served():
    """Two eggs scaled by 1,2 become 2,5: the macros must follow 1,25, not 1,2."""
    factor = realised_factor(Decimal("2"), Decimal("2.5"), 1.2)

    assert factor == 1.25
    assert scale_nutrient(Decimal("100"), factor) == Decimal("125.0")


def test_an_item_with_no_amount_keeps_the_requested_factor():
    """A line written by hand, with macros but no quantity, still scales."""
    assert realised_factor(None, None, 1.2) == 1.2
