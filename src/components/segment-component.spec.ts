/**
 * Import will remove at compile time
 */

import type { SegmentInterface, VLQOffsetInterface } from '@components/interfaces/segment-component.interface';

/**
 * Imports
 */

import { encodeSegment, validateSegment } from '@components/segment.component';
import { createOffset, decodeSegmentRaw, decodeSegment } from '@components/segment.component';

/**
 * Tests
 */

describe('createVlqOffset', () => {
    test('creates a fully zeroed offset by default', () => {
        expect(createOffset()).toEqual({
            line: 0,
            column: 0,
            nameIndex: 0,
            sourceIndex: 0,
            generatedLine: 0,
            generatedColumn: 0
        });
    });

    test('applies namesOffset to nameIndex, sourceOffset to sourceIndex', () => {
        expect(createOffset(5, 2)).toEqual({
            line: 0,
            column: 0,
            nameIndex: 5,
            sourceIndex: 2,
            generatedLine: 0,
            generatedColumn: 0
        });
    });

    test('namesOffset only — sourceIndex stays 0', () => {
        expect(createOffset(3)).toMatchObject({ nameIndex: 3, sourceIndex: 0 });
    });

    test('returns a new object each call (no shared state)', () => {
        const a = createOffset();
        const b = createOffset();
        a.line = 99;
        expect(b.line).toBe(0);
    });
});

describe('decodeSegmentVlq', () => {
    test('decodes a 5-delta segment (with name) and mutates offset correctly', () => {
        const offset = createOffset();
        const decoded = decodeSegment(offset, [ 4, 1, 2, 3, 5 ]);

        // All values 1-based: 0-based accumulator + 1
        expect(decoded).toEqual({
            line: 3,            // 0+2+1
            column: 4,          // 0+3+1
            generatedLine: 1,   // generatedLine accumulator is 0; +1 = 1
            generatedColumn: 5, // 0+4+1
            sourceIndex: 1,
            nameIndex: 5        // 0+5
        });

        expect(offset).toEqual({
            line: 2,
            column: 3,
            generatedLine: 0,   // generatedLine is managed externally (by MappingService frame loop)
            generatedColumn: 4,
            sourceIndex: 1,
            nameIndex: 5
        });
    });

    test('decodes a 4-delta segment (no name) and returns nameIndex: null', () => {
        const offset = createOffset(7, 0);
        const decoded = decodeSegment(offset, [ 2, 0, 0, 1 ]);

        expect(decoded).toEqual({
            line: 1,
            column: 2,
            generatedLine: 1,
            generatedColumn: 3,
            sourceIndex: 0,
            nameIndex: null     // no 5th delta → null
        });
        // nameIndex accumulator must NOT be touched
        expect(offset.nameIndex).toBe(7);
    });

    test('accumulates deltas across multiple calls on the same offset', () => {
        const offset = createOffset();

        decodeSegment(offset, [ 2, 0, 1, 3 ]); // first segment
        const second = decodeSegment(offset, [ 1, 0, 0, 2 ]);

        expect(second).toEqual({
            line: 2,            // 1+0+1
            column: 6,          // 3+2+1
            generatedLine: 1,
            generatedColumn: 4, // 2+1+1
            sourceIndex: 0,
            nameIndex: null
        });
    });

    test('handles negative deltas (backwards source reference)', () => {
        const offset = createOffset();
        offset.line = 5;
        offset.column = 10;
        offset.generatedColumn = 8;

        const decoded = decodeSegment(offset, [ 2, 0, -3, -4 ]);

        expect(decoded).toEqual({
            line: 3,             // 5-3+1
            column: 7,           // 10-4+1
            generatedLine: 1,
            generatedColumn: 11, // 8+2+1
            sourceIndex: 0,
            nameIndex: null
        });
    });

    test('nameIndex delta of 0 still marks the segment as having a name', () => {
        const offset = createOffset(3, 0);
        const decoded = decodeSegment(offset, [ 0, 0, 0, 0, 0 ]);

        // nameIdxDelta is 0 (not undefined), so nameIndex should be the current accumulator
        expect(decoded.nameIndex).toBe(3);
        expect(offset.nameIndex).toBe(3);
    });

    test('sourceIndex accumulates across segments from different sources', () => {
        const offset = createOffset();
        decodeSegment(offset, [ 0, 2, 0, 0 ]); // jump to source 2
        const seg = decodeSegment(offset, [ 0, 1, 0, 0 ]); // advance to source 3

        expect(seg.sourceIndex).toBe(3);
        expect(offset.sourceIndex).toBe(3);
    });
});

