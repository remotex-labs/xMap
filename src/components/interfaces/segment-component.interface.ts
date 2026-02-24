
/**
 * A single decoded segment in a source map.
 *
 * @remarks
 * All line and column values are **1-based** for the public API.
 * This represents a mapping between a position in the generated (output) file
 * and the corresponding position in the original source file.
 *
 * Each segment can optionally reference a name from the source map's `names` array,
 * typically used for identifier mappings (e.g., minified variable names).
 *
 * @example Basic segment
 * ```ts
 * const segment: SegmentInterface = {
 *     generatedLine: 1,
 *     generatedColumn: 5,
 *     line: 10,
 *     column: 15,
 *     sourceIndex: 0,
 *     nameIndex: null
 * };
 * ```
 *
 * @example Segment with name reference
 * ```ts
 * const segment: SegmentInterface = {
 *     generatedLine: 1,
 *     generatedColumn: 10,
 *     line: 5,
 *     column: 20,
 *     sourceIndex: 0,
 *     nameIndex: 3  // References names[3] in the source map
 * };
 * ```
 *
 * @see {@link VLQOffsetInterface}
 *
 * @since 5.0.0
 */

export interface SegmentInterface {
    /**
     * 1-based line in the original source file.
     *
     * @remarks
     * Corresponds to the original source position before transformation.
     * Always ≥ 1 for valid segments.
     *
     * @since 5.0.0
     */

    line: number;

    /**
     * 1-based column in the original source file.
     *
     * @remarks
     * Corresponds to the original source position before transformation.
     * Always ≥ 1 for valid segments.
     *
     * @since 5.0.0
     */

    column: number;

    /**
     * 1-based line in the generated (output) file.
     *
     * @remarks
     * Corresponds to the position in the transformed/compiled output.
     * Always ≥ 1 for valid segments.
     *
     * @since 5.0.0
     */

    generatedLine: number;

    /**
     * 1-based column in the generated (output) file.
     *
     * @remarks
     * Corresponds to the position in the transformed/compiled output.
     * Always ≥ 1 for valid segments.
     *
     * @since 5.0.0
     */

    generatedColumn: number;

    /**
     * Index into the source map's `sources` array.
     *
     * @remarks
     * This is 0-based and references which source file this segment maps to.
     * Must be a finite number ≥ 0.
     *
     * @since 5.0.0
     */

    sourceIndex: number;

    /**
     * Index into the source map's `names` array, or null when absent.
     *
     * @remarks
     * This is 0-based and references an identifier name (e.g., variable or function name)
     * in the source map. When `null`, this segment does not reference a name.
     *
     * Typically used for preserving original identifier names after minification.
     *
     * @since 5.0.0
     */

    nameIndex: number | null;
}

/**
 * Internal VLQ running-state used while incrementally encoding or decoding deltas.
 *
 * @remarks
 * All fields are **0-based** — the Source Map v3 wire format is 0-based throughout.
 * This type is an implementation detail; callers work with {@link SegmentInterface} instead.
 *
 * The offset is mutated in-place as segments are processed sequentially, accumulating
 * deltas from the VLQ-encoded mappings string. This avoids repeated conversions between
 * 0-based and 1-based coordinates.
 *
 * @example Creating initial offset
 * ```ts
 * const offset: VLQOffsetInterface = {
 *     line: 0,
 *     column: 0,
 *     generatedLine: 0,
 *     generatedColumn: 0,
 *     sourceIndex: 0,
 *     nameIndex: 0
 * };
 * ```
 *
 * @see {@link createVLQOffset}
 * @see {@link SegmentInterface}
 *
 * @since 5.0.0
 */

export interface VLQOffsetInterface {
    /**
     * 0-based running source line.
     *
     * @remarks
     * Accumulates line deltas from decoded VLQ segments.
     * Internal representation only; converted to 1-based for public API.
     *
     * @since 5.0.0
     */

    line: number;

    /**
     * 0-based running source column.
     *
     * @remarks
     * Accumulates column deltas from decoded VLQ segments.
     * Internal representation only; converted to 1-based for public API.
     *
     * @since 5.0.0
     */

    column: number;

    /**
     * 0-based running generated line (frame index).
     *
     * @remarks
     * Tracks the current line in the generated output file.
     * Internal representation only; converted to 1-based for public API.
     *
     * @since 5.0.0
     */

    generatedLine: number;

    /**
     * 0-based running generated column — resets to 0 at the start of each line.
     *
     * @remarks
     * Accumulates column deltas within the current generated line.
     * Resets to 0 when moving to a new line in the mappings.
     * Internal representation only; converted to 1-based for public API.
     *
     * @since 5.0.0
     */

    generatedColumn: number;

    /**
     * 0-based running source index.
     *
     * @remarks
     * Accumulates source file index deltas from decoded VLQ segments.
     * References to the `sources` array in the source map.
     *
     * @since 5.0.0
     */

    sourceIndex: number;

    /**
     * 0-based running name index.
     *
     * @remarks
     * Accumulates name index deltas from decoded VLQ segments.
     * References the `names` array in the source map.
     *
     * @since 5.0.0
     */

    nameIndex: number;
}
