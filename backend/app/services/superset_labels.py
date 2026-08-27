"""Labels for the exercises a client performs back to back.

Consecutive exercises sharing a superset group are one block: the client does a
set of each without resting in between. On paper that block reads as "A1 / A2",
which is what a gym-goer expects to see, so a day's exercises are labelled by
the order their blocks appear.
"""

from collections.abc import Sequence

BLOCK_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def superset_labels(groups: Sequence[int | None]) -> list[str | None]:
    """Label each exercise of a day: "A1", "A2", "B1"… — None when it is alone.

    A group with a single exercise is not a superset: nothing is chained to it,
    so it gets no label.
    """
    labels: list[str | None] = [None] * len(groups)
    block_index = 0
    start = 0

    while start < len(groups):
        group = groups[start]
        end = start + 1
        if group is not None:
            while end < len(groups) and groups[end] == group:
                end += 1

        if end - start >= 2:
            letter = BLOCK_LETTERS[block_index % len(BLOCK_LETTERS)]
            block_index += 1
            for position, index in enumerate(range(start, end), start=1):
                labels[index] = f"{letter}{position}"

        start = end

    return labels


def opens_superset(groups: Sequence[int | None]) -> list[bool]:
    """True on the first exercise of each block, False everywhere else.

    Which row of a day owns the block's note: the one that opens it. A lone
    exercise opens nothing, so it never carries one.
    """
    labels = superset_labels(groups)
    # Two blocks can sit back to back, so "the row before me is not in a block"
    # is not enough: what opens a block is being labelled and not continuing the
    # group of the row above.
    return [
        label is not None
        and (index == 0 or labels[index - 1] is None or groups[index - 1] != group)
        for index, (group, label) in enumerate(zip(groups, labels, strict=True))
    ]