describe('decodeSegmentRaw', () => {
    test('"AAAA" decodes to the all-ones 1-based segment', () => {
        const offset = createOffset();
        const seg = decodeSegmentRaw(offset, 'AAAA');

        expect(seg).toEqual({
            line: 1,
            column: 1,
            generatedLine: 1,
            generatedColumn: 1,
            sourceIndex: 0,
            nameIndex: null
        });
    });

    test('decodes two consecutive raw segments using shared running state', () => {
        const offset = createOffset();

        const first = decodeSegmentRaw(offset, 'AAAA'); // [0,0,0,0]
        const second = decodeSegmentRaw(offset, 'GCCI'); // [3,1,1,4]

        expect(first).toEqual({
            line: 1,
            column: 1,
            generatedLine: 1,
            generatedColumn: 1,
            sourceIndex: 0,
            nameIndex: null
        });

        expect(second).toEqual({
            line: 2,            // 0+1+1
            column: 5,          // 0+4+1
            generatedLine: 1,
            generatedColumn: 4, // 0+3+1
            sourceIndex: 1,
            nameIndex: null
        });
    });

    test('decodes a segment with a name (5 VLQ values)', () => {
        // AAAAA = [0,0,0,0,0] — all zeros including nameIdx
        const offset = createOffset();
        const seg = decodeSegmentRaw(offset, 'AAAAA');

        expect(seg.nameIndex).toBe(0); // present but zero
    });
});

describe('encodeSegment', () => {
    test('encodes a segment without nameIndex as a 4-value VLQ string', () => {
        const offset = createOffset();
        const seg: SegmentInterface = {
            line: 2,
            column: 5,
            generatedLine: 1,
            generatedColumn: 4,
            sourceIndex: 1,
            nameIndex: null
        };

        // adjGenCol=3, adjLine=1, adjCol=4; deltas from zero: [3,1,1,4] → "GCCI"
        expect(encodeSegment(offset, seg)).toBe('GCCI');

        expect(offset).toEqual({
            line: 1,
            column: 4,
            generatedLine: 0,
            generatedColumn: 3,
            sourceIndex: 1,
            nameIndex: 0
        });
    });

    test('encodes a segment with nameIndex as a 5-value VLQ string', () => {
        const offset: VLQOffsetInterface = {
            line: 1,
            column: 4,
            generatedLine: 0,
            generatedColumn: 3,
            sourceIndex: 1,
            nameIndex: 2
        };
        const seg: SegmentInterface = {
            line: 3,
            column: 9,
            generatedLine: 1,
            generatedColumn: 7,
            sourceIndex: 2,
            nameIndex: 5
        };

        // adjGenCol=6, adjLine=2, adjCol=8
        // deltas: [6-3=3, 2-1=1, 2-1=1, 8-4=4, 5-2=3] = [3,1,1,4,3] → "GCCIG"
        expect(encodeSegment(offset, seg)).toBe('GCCIG');

        expect(offset).toEqual({
            line: 2,
            column: 8,
            generatedLine: 0,
            generatedColumn: 6,
            sourceIndex: 2,
            nameIndex: 5
        });
    });

    test('encodes negative deltas correctly (backwards column movement)', () => {
        const offset: VLQOffsetInterface = {
            line: 5,
            column: 10,
            generatedLine: 0,
            generatedColumn: 8,
            sourceIndex: 0,
            nameIndex: 0
        };
        const seg: SegmentInterface = {
            line: 3,
            column: 7,           // line goes backwards: delta -2; column: delta -3
            generatedLine: 1,
            generatedColumn: 11, // genCol: delta +2
            sourceIndex: 0,
            nameIndex: null
        };

        const encoded = encodeSegment(offset, seg);
        // Verify by round-tripping
        const decodeOffset: VLQOffsetInterface = {
            line: 5,
            column: 10,
            generatedLine: 0,
            generatedColumn: 8,
            sourceIndex: 0,
            nameIndex: 0
        };
        expect(decodeSegmentRaw(decodeOffset, encoded)).toMatchObject({
            line: 3, column: 7, generatedColumn: 11
        });
    });

    test('does NOT include nameIndex delta when nameIndex is null', () => {
        const offset = createOffset();
        const seg: SegmentInterface = {
            line: 1,
            column: 1,
            generatedLine: 1,
            generatedColumn: 1,
            sourceIndex: 0,
            nameIndex: null
        };

        // "AAAA" = 4 values; a 5th value would mean a nameIndex is present
        expect(encodeSegment(offset, seg)).toBe('AAAA');
    });

    test('nameIndex of 0 is included (0 ≠ null)', () => {
        const offset = createOffset();
        const seg: SegmentInterface = {
            line: 1,
            column: 1,
            generatedLine: 1,
            generatedColumn: 1,
            sourceIndex: 0,
            nameIndex: 0
        };

        expect(encodeSegment(offset, seg)).toBe('AAAAA');
    });

    test('round-trips: encode then decode returns the original segment', () => {
        const seg: SegmentInterface = {
            line: 4,
            column: 10,
            generatedLine: 1,
            generatedColumn: 8,
            sourceIndex: 3,
            nameIndex: 6
        };

        const encoded = encodeSegment(createOffset(), seg);
        const decoded = decodeSegmentRaw(createOffset(), encoded);

        expect(decoded).toEqual(seg);
    });

    test('round-trips a sequence of segments preserving relative state', () => {
        const segments: Array<SegmentInterface> = [
            { line: 1, column: 1,  generatedLine: 1, generatedColumn: 1,  sourceIndex: 0, nameIndex: null },
            { line: 1, column: 5,  generatedLine: 1, generatedColumn: 4,  sourceIndex: 0, nameIndex: null },
            { line: 2, column: 1,  generatedLine: 1, generatedColumn: 10, sourceIndex: 1, nameIndex: 2 },
            { line: 2, column: 12, generatedLine: 1, generatedColumn: 15, sourceIndex: 1, nameIndex: null }
        ];

        const encOffset = createOffset();
        const encoded = segments.map(s => encodeSegment(encOffset, s));

        const decOffset = createOffset();
        const decoded = encoded.map(raw => decodeSegmentRaw(decOffset, raw));

        expect(decoded).toEqual(segments);
    });
});

