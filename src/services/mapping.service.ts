
/**
 * Import will remove at compile time
 */

import type { SegmentInterface } from '@components/interfaces/segment-component.interface';
import type { SegmentsOffsetsInterface } from '@services/interfaces/mapping-service.interface';
import type { SourceMappingType, MappingLineType } from '@services/interfaces/mapping-service.interface';

/**
 * Imports
 */

import { decodeVLQ } from '@components/base64.component';
import { decodeSegment, createOffset, validateSegment, encodeSegment, Bias } from '@components/segment.component';

/**
 * Service for encoding, decoding, and querying Source Map v3 mappings.
 *
 * @remarks
 * This service manages the full lifecycle of source map operations:
 * - Decoding from VLQ-encoded strings or structured arrays
 * - Encoding to VLQ-encoded mapping strings
 * - Querying segments by generated or original positions
 * - Building position indices for efficient lookups
 *
 * The service maintains an internal offset state to support merging multiple
 * source maps and handles both 0-based VLQ wire format and 1-based public API.
 *
 * All line and column positions in the public API are 1-based, consistent
 * with how most editors and tools display positions.
 *
 * @example Basic decoding and encoding
 * ```ts
 * const service = new MappingService();
 * service.decode('AAAA;AACA,AADA;AAGA;');
 * const encoded = service.encode();
 * ```
 *
 * @example Querying segments
 * ```ts
 * const service = new MappingService();
 * service.decode(mappingArray);
 * const segment = service.getSegment(1, 5);
 * ```
 *
 * @since 5.0.0
 */

export class MappingService {
    /**
     * The generated file this source map is associated with.
     *
     * @remarks
     * Optional field specifying the filename of the generated code that this
     * source map describes. This is typically a relative path.
     *
     * Can be `null` or omitted if the filename is not relevant or is provided
     * through other means (e.g., HTTP headers, file naming conventions).
     *
     * @example
     * ```ts
     * file: 'bundle.min.js'
     * ```
     *
     * @since 5.0.0
     */

    private lines: SourceMappingType = [];

    /**
     * List of identifier names referenced in the mappings.
     *
     * @remarks
     * Optional array containing all identifier names (variables, functions, etc.)
     * that are referenced by segments with a `nameIndex`. These names correspond
     * to their positions in the original source code.
     *
     * Segments can reference these names by index to indicate which identifier
     * in the original code corresponds to a position in the generated code.
     *
     * Omit this field if no names need to be tracked, or provide an empty array.
     *
     * @example
     * ```ts
     * names: ['myFunction', 'result', 'value']
     * ```
     *
     * @since 5.0.0
     */

    private readonly offsets: SegmentsOffsetsInterface = {
        line: 0,
        name: 0,
        sources: 0
    };

    /**
     * Gets the current line offset used for coordinate adjustments.
     *
     * @returns The line offset value
     *
     * @remarks
     * This offset is applied when decoding mappings to shift generated line numbers.
     * Useful when merging multiple source maps where line numbers need adjustment.
     *
     * @since 5.0.0
     */

    get lineOffset(): number {
        return this.offsets.line;
    }

    /**
     * Gets the current name index offset used for coordinate adjustments.
     *
     * @returns The name index offset value
     *
     * @remarks
     * This offset is applied when decoding mappings to shift name indices.
     * Necessary when concatenating source maps with different name arrays.
     *
     * @since 5.0.0
     */

    get namesOffset(): number {
        return this.offsets.name;
    }

    /**
     * Gets the current source file index offset used for coordinate adjustments.
     *
     * @returns The source index offset value
     *
     * @remarks
     * This offset is applied when decoding mappings to shift source file indices.
     * Required when merging source maps with different source file arrays.
     *
     * @since 5.0.0
     */

    get sourcesOffset(): number {
        return this.offsets.sources;
    }

    /**
     * Encodes all stored mappings to a Source Map v3 VLQ string.
     *
     * @returns A Base64 VLQ-encoded mappings string
     *
     * @remarks
     * Converts the internal 1-based segment representation to 0-based VLQ deltas
     * and encodes them as a semicolon-separated string where:
     * - Semicolons (`;`) separate lines
     * - Commas (`,`) separate segments within a line
     * - Empty frames are represented as empty strings between semicolons
     *
     * The encoding process:
     * 1. Resets column offset at each line boundary
     * 2. Computes deltas relative to a previous segment
     * 3. Encodes deltas using Base64 VLQ
     *
     * @example Encoding mappings
     * ```ts
     * const service = new MappingService();
     * service.decode(mappingArray);
     * const vlqString = service.encode();
     * // Returns: "AAAA;AACA,AADA;AAGA;"
     * ```
     *
     * @since 5.0.0
     */

