/**
 * Import will remove at compile time
 */

import type { SegmentInterface } from '@components/interfaces/segment-component.interface';

/**
 * Offset values for adjusting segment indices and positions during decode operations.
 *
 * @remarks
 * This interface defines the offset state used by `MappingService` when
 * decoding and merging multiple source maps. Each offset is applied to its
 * corresponding segment field to shift indices and positions.
 *
 * Common use case: When concatenating multiple source maps, offsets prevent
 * index conflicts in shared arrays (names, sources) and adjust line numbers
 * to account for concatenated generated code.
 *
 * All offset values default to 0 when no adjustment is needed.
 *
 * @example Offset configuration for merged maps
 * ```ts
 * const offsets: SegmentsOffsetsInterface = {
 *     line: 100,      // Generated lines start at 101
 *     name: 5,        // a Name array starts at index 5
 *     sources: 3      // Source array starts at index 3
 * };
 * ```
 *
 * @since 5.0.0
 */

export interface SegmentsOffsetsInterface {
    /**
     * Offset applied to generated line numbers.
     *
     * @remarks
     * Added to each segment's `generatedLine` field during decoding.
     * Used when merging source maps to shift line numbers for concatenated output.
     *
     * @since 5.0.0
     */
    line: number;

    /**
     * Offset applied to name indices.
     *
     * @remarks
     * Added to each segment's `nameIndex` field during decoding.
     * Necessary when merging source maps with different name arrays to prevent
     * index collisions.
     *
     * @since 5.0.0
     */
    name: number;

    /**
     * Offset applied to source file indices.
     *
     * @remarks
     * Added to each segment's `sourceIndex` field during decoding.
     * Required when merging source maps with different source file arrays to
     * maintain correct references.
     *
     * @since 5.0.0
     */
    sources: number;
}

/**
 * All segments for a single generated line, sorted by column position.
 *
 * @remarks
 * Represents a complete mapping line where all segments share the same
 * `generatedLine` value and are ordered by `generatedColumn` in ascending order.
 *
 * The sorted order enables efficient binary search operations when looking up
 * segments by generated column position. This ordering is maintained by both
 * encoding and decoding operations.
 *
 * An empty array indicates a generated line exists but has no source mappings.
 *
 * @example Single line with multiple segments
 * ```ts
 * const line: MappingLineType = [
 *     { generatedLine: 1, generatedColumn: 1, line: 1, column: 1, sourceIndex: 0, nameIndex: null },
 *     { generatedLine: 1, generatedColumn: 5, line: 1, column: 3, sourceIndex: 0, nameIndex: null },
 *     { generatedLine: 1, generatedColumn: 10, line: 1, column: 8, sourceIndex: 0, nameIndex: 0 }
 * ];
 * ```
 *
 * @see {@link SegmentInterface} for segment structure
 * @see {@link SourceMappingType} for the complete mapping structure
 *
 * @since 5.0.0
 */

export type MappingLineType = Array<SegmentInterface>;

/**
 * Complete source map represented as an array of mapping lines.
 *
 * @remarks
 * The decoded representation of a Source Map v3 mappings field, structured as
 * an array where each index corresponds to a 0-based generated line number.
 *
 * Each entry is either:
 * - **`MappingLineType`**: An array of segments for that generated line
 * - **`null`**: Indicates the generated line has no source mappings
 *
 * The array index directly corresponds to generated line numbers (0-based),
 * so `SourceMappingType[0]` contains mappings for generated line 1.
 *
 * Null entries are common for:
 * - Empty lines in generated code
 * - Lines without corresponding source positions
 * - Structural spacing preserved in the encoding
 *
 * This structure optimizes for O(1) line lookups and maintains the natural
 * ordering of generated code.
 *
 * @example Complete mapping with null line
 * ```ts
 * const mapping: SourceMappingType = [
 *     [{ generatedLine: 1, generatedColumn: 1, line: 1, column: 1, sourceIndex: 0, nameIndex: null }],
 *     null,  // Generated line 2 has no mappings
 *     [{ generatedLine: 3, generatedColumn: 1, line: 2, column: 1, sourceIndex: 0, nameIndex: null }]
 * ];
 * ```
 *
 * @example Empty mapping
 * ```ts
 * const mapping: SourceMappingType = [];
 * ```
 *
 * @see {@link MappingLineType} for line structure
 * @see {@link SegmentInterface} for segment details
 *
 * @since 5.0.0
 */

export type SourceMappingType = Array<MappingLineType | null>;
