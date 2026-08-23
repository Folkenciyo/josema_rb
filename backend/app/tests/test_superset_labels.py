from app.services.superset_labels import superset_labels


def test_exercises_without_a_group_get_no_label():
    assert superset_labels([None, None, None]) == [None, None, None]


def test_consecutive_exercises_of_a_group_are_one_block():
    assert superset_labels([None, 1, 1, None]) == [None, "A1", "A2", None]


def test_each_block_gets_its_own_letter():
    labels = superset_labels([1, 1, None, 2, 2, 2])
    assert labels == ["A1", "A2", None, "B1", "B2", "B3"]


def test_a_group_left_alone_is_not_a_superset():
    assert superset_labels([1, None, 1]) == [None, None, None]