describe('validateSegment', () => {
    const valid: SegmentInterface = {
        line: 1,
        column: 2,
        generatedLine: 3,
        generatedColumn: 4,
        sourceIndex: 0,
        nameIndex: null
    };

    test('does not throw for a fully valid segment', () => {
        expect(() => validateSegment(valid)).not.toThrow();
    });

    test('does not throw when nameIndex is a valid non-zero integer', () => {
        expect(() => validateSegment({ ...valid, nameIndex: 42 })).not.toThrow();
    });

    test('does not throw when sourceIndex is 0 (valid 0-based index)', () => {
        expect(() => validateSegment({ ...valid, sourceIndex: 0 })).not.toThrow();
    });

    test.each(null, 0, 42)('does not throw when nameIndex is %s', (value) => {
        expect(() => validateSegment({ ...valid, nameIndex: value })).not.toThrow();
    });

    test.each(
        [ NaN,      '\'sourceIndex\' must be a finite number, received NaN'      ],
        [ Infinity, '\'sourceIndex\' must be a finite number, received Infinity' ]
    )('throws when sourceIndex is %s', ([ value, message ]) => {
        expect(() => validateSegment({ ...valid, sourceIndex: value })).toThrow(message);
    });

    test.each(
        [ NaN,      '\'nameIndex\' must be a finite number or null, received NaN'      ],
        [ Infinity, '\'nameIndex\' must be a finite number or null, received Infinity' ]
    )('throws when nameIndex is %s', ([ value, message ]) => {
        expect(() => validateSegment({ ...valid, nameIndex: value })).toThrow(message);
    });

    test.each`
    a       | b      | sum
    ${ 1 }  | ${ 2 } | ${ 3 }
    ${ 2 }  | ${ 5 } | ${ 7 }
`('adds $a + $b -> $sum', ({ a, b, sum }) => {
        expect(a + b).toBe(sum);
    });

    test.each(
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
    )('User %s is %s years old', ({ name, age }) => {
        expect(typeof name).toBe('string');
        expect(typeof age).toBe('number');
    });

    test.each(
        [ 'line',            0,        '\'line\' must be a finite number ≥ 1, received 0'            ],
        [ 'line',            -5,       '\'line\' must be a finite number ≥ 1, received -5'           ],
        [ 'line',            Infinity, '\'line\' must be a finite number ≥ 1, received Infinity'     ],
        [ 'line',            NaN,      '\'line\' must be a finite number ≥ 1, received NaN'          ],
        [ 'column',          0,        '\'column\' must be a finite number ≥ 1, received 0'          ],
        [ 'column',          -5,       '\'column\' must be a finite number ≥ 1, received -5'         ],
        [ 'column',          Infinity, '\'column\' must be a finite number ≥ 1, received Infinity'   ],
        [ 'column',          NaN,      '\'column\' must be a finite number ≥ 1, received NaN'        ],
        [ 'generatedLine',   0,        '\'generatedLine\' must be a finite number ≥ 1, received 0'   ],
        [ 'generatedLine',   -5,       '\'generatedLine\' must be a finite number ≥ 1, received -5'  ],
        [ 'generatedLine',   Infinity, '\'generatedLine\' must be a finite number ≥ 1, received Infinity' ],
        [ 'generatedLine',   NaN,      '\'generatedLine\' must be a finite number ≥ 1, received NaN' ],
        [ 'generatedColumn', 0,        '\'generatedColumn\' must be a finite number ≥ 1, received 0' ],
        [ 'generatedColumn', -5,       '\'generatedColumn\' must be a finite number ≥ 1, received -5' ],
        [ 'generatedColumn', Infinity, '\'generatedColumn\' must be a finite number ≥ 1, received Infinity' ],
        [ 'generatedColumn', NaN,      '\'generatedColumn\' must be a finite number ≥ 1, received NaN' ]
    )('throws when \'%s\' is %s', ([ field, value, message ]) => {
        expect(() => validateSegment({ ...valid, [field]: value })).toThrow(message);
    });

    test('reports the first failing positional field (line before column)', () => {
        // Both line and column are invalid — should report 'line' first
        expect(() => validateSegment({ ...valid, line: 0, column: 0 }))
            .toThrow('\'line\'');
    });
});
