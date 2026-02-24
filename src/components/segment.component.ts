/**
 * Import will remove at compile time
 */

import type { VLQOffsetInterface, SegmentInterface } from '@components/interfaces/segment-component.interface';

/**
 * Imports
 */

import { decodeVLQ, encodeArrayVLQ } from '@components/base64.component';

/**
 * Bias options for binary search operations on segment arrays.
 *
 * @remarks
 * Controls how the search behaves when an exact match is not found:
 * - `BOUND`: Returns the closest match
 * - `LOWER_BOUND`: Returns the largest element less than or equal to the target
 * - `UPPER_BOUND`: Returns the smallest element greater than or equal to the target
 *
 * @since 5.0.0
 */

export const enum Bias {
    BOUND,
    LOWER_BOUND,
    UPPER_BOUND
}

/**
 * Creates a new VLQ offset state initialized to zero-based positions.
 *
 * @param namesOffset - Initial name index offset
 * @param sourceOffset - Initial source file index offset
 *
 * @returns A new {@link VLQOffsetInterface} with all positional fields set to zero
 *
 * @remarks
 * This function initializes the mutable running state used by VLQ encoding/decoding
 * operations. The offset tracks cumulative deltas as segments are processed sequentially.
 *
 * All positional fields (line, column, generatedLine, generatedColumn) start at 0
 * because the Source Map v3 spec uses 0-based coordinates internally.
 *
 * @example Creating default offset
 * ```ts
 * const offset = createOffset();
 * // { line: 0, column: 0, generatedLine: 0, generatedColumn: 0, sourceIndex: 0, nameIndex: 0 }
 * ```
 *
 * @example Creating offset with initial indices
 * ```ts
 * const offset = createOffset(5, 2);
 * // { line: 0, column: 0, generatedLine: 0, generatedColumn: 0, sourceIndex: 2, nameIndex: 5 }
 * ```
 *
 * @since 5.0.0
 */

export function createOffset(namesOffset: number = 0, sourceOffset: number = 0): VLQOffsetInterface {
    return {
        line: 0,
        column: 0,
        nameIndex: namesOffset,
        sourceIndex: sourceOffset,
        generatedLine: 0,
        generatedColumn: 0
    };
}
/**
 * Apply a single array of decoded VLQ deltas to the running offset and return
 * a fully resolved, **1-based** {@link SegmentInterface}.
 *
 * @param offset - Mutable VLQ running state; **updated in-place**.
 * @param deltas - Raw integers from `decodeVLQ`: `[genCol, srcIdx, srcLine, srcCol, nameIdx?]`
 *
 * @returns A 1-based segment with all positions resolved
 *
 * @remarks
 * The Source Map v3 spec stores values as 0-based deltas from the previous segment.
 * This function advances the offset in-place and converts to 1-based output, so
 * callers never have to reason about the wire format.
 *
 * Delta array structure:
 * - `[0]`: Generated column delta (always present)
 * - `[1]`: Source file index delta (optional)
 * - `[2]`: Source line delta (optional)
 * - `[3]`: Source column delta (optional)
 * - `[4]`: Name index delta (optional, only when a segment references a name)
 *
 * The offset parameter is mutated to reflect the new accumulated state.
 *
 * @example Decoding segment with name
 * ```ts
 * const offset = createOffset();
 * const segment = decodeSegment(offset, [4, 0, 0, 5, 0]);
 * // { generatedLine: 1, generatedColumn: 5, line: 1, column: 6, sourceIndex: 0, nameIndex: 0 }
 * ```
 *
 * @example Decoding segment without name
 * ```ts
 * const offset = createOffset();
 * const segment = decodeSegment(offset, [10, 1, 2, 3]);
 * // { generatedLine: 1, generatedColumn: 11, line: 3, column: 4, sourceIndex: 1, nameIndex: null }
 * ```
 *
 * @see {@link SegmentInterface} for the resolved segment output
 * @see {@link VLQOffsetInterface} for more details on the running state
 *
 * @since 5.0.0
 */

export function decodeSegment(offset: VLQOffsetInterface, deltas: Array<number>): SegmentInterface {
    const genColDelta  = deltas[0];
    const srcIdxDelta  = deltas[1];
    const srcLineDelta = deltas[2];
    const srcColDelta  = deltas[3];
    const nameIdxDelta = deltas[4]; // undefined when the segment carries no name

    offset.line            += srcLineDelta ?? 0;
    offset.column          += srcColDelta  ?? 0;
    offset.sourceIndex     += srcIdxDelta  ?? 0;
    offset.generatedColumn += genColDelta;
    if (nameIdxDelta !== undefined) offset.nameIndex += nameIdxDelta;

    return {
        // +1 converts 0-based VLQ accumulator → 1-based public API
        line: offset.line + 1,
        column: offset.column + 1,
        generatedLine: offset.generatedLine + 1,
        generatedColumn: offset.generatedColumn + 1,
        sourceIndex: offset.sourceIndex,
        nameIndex: nameIdxDelta !== undefined ? offset.nameIndex : null
    };
}

