/**
 * Exercises done back to back — a "superserie" or, as the trainer says it, a
 * double exercise: a set of the first, a set of the second, and only then the
 * rest. Consecutive exercises sharing a superset group are one block, shown as
 * "A1 / A2"; each keeps its own sets and reps.
 */

const BLOCK_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface WithSupersetGroup {
  superset_group: number | null;
}

export interface SupersetBlock<T> {
  /** Null when the block is a single exercise nobody is chained to. */
  group: number | null;
  /** "A", "B"… on a superset; null on a lone exercise. */
  letter: string | null;
  exercises: T[];
}

/** Consecutive exercises of the same group; a group left alone is not a block. */
export function toSupersetBlocks<T extends WithSupersetGroup>(
  exercises: T[],
): SupersetBlock<T>[] {
  const blocks: SupersetBlock<T>[] = [];
  let letterIndex = 0;

  for (let start = 0; start < exercises.length; ) {
    const { superset_group: group } = exercises[start];
    let end = start + 1;
    if (group !== null) {
      while (end < exercises.length && exercises[end].superset_group === group) {
        end += 1;
      }
    }

    const members = exercises.slice(start, end);
    if (members.length >= 2) {
      blocks.push({
        group,
        letter: BLOCK_LETTERS[letterIndex % BLOCK_LETTERS.length],
        exercises: members,
      });
      letterIndex += 1;
    } else {
      blocks.push({ group: null, letter: null, exercises: members });
    }

    start = end;
  }

  return blocks;
}

/** "A1", "A2", "B1"… per exercise, in the order they were given; null if alone. */
export function supersetLabels(exercises: WithSupersetGroup[]): (string | null)[] {
  return toSupersetBlocks(exercises).flatMap((block) =>
    block.letter === null
      ? [null]
      : block.exercises.map((_, index) => `${block.letter}${index + 1}`),
  );
}