    encode(): string {
        return this.encodeSourceMapping(this.lines);
    }

    /**
     * Decodes and stores source map data from various input formats.
     *
     * @param mapping - Source map data (VLQ string, array, or MappingService instance)
     * @param namesOffset - Offset to apply to name indices (default: 0)
     * @param sourcesOffset - Offset to apply to source file indices (default: 0)
     * @param lineOffset - Offset to apply to generated line numbers (default: 0)
     *
     * @throws Error - If the mapping format is invalid or contains malformed data
     *
     * @remarks
     * Accepts three input formats:
     * - **VLQ string**: Standard Source Map v3 encoded mappings
     * - **Array**: Structured {@link SourceMappingType} with segments
     * - **MappingService**: Another service instance (copies its lines)
     *
     * Offsets are useful when merging multiple source maps, allowing index
     * adjustment to prevent conflicts in name and source arrays.
     *
     * The method appends to existing mappings, so calling it multiple times
     * will accumulate all decoded segments.
     *
     * @example Decoding from string
     * ```ts
     * const service = new MappingService();
     * service.decode('AAAA;AACA;AADA;');
     * ```
     *
     * @example Decoding with offsets
     * ```ts
     * const service = new MappingService();
     * service.decode(mappingArray, 5, 3, 10);
     * // All name indices += 5, source indices += 3, generated lines += 10
     * ```
     *
     * @example Decoding from another service
     * ```ts
     * const source = new MappingService();
     * source.decode('AAAA;');
     * const target = new MappingService();
     * target.decode(source);
     * ```
     *
     * @since 5.0.0
     */

    decode(mapping: MappingService | SourceMappingType | string, namesOffset = 0, sourcesOffset = 0, lineOffset = 0): void {
        this.offsets.line = lineOffset;
        this.offsets.name = namesOffset;
        this.offsets.sources = sourcesOffset;
        const raw = mapping instanceof MappingService ? mapping.lines : mapping;

        if (Array.isArray(raw)) {
            this.decodeSourceMappingArray(raw);
        } else {
            this.decodeSourceMappingString(raw as string);
        }
    }

    /**
     * Finds a segment at the specified generated position using binary search.
     *
     * @param generatedLine - 1-based generated line number
     * @param generatedColumn - 1-based generated column number
     * @param bias - Search behavior when no exact match exists (default: {@link Bias.BOUND})
     *
     * @returns The matching segment, or `null` if no suitable segment exists
     *
     * @remarks
     * Uses binary search for O(log n) performance on sorted segment arrays.
     *
     * Bias behavior:
     * - **`BOUND`**: Returns exact matches only
     * - **`LOWER_BOUND`**: Returns the largest segment ≤ target column
     * - **`UPPER_BOUND`**: Returns the smallest segment ≥ target column
     *
     * The line index is adjusted by the current {@link lineOffset} to support
     * merged source maps with shifted line numbers.
     *
     * @example Finding exact segment
     * ```ts
     * const service = new MappingService();
     * service.decode(mappings);
     * const segment = service.getSegment(1, 5);
     * // Returns a segment at line 1, column 5, or null
     * ```
     *
     * @example Finding nearest lower bound
     * ```ts
     * const segment = service.getSegment(1, 7, Bias.LOWER_BOUND);
     * // Returns the closest segment at or before column 7
     * ```
     *
     * @see {@link Bias} for bias options
     * @see {@link getOriginalSegment} for reverse lookups
     *
     * @since 5.0.0
     */

    getSegment(generatedLine: number, generatedColumn: number, bias: Bias = Bias.BOUND): SegmentInterface | null {
        const lineIndex = generatedLine - this.offsets.line - 1;
        const segments = this.lines[lineIndex];
        if (!segments || segments.length === 0) return null;

        let low = 0;
        let high = segments.length - 1;
        let closest: SegmentInterface | null = null;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const seg = segments[mid];

            if (seg.generatedColumn < generatedColumn) {
                low = mid + 1;
                if (bias === Bias.LOWER_BOUND) closest = seg;
            } else if (seg.generatedColumn > generatedColumn) {
                high = mid - 1;
                if (bias === Bias.UPPER_BOUND) closest = seg;
            } else {
                return seg;
            }
        }

