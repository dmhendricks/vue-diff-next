import { diffWordsWithSpace } from 'diff';

/**
 * A run of text within a line, flagged as modified or not.
 *
 * vue-diff solved this by injecting `<vue-diff-modified>` sentinel strings into
 * the source and string-replacing them after highlighting. That breaks if the
 * content contains the sentinel, and depends on the highlighter passing the
 * markers through untouched. Returning offsets instead lets the highlighter's
 * token stream be split at these boundaries with no string injection at all.
 */
export interface WordSegment {
    value: string;
    modified: boolean;
}

/**
 * Word-diff `prev` against `current`, describing the *current* text as a list of
 * segments.
 *
 * Removed runs are dropped: the result reconstructs `current` exactly, with the
 * parts that differ from `prev` marked. Concatenating every `value` therefore
 * yields `current` byte for byte — the invariant the token composition relies on.
 */
export function diffWords(prev: string, current: string): WordSegment[] {
    if (prev === current) {
        return current === '' ? [] : [{ value: current, modified: false }];
    }

    const segments: WordSegment[] = [];

    for (const part of diffWordsWithSpace(prev, current)) {
        // Removed text is not present in `current`, so it contributes nothing.
        if (part.removed) continue;

        const modified = Boolean(part.added);
        const last = segments[segments.length - 1];

        // Merge adjacent runs of the same kind to keep the segment list minimal.
        if (last && last.modified === modified) {
            last.value += part.value;
            continue;
        }

        segments.push({ value: part.value, modified });
    }

    return segments;
}
