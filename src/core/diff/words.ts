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

    return bridgeGaps(segments);
}

/**
 * Longest gap that may be bridged, in characters.
 *
 * Bounded because the rule is meant to close punctuation and spacing seams, not to
 * smear a highlight across text that genuinely survived. `src="a.png"` → `"b.webp"`
 * has to bridge a single `.`; `foo(a, reallyLongUnchangedArgument, b)` must not
 * bridge the argument just because both `a` and `b` changed. Four characters covers
 * the realistic seams — `.`, `", "`, `` -> ``, `::` — and stops well short of a word.
 */
const MAX_BRIDGE_LENGTH = 4;

/**
 * Mark short unchanged gaps between two changed runs as changed too.
 *
 * `diffWordsWithSpace` splits on word boundaries, so both whitespace and
 * punctuation come back as their own unchanged tokens. A rewritten phrase or an
 * edited path therefore arrives as alternating changed words and unchanged seams —
 * `a` `.` `png` for `a.png` → `b.webp`. Highlighted literally that renders as
 * stripes, which reads as though the seam were somehow retained from the old text.
 *
 * The original had no such artefact because diff-match-patch works at character
 * level and `diff_cleanupSemantic` coalesces neighbouring edits into whole runs.
 * Bridging here reproduces that without giving up word-level granularity.
 *
 * A gap qualifies when it is interior (changed runs on both sides), short enough
 * (see MAX_BRIDGE_LENGTH), and contains no letters or digits. That last condition
 * is what keeps the rule from swallowing real words: `quick`, sitting between two
 * changes, stays unmarked because it is alphanumeric, while `.` and `", "` do not.
 *
 * Whitespace at either end of the line is never bridged — it has no changed run on
 * one side — so leading indentation stays unmarked when only the code after it
 * changed.
 */
function bridgeGaps(segments: WordSegment[]): WordSegment[] {
    const bridged: WordSegment[] = [];

    for (let index = 0; index < segments.length; index++) {
        const segment = segments[index]!;

        const isInteriorGap =
            !segment.modified &&
            isBridgeable(segment.value) &&
            segments[index - 1]?.modified === true &&
            segments[index + 1]?.modified === true;

        const last = bridged[bridged.length - 1];
        const modified = isInteriorGap ? true : segment.modified;

        if (last && last.modified === modified) {
            last.value += segment.value;
            continue;
        }

        bridged.push({ value: segment.value, modified });
    }

    return bridged;
}

/**
 * Whether an unchanged run is a seam rather than surviving content.
 *
 * Whitespace of any length qualifies: a run of spaces between two rewritten words
 * is still just the gap between them. Anything else must be short and free of
 * letters and digits.
 */
function isBridgeable(value: string): boolean {
    if (value.trim() === '') return true;
    return value.length <= MAX_BRIDGE_LENGTH && !/[\p{L}\p{N}]/u.test(value);
}