        return closest;
    }

    /**
     * Finds a segment at the specified original source position using linear search.
     *
     * @param sourceLine - 1-based original source line number
     * @param sourceColumn - 1-based original source column number
     * @param sourceIndex - Source file index
     * @param bias - Search behavior when no exact match exists (default: {@link Bias.BOUND})
     *
     * @returns The matching segment, or `null` if no suitable segment exists
     *
     * @remarks
     * Performs exhaustive linear search across all segments to find matches
     * by original position. For frequent lookups, consider building an index
     * first using {@link buildOriginalPositionIndex}.
     *
     * Returns immediately on the exact column match. For bias modes, tracks the
     * closest segment by computing column distance.
     *
     * Bias behavior:
     * - **`BOUND`**: Returns exact matches only
     * - **`LOWER_BOUND`**: Returns the closest segment with column ≤ target
     * - **`UPPER_BOUND`**: Returns the closest segment with column ≥ target
     *
     * @example Finding original segment
     * ```ts
     * const service = new MappingService();
     * service.decode(mappings);
     * const segment = service.getOriginalSegment(10, 25, 0);
     * // Returns segment mapping to source file 0, line 10, column 25
     * ```
     *
     * @example Finding the nearest original position
     * ```ts
     * const segment = service.getOriginalSegment(10, 25, 0, Bias.LOWER_BOUND);
     * // Returns the closest segment at or before column 25
     * ```
     *
     * @see {@link Bias} for bias options
     * @see {@link getSegment} for generated position lookups
     * @see {@link buildOriginalPositionIndex} for optimized repeated lookups
     *
     * @since 5.0.0
     */

    getOriginalSegment(sourceLine: number, sourceColumn: number, sourceIndex: number, bias: Bias = Bias.BOUND): SegmentInterface | null {
        let closest: SegmentInterface | null = null;
        let closestDist = Infinity;

        for (let i = 0; i < this.lines.length; i++) {
            const segments = this.lines[i];
            if (!segments) continue;

            for (let j = 0; j < segments.length; j++) {
                const seg = segments[j];
                if (seg.sourceIndex !== sourceIndex || seg.line !== sourceLine) continue;

                const col = seg.column;
                if (col === sourceColumn) return seg;

                if (bias === Bias.LOWER_BOUND) {
                    if (col < sourceColumn) {
                        const dist = sourceColumn - col;
                        if (dist < closestDist) { closestDist = dist; closest = seg; }
                    }
                } else if (bias === Bias.UPPER_BOUND) {
                    if (col > sourceColumn) {
                        const dist = col - sourceColumn;
                        if (dist < closestDist) { closestDist = dist; closest = seg; }
                    }
                }
            }
        }

        return closest;
    }

    /**
     * Builds an indexed map of segments grouped by original source position.
     *
     * @returns A map keyed by `"sourceIndex:line"` with sorted segment arrays
     *
     * @remarks
     * Creates a lookup structure for efficient reverse mapping from original
     * to generated positions. Each bucket contains all segments that map to
     * the same source file and line, sorted by column in ascending order.
     *
     * The index structure:
     * - **Keys**: Formatted as `"sourceIndex:line"` (e.g., `"0:1"`, `"2:15"`)
     * - **Values**: Arrays of {@link SegmentInterface} sorted by `column`
     *
     * This is useful when performing many original position lookups, as it
     * avoids the O(n) linear search of {@link getOriginalSegment}.
     *
     * Null/empty lines are safely skipped during index construction.
     *
     * @example Building and using index
     * ```ts
     * const service = new MappingService();
     * service.decode(mappings);
     * const index = service.buildOriginalPositionIndex();
     *
     * const segments = index.get('0:10');
     * // Returns all segments mapping to source file 0, line 10
     * ```
     *
     * @example Binary search on indexed bucket
     * ```ts
     * const index = service.buildOriginalPositionIndex();
     * const bucket = index.get('0:10') || [];
     * // Perform binary search on bucket for specific column
     * ```
     *
     * @see {@link getOriginalSegment} for single lookups
     *
     * @since 5.0.0
     */

    buildOriginalPositionIndex(): Map<string, Array<SegmentInterface>> {
        const index = new Map<string, Array<SegmentInterface>>();

        for (let i = 0; i < this.lines.length; i++) {
            const segments = this.lines[i];
            if (!segments) continue;

            for (let j = 0; j < segments.length; j++) {
                const seg = segments[j];
                const key = `${ seg.sourceIndex }:${ seg.line }`;
                let bucket = index.get(key);
                if (!bucket) { bucket = []; index.set(key, bucket); }
                bucket.push(seg);
            }
        }

        for (const bucket of index.values()) {
            bucket.sort((a, b) => a.column - b.column);
        }

        return index;
    }

    /**
     * Encodes a structured source mapping array to a VLQ string.
     *
     * @param sourceMapping - Array of segment lines to encode
     *
     * @returns A Base64 VLQ-encoded mappings string
     *
     * @remarks
     * Converts 1-based segment positions to 0-based VLQ deltas and encodes
     * them according to Source Map v3 specification.
     *
     * The encoding process:
     * 1. Pre-allocates arrays for optimal performance
     * 2. Resets `generatedColumn` offset to 0 at each line boundary
     * 3. Encodes each segment as deltas from the previous segment
     * 4. Joins segments with commas (`,`) and lines with semicolons (`;`)
     *
     * Null lines are encoded as empty strings (represented by consecutive
     * semicolons in the output).
     *
     * This method never reads the `generatedLine` field from segments, as
     * line boundaries are encoded structurally via semicolons.
     *
     * @example Internal encoding
     * ```ts
     * const encoded = this.encodeSourceMapping([
     *     [{ generatedColumn: 1, sourceIndex: 0, line: 1, column: 1, nameIndex: null, generatedLine: 1 }],
     *     null,
     *     [{ generatedColumn: 5, sourceIndex: 0, line: 2, column: 5, nameIndex: null, generatedLine: 3 }]
     * ]);
     * // Returns: "AAAA;;IAIA"
     * ```
     *
     * @see {@link encode} for public API
     * @see {@link encodeSegment} for single segment encoding
     *
     * @since 5.0.0
     */

    private encodeSourceMapping(sourceMapping: SourceMappingType): string {
        const offset = createOffset();
        const encodedLines: Array<string> = new Array(sourceMapping.length);

        for (let i = 0; i < sourceMapping.length; i++) {
            const lineSegments = sourceMapping[i];
            offset.generatedColumn = 0;

            if (!lineSegments) {
                encodedLines[i] = '';
                continue;
            }

            const encodedSegments: Array<string> = new Array(lineSegments.length);
            for (let j = 0; j < lineSegments.length; j++) {
                encodedSegments[j] = encodeSegment(offset, lineSegments[j]);
            }
            encodedLines[i] = encodedSegments.join(',');
        }

        return encodedLines.join(';');
    }

    /**
     * Validates that a string contains only valid VLQ characters.
     *
     * @param raw - String to validate
     *
     * @returns `true` if the string is valid, `false` otherwise
     *
     * @remarks
     * Checks that the input contains only characters from the Source Map v3
     * VLQ alphabet plus structural separators:
     * - Base64 VLQ characters: `A-Z`, `a-z`, `0-9`, `+`, `/`
     * - Separators: `,` (segments), `;` (lines)
     *
     * Empty strings are considered invalid.
     *
     * @example Valid mapping string
     * ```ts
     * this.validateSourceMappingString('AAAA;AACA,AADA;')
     * // Returns: true
     * ```
     *
     * @example Invalid mapping string
     * ```ts
     * this.validateSourceMappingString('AAAA;A#A;')
     * // Returns: false (contains '#')
     * ```
     *
     * @since 5.0.0
     */

    private validateSourceMappingString(raw: string): boolean {
        return /^[a-zA-Z0-9+/,;]+$/.test(raw);
    }

    /**
     * Decodes a structured source mapping array and appends segments to internal state.
     *
     * @param sourceMapping - Array of segment lines or null
     *
     * @throws Error - If the array structure is invalid or segments fail validation
     *
     * @remarks
     * Processes a pre-parsed {@link SourceMappingType} array, applying configured
     * offsets to all indices and positions.
     *
     * The decoding process:
     * 1. Validates that input is an array
     * 2. Pre-computes combined line shift for performance
     * 3. Validates each segment using {@link validateSegment}
     * 4. Applies name, source, and line offsets to all coordinates
     * 5. Appends decoded segments to an internal lines array
     *
     * Null lines are preserved as-is. Each segment is validated before the offset
     * application to ensure data integrity.
     *
     * Error messages include 1-based line numbers for easier debugging.
     *
     * @example Internal array decoding
     * ```ts
     * this.decodeSourceMappingArray([
     *     [{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 }],
     *     null,
     *     [{ line: 2, column: 5, nameIndex: 0, sourceIndex: 0, generatedLine: 3, generatedColumn: 3 }]
     * ]);
     * ```
     *
     * @see {@link decode} for public API
     * @see {@link validateSegment} for validation rules
     *
     * @since 5.0.0
     */

    private decodeSourceMappingArray(sourceMapping: SourceMappingType): void {
        if (!Array.isArray(sourceMapping))
            throw new Error('Invalid source mapping: expected an array of lines.');

        const lineAppendOffset = this.lines.length;
        const { name: namesOffset, sources: sourcesOffset, line: lineOffset } = this.offsets;
        const totalLineShift = lineAppendOffset + lineOffset;

        for (let i = 0; i < sourceMapping.length; i++) {
            const lineSegments = sourceMapping[i];

            if (!lineSegments) {
                this.lines.push(lineSegments);
                continue;
            }

            if (!Array.isArray(lineSegments))
                throw new Error(`Invalid source mapping at line ${ i + 1 }: expected an array of segments, got ${ typeof lineSegments }.`);

            try {
                const decodedSegments: MappingLineType = new Array(lineSegments.length);
                for (let s = 0; s < lineSegments.length; s++) {
                    const seg = lineSegments[s];
                    validateSegment(seg);
                    decodedSegments[s] = {
                        ...seg,
                        nameIndex: typeof seg.nameIndex === 'number' ? seg.nameIndex + namesOffset : null,
                        sourceIndex: seg.sourceIndex + sourcesOffset,
                        generatedLine: seg.generatedLine + totalLineShift
                    };
                }
                this.lines.push(decodedSegments);
            } catch (error: unknown) {
                throw new Error(`Error decoding mappings at line ${ i + 1 }: ${ error instanceof Error ? error.message : String(error) }`);
            }
        }
    }

    /**
     * Decodes a VLQ-encoded mapping string and appends segments to internal state.
     *
     * @param encodedMapping - Base64 VLQ-encoded mappings string
     *
     * @throws Error - If the string format is invalid or decoding fails
     *
     * @remarks
     * Parses a Source Map v3 VLQ string into structured segments with 1-based
     * positions, applying configured offsets.
     *
     * The decoding process:
     * 1. Validates a character set using {@link validateSourceMappingString}
     * 2. Splits string by semicolons (`;`) to separate lines
     * 3. Pre-computes offset flags to minimize branching in hot loop
     * 4. For each line:
     *    - Resets `generatedColumn` offset to 0
     *    - Splits by commas (`,`) to separate segments
     *    - Decodes VLQ deltas using {@link decodeVLQ}
     *    - Applies offsets (only allocating new objects when needed)
     * 5. Appends decoded segments to an internal lines array
     *
     * Empty lines (consecutive semicolons) are stored as `null`.
     *
     * Line offset is only applied when non-zero, avoiding unnecessary object
     * allocations for the common case.
     *
     * Error messages include 1-based line numbers for debugging.
     *
     * @example Internal string decoding
     * ```ts
     * this.decodeSourceMappingString('AAAA;AACA,AADA;AAGA;');
     * ```
     *
     * @see {@link decode} for public API
     * @see {@link decodeVLQ} for VLQ decoding
     * @see {@link decodeSegment} for delta application
     *
     * @since 5.0.0
     */

    private decodeSourceMappingString(encodedMapping: string): void {
        if (!this.validateSourceMappingString(encodedMapping))
            throw new Error('Invalid mappings string: contains characters outside the VLQ alphabet.');

        const encodedLines = encodedMapping.split(';');
        const lineAppendOffset = this.lines.length;
        const { name: namesOffset, sources: sourcesOffset, line: lineOffset } = this.offsets;
        const offset = createOffset(namesOffset, sourcesOffset);
        const applyLineOffset = lineOffset !== 0;

        for (let i = 0; i < encodedLines.length; i++) {
            const encodedLine = encodedLines[i];

            if (!encodedLine) {
                this.lines.push(null);
                continue;
            }

            offset.generatedColumn = 0;
            offset.generatedLine = lineAppendOffset + i;

            const rawSegments = encodedLine.split(',');
            const decodedSegments: Array<SegmentInterface> = new Array(rawSegments.length);

            try {
                for (let s = 0; s < rawSegments.length; s++) {
                    const seg = decodeSegment(offset, decodeVLQ(rawSegments[s]));
                    decodedSegments[s] = applyLineOffset
                        ? { ...seg, generatedLine: seg.generatedLine + lineOffset }
                        : seg;
                }
            } catch (error) {
                throw new Error(`Error decoding mappings at line ${ i + 1 }: ${ (error as Error).message }`);
            }

            this.lines.push(decodedSegments);
        }
    }
}