/**
 * Decode a single raw VLQ segment string into a resolved, **1-based** {@link SegmentInterface}.
 *
 * @param offset - Mutable VLQ running state; **updated in-place**.
 * @param raw - A single VLQ-encoded segment string (e.g. `"AAAA"` or `"kBgB"`)
 *
 * @returns A 1-based segment with all positions resolved
 *
 * @remarks
 * Convenience wrapper around {@link decodeSegment} + {@link decodeVLQ}.
 * This function first decodes the Base64 VLQ string into an array of integers,
 * then processes those deltas to produce the final segment.
 *
 * The offset parameter is advanced to reflect the cumulative state.
 *
 * @example Decoding a raw segment
 * ```ts
 * const offset = createOffset();
 * const segment = decodeSegmentRaw(offset, "AAAA");
 * // Decodes and applies the VLQ-encoded deltas
 * ```
 *
 * @see {@link decodeVLQ} for Base64 VLQ decoding
 * @see {@link decodeSegment} for delta processing
 *
 * @since 5.0.0
 */

export function decodeSegmentRaw(offset: VLQOffsetInterface, raw: string): SegmentInterface {
    return decodeSegment(offset, decodeVLQ(raw));
}

/**
 * Encode a **1-based** {@link SegmentInterface} into a VLQ delta string.
 *
 * @param offset - Mutable VLQ running state; **updated in-place**.
 * @param seg - The 1-based segment to encode
 *
 * @returns A Base64 VLQ-encoded string representing the deltas
 *
 * @remarks
 * The 1-based public values are converted back to 0-based VLQ deltas so the
 * wire format stays spec-compliant with Source Map v3.
 *
 * This function:
 * 1. Converts 1-based positions to 0-based coordinates
 * 2. Computes deltas from the running offset
 * 3. Encodes deltas as Base64 VLQ
 * 4. Updates the offset to reflect the new state
 *
 * The encoded string contains 4 or 5 values:
 * - Generated column delta (always present)
 * - Source file index delta
 * - Source line delta
 * - Source column delta
 * - Name index delta (only if segment has a name)
 *
 * @example Encoding a segment
 * ```ts
 * const offset = createOffset();
 * const encoded = encodeSegment(offset, {
 *     generatedLine: 1, generatedColumn: 5,
 *     line: 1, column: 6,
 *     sourceIndex: 0, nameIndex: 0
 * });
 * // Returns Base64 VLQ string like "IAAMA"
 * ```
 *
 * @see {@link encodeArrayVLQ} for Base64 VLQ encoding
 *
 * @since 5.0.0
 */

export function encodeSegment(offset: VLQOffsetInterface, seg: SegmentInterface): string {
    // Convert 1-based public values → 0-based VLQ space before computing deltas
    const adjLine      = seg.line - 1;
    const adjColumn    = seg.column - 1;
    const adjGenColumn = seg.generatedColumn - 1;

    const deltas: Array<number> = [
        adjGenColumn - offset.generatedColumn, // Δ generatedColumn
        seg.sourceIndex - offset.sourceIndex,  // Δ sourceIndex
        adjLine - offset.line,                 // Δ sourceLine
        adjColumn - offset.column              // Δ sourceColumn
    ];

    if (seg.nameIndex !== null && seg.nameIndex !== undefined) {
        deltas[4] = seg.nameIndex - offset.nameIndex; // Δ nameIndex
        offset.nameIndex = seg.nameIndex;
    }

    offset.generatedColumn = adjGenColumn;
    offset.sourceIndex     = seg.sourceIndex;
    offset.line            = adjLine;
    offset.column          = adjColumn;

    return encodeArrayVLQ(deltas);
}

/**
 * Validate all fields of a {@link SegmentInterface}.
 *
 * @param segment - The segment to validate
 *
 * @throws Error - on the first field that fails validation
 *
 * @remarks
 * Ensures all positional values are finite numbers and that every 1-based
 * position is ≥ 1. Throws on the first invalid field with a descriptive message.
 *
 * Validation rules:
 * - `line`, `column`, `generatedLine`, `generatedColumn`: Must be finite and ≥ 1
 * - `sourceIndex`: Must be a finite number (can be 0)
 * - `nameIndex`: Must be a finite number or `null`
 *
 * @example Valid segment
 * ```ts
 * validateSegment({
 *     line: 1, column: 5,
 *     generatedLine: 1, generatedColumn: 10,
 *     sourceIndex: 0, nameIndex: null
 * });
 * // No error thrown
 * ```
 *
 * @example Invalid segment (throws)
 * ```ts
 * validateSegment({
 *     line: 0, column: 5,
 *     generatedLine: 1, generatedColumn: 10,
 *     sourceIndex: 0, nameIndex: null
 * });
 * // Error: Invalid segment: 'line' must be a finite number ≥ 1, received 0
 * ```
 *
 * @see SegmentInterface
 *
 * @since 5.0.0
 */

export function validateSegment(segment: SegmentInterface): void {
    const positionalFields: ReadonlyArray<keyof SegmentInterface> =
        [ 'line', 'column', 'generatedLine', 'generatedColumn' ];

    for (const field of positionalFields) {
        const value = segment[field] as number;
        if (!Number.isFinite(value) || value < 1)
            throw new Error(`Invalid segment: '${ field }' must be a finite number ≥ 1, received ${ value }`);
    }

    if (!Number.isFinite(segment.sourceIndex))
        throw new Error(`Invalid segment: 'sourceIndex' must be a finite number, received ${ segment.sourceIndex }`);

    if (segment.nameIndex !== null && !Number.isFinite(segment.nameIndex))
        throw new Error(`Invalid segment: 'nameIndex' must be a finite number or null, received ${ segment.nameIndex }`);
}
