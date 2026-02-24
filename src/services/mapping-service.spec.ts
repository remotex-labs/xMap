/**
 * Import will remove at compile time
 */

import type { SourceMappingType } from '@services/interfaces/mapping-service.interface';
import type { SegmentInterface, VLQOffsetInterface } from '@components/interfaces/segment-component.interface';

/**
 * Imports
 */

import { decodeVLQ } from '@components/base64.component';
import { MappingService } from '@services/mapping.service';
import { Bias, encodeSegment, validateSegment } from '@components/segment.component';

/**
 * Helpers
 */

function callDecodeString(inst: any, encoded: string, namesOffset = 0, sourcesOffset = 0, lineOffset = 0) {
    inst.offsets.name = namesOffset;
    inst.offsets.sources = sourcesOffset;
    inst.offsets.line = lineOffset;
    inst['decodeSourceMappingString'](encoded);
}

function callDecodeArray(inst: any, map: SourceMappingType, namesOffset = 0, sourcesOffset = 0, lineOffset = 0) {
    inst.offsets.name = namesOffset;
    inst.offsets.sources = sourcesOffset;
    inst.offsets.line = lineOffset;
    inst['decodeSourceMappingArray'](map);
}

/**
 * Tests
 */

describe('validateSegment', () => {
    test('should not throw for a valid segment', () => {
        const valid: SegmentInterface = {
            line: 1,
            column: 2,
            nameIndex: null,
            sourceIndex: 0,
            generatedLine: 1,
            generatedColumn: 3
        };
        expect(() => validateSegment(valid)).not.toThrow();
    });

    test('should not throw for a valid segment with a nameIndex', () => {
        const valid: SegmentInterface = {
            line: 1,
            column: 2,
            nameIndex: 5,
            sourceIndex: 0,
            generatedLine: 1,
            generatedColumn: 3
        };
        expect(() => validateSegment(valid)).not.toThrow();
    });

    test('should throw when line is not a finite number', () => {
        const seg = { line: Infinity, column: 2, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'line\' must be a finite number ≥ 1, received Infinity');
    });

    test('should throw when line is less than 1', () => {
        const seg = { line: 0, column: 2, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'line\' must be a finite number ≥ 1, received 0');
    });

    test('should throw when column is not a finite number', () => {
        const seg = { line: 1, column: NaN, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'column\' must be a finite number ≥ 1, received NaN');
    });

    test('should throw when column is less than 1', () => {
        const seg = { line: 1, column: 0, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'column\' must be a finite number ≥ 1, received 0');
    });

    test('should throw when nameIndex is not a finite number or null', () => {
        const seg = { line: 1, column: 2, nameIndex: undefined, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'nameIndex\' must be a finite number or null, received undefined');
    });

    test('should throw when nameIndex is NaN', () => {
        const seg = { line: 1, column: 2, nameIndex: NaN, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'nameIndex\' must be a finite number or null, received NaN');
    });

    test('should throw when sourceIndex is not a finite number', () => {
        const seg = { line: 1, column: 2, nameIndex: null, sourceIndex: NaN, generatedLine: 1, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'sourceIndex\' must be a finite number, received NaN');
    });

    test('should throw when generatedLine is not a finite number', () => {
        const seg = { line: 1, column: 2, nameIndex: null, sourceIndex: 0, generatedLine: -Infinity, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'generatedLine\' must be a finite number ≥ 1, received -Infinity');
    });

    test('should throw when generatedLine is less than 1', () => {
        const seg = { line: 1, column: 2, nameIndex: null, sourceIndex: 0, generatedLine: 0, generatedColumn: 3 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'generatedLine\' must be a finite number ≥ 1, received 0');
    });

    test('should throw when generatedColumn is not a finite number', () => {
        const seg = { line: 1, column: 2, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: null };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'generatedColumn\' must be a finite number ≥ 1, received null');
    });

    test('should throw when generatedColumn is less than 1', () => {
        const seg = { line: 1, column: 2, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 0 };
        expect(() => validateSegment(seg as any))
            .toThrow('Invalid segment: \'generatedColumn\' must be a finite number ≥ 1, received 0');
    });
});

describe('validateSourceMappingString', () => {
    let instance: MappingService;

    beforeEach(() => {
        instance = new MappingService();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should accept a valid encoded source map', () => {
        expect(() => instance.decode('AAAA;AACA;AADA;')).not.toThrow();
    });

    test('should accept a valid encoded source map with multiple mappings per line', () => {
        expect(() => instance.decode('AAAA;AACA,AADA;AAGA;')).not.toThrow();
    });

    test('should accept a valid encoded source map with varying segment lengths', () => {
        expect(() => instance.decode('AAAA;AA;AAA;AAAAAAA;')).not.toThrow();
    });

    test('should reject an empty string', () => {
        expect(() => instance.decode('')).toThrow(
            'Invalid mappings string: contains characters outside the VLQ alphabet.'
        );
    });

    test('should reject a mapping with invalid characters', () => {
        expect(() => instance.decode('AAAA;A#A;AADA;')).toThrow(
            'Invalid mappings string: contains characters outside the VLQ alphabet.'
        );
    });

    test('should reject a mapping with multiple invalid segments', () => {
        expect(() => instance.decode('AAAA;AADA;A#GA;')).toThrow(
            'Invalid mappings string: contains characters outside the VLQ alphabet.'
        );
    });
});

describe('decodeSourceMappingString', () => {
    let instance: any;

    beforeEach(() => {
        instance = new MappingService();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should decode valid mapping string and populate lines array', () => {
        callDecodeString(instance, 'AAAA;AACA;AADA;');

        expect(instance.lines).toHaveLength(4);
        expect(instance.lines[0]).toEqual(expect.any(Array));
        expect(instance.lines[1]).toEqual(expect.any(Array));
        expect(instance.lines[2]).toEqual(expect.any(Array));
        expect(instance.lines[3]).toBeNull();
    });

    test('should handle empty frames correctly', () => {
        callDecodeString(instance, 'AAAA;;;AADA;');

        expect(instance.lines).toHaveLength(5);
        expect(instance.lines[1]).toBeNull();
        expect(instance.lines[2]).toBeNull();
    });

    test('should apply namesOffset to decoded nameIndex', () => {
        callDecodeString(instance, 'AAAAE', 3);

        const seg: SegmentInterface = instance.lines[0][0];
        expect(seg.nameIndex).toBe(5);
    });

    test('should apply sourcesOffset to decoded sourceIndex', () => {
        callDecodeString(instance, 'ACAAA', 0, 2);

        const seg: SegmentInterface = instance.lines[0][0];
        expect(seg.sourceIndex).toBe(3);
    });

    test('should apply lineOffset to decoded generatedLine', () => {
        callDecodeString(instance, 'AAAA', 0, 0, 5);

        const seg: SegmentInterface = instance.lines[0][0];
        expect(seg.generatedLine).toBe(6);
    });

    test('should append to existing lines when called multiple times', () => {
        callDecodeString(instance, 'AAAA');
        callDecodeString(instance, 'AACA');

        expect(instance.lines).toHaveLength(2);
        expect(instance.lines[1][0].generatedLine).toBe(2);
    });

    test('should throw for invalid mapping string format', () => {
        expect(() => callDecodeString(instance, 'INVALID_MAPPING_STRING'))
            .toThrow('Invalid mappings string: contains characters outside the VLQ alphabet.');
    });

    test('should throw with line index when decoding fails', () => {
        xJet.mock(decodeVLQ)
            .mockImplementationOnce(() => { throw new Error('Decoding error'); });

        expect(() => callDecodeString(instance, 'AAAA;AACA;AADA;'))
            .toThrow('Error decoding mappings at line 1: Decoding error');
    });
});

describe('decodeSourceMappingArray', () => {
    let instance: any;

    beforeEach(() => {
        instance = new MappingService();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should decode and apply namesOffset and sourcesOffset to segments', () => {
        const encodedMap: SourceMappingType = [
            [
                { line: 1, column: 1, nameIndex: 1, sourceIndex: 2, generatedLine: 3, generatedColumn: 2 },
                { line: 1, column: 1, nameIndex: 4, sourceIndex: 5, generatedLine: 6, generatedColumn: 2 }
            ]
        ];

        callDecodeArray(instance, encodedMap, 2, 3);

        expect(instance.lines).toEqual([
            [
                { line: 1, column: 1, nameIndex: 3, sourceIndex: 5, generatedLine: 3, generatedColumn: 2 },
                { line: 1, column: 1, nameIndex: 6, sourceIndex: 8, generatedLine: 6, generatedColumn: 2 }
            ]
        ]);
    });

    test('should set nameIndex to null when segment nameIndex is null', () => {
        const encodedMap: SourceMappingType = [[{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 }]];

        callDecodeArray(instance, encodedMap, 5);

        expect(instance.lines[0][0].nameIndex).toBeNull();
    });

    test('should apply lineOffset to generatedLine', () => {
        const encodedMap: SourceMappingType = [[{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 }]];

        callDecodeArray(instance, encodedMap, 0, 0, 4);

        expect(instance.lines[0][0].generatedLine).toBe(5);
    });

    test('should append to existing lines and shift generatedLine by lineAppendOffset', () => {
        callDecodeArray(instance, [[{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 }]]);
        callDecodeArray(instance, [[{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 }]]);

        expect(instance.lines).toHaveLength(2);
        expect(instance.lines[1][0].generatedLine).toBe(2);
    });

    test('should handle null frames without errors', () => {
        callDecodeArray(instance, [ null ]);
        expect(instance.lines).toEqual([ null ]);
    });

    test('should throw for non-array encodedMap', () => {
        expect(() => callDecodeArray(instance, {} as any))
            .toThrow('Invalid source mapping: expected an array of lines.');
    });

    test('should throw for non-array frame', () => {
        expect(() => callDecodeArray(instance, [{ someKey: 'invalid' }] as any))
            .toThrow('Invalid source mapping at line 1: expected an array of segments, got object.');
    });

    test('should throw when a segment is invalid', () => {
        xJet.mock(validateSegment)
            .mockImplementation(() => { throw new Error('Invalid segment'); });

        expect(() => callDecodeArray(instance, [[{ nameIndex: 1, sourceIndex: 2, generatedLine: 3 }]] as any))
            .toThrow('Error decoding mappings at line 1: Invalid segment');
    });
});

describe('encodeSourceMapping', () => {
    let instance: any;

    beforeEach(() => {
        instance = new MappingService();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should encode a valid mapping array', () => {
        const map: SourceMappingType = <any>[
            [
                { generatedColumn: 1, sourceIndex: 2, generatedLine: 3, line: 1, column: 1, nameIndex: null },
                { generatedColumn: 4, sourceIndex: 5, generatedLine: 6, line: 1, column: 4, nameIndex: null }
            ],
            null,
            [{ generatedColumn: 7, sourceIndex: 8, generatedLine: 9, line: 1, column: 7, nameIndex: null }]
        ];

        xJet.mock(encodeSegment)
            .mockImplementation((_offset: any, seg: any) => `encoded(${ seg.generatedColumn },${ seg.sourceIndex })`);

        const result = instance['encodeSourceMapping'](map);
        expect(result).toBe('encoded(1,2),encoded(4,5);;encoded(7,8)');
    });

    test('should handle null and empty frames', () => {
        const result = instance['encodeSourceMapping']([ null, []]);
        expect(result).toBe(';');
    });

    test('should handle a single frame with a single segment', () => {
        xJet.mock(encodeSegment)
            .mockImplementation((_offset: any, seg: any) => `encoded(${ seg.generatedColumn },${ seg.sourceIndex })`);

        const map: SourceMappingType = <any>[[{ generatedColumn: 1, sourceIndex: 2, generatedLine: 3, line: 1, column: 1, nameIndex: null }]];
        expect(instance['encodeSourceMapping'](map)).toBe('encoded(1,2)');
    });

    test('should reset generatedColumn to 0 at the start of each line', () => {
        const map: SourceMappingType = <any>[
            [{ generatedColumn: 5, sourceIndex: 0, generatedLine: 1, line: 1, column: 5, nameIndex: null }],
            [{ generatedColumn: 5, sourceIndex: 0, generatedLine: 2, line: 1, column: 5, nameIndex: null }]
        ];
        const result = instance['encodeSourceMapping'](map);
        const [ line1, line2 ] = result.split(';');

        expect(line1).toBe(line2);
    });
});

describe('getSegment', () => {
    let instance: MappingService;

    beforeEach(() => {
        instance = new MappingService();
        instance.decode([
            [
                { line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 },
                { line: 1, column: 3, nameIndex: null, sourceIndex: 1, generatedLine: 1, generatedColumn: 5 },
                { line: 1, column: 6, nameIndex: null, sourceIndex: 2, generatedLine: 1, generatedColumn: 10 }
            ],
            [
                { line: 1, column: 1, nameIndex: null, sourceIndex: 3, generatedLine: 2, generatedColumn: 3 },
                { line: 1, column: 9, nameIndex: null, sourceIndex: 4, generatedLine: 2, generatedColumn: 8 }
            ]
        ]);
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should return null when no segments exist for the line', () => {
        expect(instance.getSegment(3, 5)).toBeNull();
    });

    test('should return null when segments array is empty for the given line', () => {
        (instance as any).lines[1] = [];
        expect(instance.getSegment(2, 5)).toBeNull();
    });

    test('should return exact segment when generatedColumn matches', () => {
        expect(instance.getSegment(1, 5)).toEqual({
            line: 1,
            column: 3,
            generatedColumn: 5,
            sourceIndex: 1,
            generatedLine: 1,
            nameIndex: null
        });
    });

    test('should return lower bound segment with LOWER_BOUND bias', () => {
        expect(instance.getSegment(1, 7, Bias.LOWER_BOUND)).toEqual({
            line: 1,
            column: 3,
            generatedColumn: 5,
            sourceIndex: 1,
            generatedLine: 1,
            nameIndex: null
        });
    });

    test('should return upper bound segment with UPPER_BOUND bias', () => {
        expect(instance.getSegment(1, 7, Bias.UPPER_BOUND)).toEqual({
            line: 1,
            column: 6,
            generatedColumn: 10,
            sourceIndex: 2,
            generatedLine: 1,
            nameIndex: null
        });
    });

    test('should return null when no segment is below the target column (LOWER_BOUND)', () => {
        expect(instance.getSegment(1, 0, Bias.LOWER_BOUND)).toBeNull();
    });

    test('should return null when no segment is above the target column (UPPER_BOUND)', () => {
        expect(instance.getSegment(1, 15, Bias.UPPER_BOUND)).toBeNull();
    });

    test('should handle a line with a single segment', () => {
        (instance as any).lines[2] = [{ generatedColumn: 4, sourceIndex: 5, generatedLine: 3, line: 1, column: 1, nameIndex: null }];
        expect(instance.getSegment(3, 4)).toEqual({
            generatedColumn: 4, sourceIndex: 5, generatedLine: 3, line: 1, column: 1, nameIndex: null
        });
    });

    test('should return correct closest segment for adjacent columns', () => {
        expect(instance.getSegment(1, 6, Bias.LOWER_BOUND)).toEqual({
            line: 1,
            column: 3,
            generatedColumn: 5,
            sourceIndex: 1,
            generatedLine: 1,
            nameIndex: null
        });
        expect(instance.getSegment(1, 6, Bias.UPPER_BOUND)).toEqual({
            line: 1,
            column: 6,
            generatedColumn: 10,
            sourceIndex: 2,
            generatedLine: 1,
            nameIndex: null
        });
    });

    test('should account for lineOffset when resolving line index', () => {
        const shifted = new MappingService();
        shifted.decode([[{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 3 }]], 0, 0, 2);

        expect(shifted.getSegment(3, 3)).toEqual({
            line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 3, generatedColumn: 3
        });
        expect(shifted.getSegment(1, 3)).toBeNull();
    });
});

describe('getOriginalSegment', () => {
    let instance: MappingService;

    beforeEach(() => {
        instance = new MappingService();
        instance.decode([
            [
                { column: 1, sourceIndex: 0, line: 1, generatedLine: 1, generatedColumn: 1, nameIndex: null },
                { column: 5, sourceIndex: 0, line: 1, generatedLine: 1, generatedColumn: 1, nameIndex: null },
                { column: 10, sourceIndex: 0, line: 1, generatedLine: 1, generatedColumn: 1, nameIndex: null }
            ],
            [
                { column: 2, sourceIndex: 1, line: 2, generatedLine: 1, generatedColumn: 1, nameIndex: null },
                { column: 6, sourceIndex: 1, line: 2, generatedLine: 1, generatedColumn: 1, nameIndex: null }
            ],
            [
                { column: 3, sourceIndex: 2, line: 3, generatedLine: 1, generatedColumn: 1, nameIndex: null },
                { column: 7, sourceIndex: 2, line: 3, generatedLine: 1, generatedColumn: 1, nameIndex: null }
            ]
        ]);
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should return null when no segments exist for the sourceIndex and line', () => {
        expect(instance.getOriginalSegment(4, 5, 3)).toBeNull();
    });

    test('should return null when no segments exist for the given sourceIndex', () => {
        expect(instance.getOriginalSegment(1, 5, 2)).toBeNull();
    });

    test('should return exact match for column', () => {
        expect(instance.getOriginalSegment(1, 5, 0)).toEqual({
            generatedColumn: 1,
            generatedLine: 1,
            nameIndex: null,
            column: 5,
            sourceIndex: 0,
            line: 1
        });
    });

    test('should return lower bound segment with LOWER_BOUND bias', () => {
        expect(instance.getOriginalSegment(1, 6, 0, Bias.LOWER_BOUND)).toEqual({
            generatedColumn: 1,
            generatedLine: 1,
            nameIndex: null,
            column: 5,
            sourceIndex: 0,
            line: 1
        });
    });

    test('should return upper bound segment with UPPER_BOUND bias', () => {
        expect(instance.getOriginalSegment(1, 6, 0, Bias.UPPER_BOUND)).toEqual({
            generatedColumn: 1,
            generatedLine: 1,
            nameIndex: null,
            column: 10,
            sourceIndex: 0,
            line: 1
        });
    });

    test('should return null when no segment is below target column (LOWER_BOUND)', () => {
        expect(instance.getOriginalSegment(1, 0, 0, Bias.LOWER_BOUND)).toBeNull();
    });

    test('should return null when no segment is above target column (UPPER_BOUND)', () => {
        expect(instance.getOriginalSegment(1, 12, 0, Bias.UPPER_BOUND)).toBeNull();
    });

    test('should return closest upper bound with single candidate', () => {
        expect(instance.getOriginalSegment(2, 4, 1, Bias.UPPER_BOUND)).toEqual({
            generatedColumn: 1,
            generatedLine: 1,
            nameIndex: null,
            column: 6,
            sourceIndex: 1,
            line: 2
        });
    });

    test('should return closest lower bound with single candidate', () => {
        expect(instance.getOriginalSegment(3, 5, 2, Bias.LOWER_BOUND)).toEqual({
            generatedColumn: 1,
            generatedLine: 1,
            nameIndex: null,
            column: 3,
            sourceIndex: 2,
            line: 3
        });
    });

    test('should return null with BOUND bias and no exact match', () => {
        expect(instance.getOriginalSegment(1, 6, 0, Bias.BOUND)).toBeNull();
    });
});

describe('buildOriginalPositionIndex', () => {
    let instance: MappingService;

    beforeEach(() => {
        instance = new MappingService();
        instance.decode([
            [
                { line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 },
                { line: 1, column: 5, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 5 }
            ],
            [
                { line: 2, column: 3, nameIndex: null, sourceIndex: 0, generatedLine: 2, generatedColumn: 1 },
                { line: 1, column: 2, nameIndex: null, sourceIndex: 1, generatedLine: 2, generatedColumn: 3 }
            ]
        ]);
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should return a Map', () => {
        expect(instance.buildOriginalPositionIndex()).toBeInstanceOf(Map);
    });

    test('should group segments by sourceIndex:line key', () => {
        const index = instance.buildOriginalPositionIndex();

        expect(index.has('0:1')).toBe(true);
        expect(index.has('0:2')).toBe(true);
        expect(index.has('1:1')).toBe(true);
    });

    test('should collect all segments for the same source line into one bucket', () => {
        const index = instance.buildOriginalPositionIndex();

        expect(index.get('0:1')).toHaveLength(2);
    });

    test('should sort each bucket by column ascending', () => {
        const index = instance.buildOriginalPositionIndex();
        const bucket = index.get('0:1')!;

        expect(bucket[0].column).toBe(1);
        expect(bucket[1].column).toBe(5);
    });

    test('should return an empty Map for empty lines', () => {
        const empty = new MappingService();
        expect(empty.buildOriginalPositionIndex().size).toBe(0);
    });

    test('should skip null frames without errors', () => {
        const withNull = new MappingService();
        withNull.decode([
            null,
            [{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 2, generatedColumn: 1 }]
        ]);
        const index = withNull.buildOriginalPositionIndex();

        expect(index.size).toBe(1);
        expect(index.has('0:1')).toBe(true);
    });
});

describe('encode', () => {
    let instance: any;

    beforeEach(() => {
        instance = new MappingService();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should return encoded mappings string', () => {
        const mockLines = [
            [{ generatedColumn: 0, sourceIndex: 0, line: 1, column: 1, nameIndex: null, generatedLine: 1 }],
            [{ generatedColumn: 5, sourceIndex: 1, line: 2, column: 2, nameIndex: 0, generatedLine: 2 }]
        ];
        instance.lines = mockLines;

        const encodedString: any = 'encodedString';
        xJet.spyOn(instance, 'encodeSourceMapping').mockReturnValue(encodedString);

        expect(instance.encode()).toBe(encodedString);
        expect(instance.encodeSourceMapping).toHaveBeenCalledWith(mockLines);
    });

    test('should return empty string for empty lines array', () => {
        instance.lines = [];
        expect(instance.encode()).toBe('');
    });

    test('should handle null frames in lines array', () => {
        const mockLines = [
            null,
            [{ generatedColumn: 3, sourceIndex: 1, line: 1, column: 1, nameIndex: null, generatedLine: 2 }]
        ];
        instance.lines = mockLines;

        const encodedString: any = 'encodedWithNull';
        xJet.spyOn(instance, 'encodeSourceMapping').mockReturnValue(encodedString);

        expect(instance.encode()).toBe(encodedString);
        expect(instance.encodeSourceMapping).toHaveBeenCalledWith(mockLines);
    });

    test('should round-trip a mapping string back to itself', () => {
        const original = 'AAAA;AACA,AADA;AAGA;';
        instance.decode(original);

        expect(instance.encode()).toBe(original);
    });
});

describe('encodeSegment', () => {
    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should encode segment without nameIndex correctly', () => {
        const offset: VLQOffsetInterface = {
            line: 1,
            column: 1,
            generatedColumn: 0,
            sourceIndex: 0,
            nameIndex: -1,
            generatedLine: 1
        };
        const seg: SegmentInterface = {
            line: 2,
            column: 5,
            generatedColumn: 4,
            sourceIndex: 1,
            nameIndex: null,
            generatedLine: 1
        };

        const result = encodeSegment(offset, seg);

        expect(result).toBe('GCAG');
        expect(offset).toEqual({
            line: 1,
            column: 4,
            generatedColumn: 3,
            generatedLine: 1,
            sourceIndex: 1,
            nameIndex: -1
        });
    });

    test('should encode segment with nameIndex correctly', () => {
        const offset: VLQOffsetInterface = {
            line: 2,
            column: 5,
            generatedColumn: 3,
            sourceIndex: 1,
            nameIndex: 0,
            generatedLine: 1
        };
        const seg: SegmentInterface = {
            line: 3,
            column: 8,
            generatedColumn: 7,
            sourceIndex: 2,
            nameIndex: 1,
            generatedLine: 1
        };

        const result = encodeSegment(offset, seg);

        expect(result).toBe('GCAEC');
        expect(offset).toEqual({
            line: 2,
            column: 7,
            generatedColumn: 6,
            generatedLine: 1,
            sourceIndex: 2,
            nameIndex: 1
        });
    });

    test('should update offsets correctly even with zero differences', () => {
        const offset: VLQOffsetInterface = {
            line: 3,
            column: 6,
            generatedColumn: 5,
            sourceIndex: 2,
            nameIndex: -1,
            generatedLine: 1
        };
        const seg: SegmentInterface = {
            line: 4,
            column: 7,
            generatedColumn: 6,
            sourceIndex: 2,
            nameIndex: null,
            generatedLine: 1
        };

        const result = encodeSegment(offset, seg);

        expect(result).toBe('AAAA');
        expect(offset).toEqual({
            line: 3,
            column: 6,
            generatedColumn: 5,
            generatedLine: 1,
            sourceIndex: 2,
            nameIndex: -1
        });
    });

    test('should return correct encoded value when sourceIndex is unchanged', () => {
        const offset: VLQOffsetInterface = {
            line: 1,
            column: 1,
            generatedColumn: 1,
            sourceIndex: 2,
            nameIndex: -1,
            generatedLine: 1
        };
        const seg: SegmentInterface = {
            line: 1,
            column: 2,
            generatedColumn: 3,
            sourceIndex: 2,
            nameIndex: null,
            generatedLine: 1
        };

        const result = encodeSegment(offset, seg);

        expect(result).toBe('CADA');
        expect(offset).toEqual({
            line: 0,
            column: 1,
            generatedColumn: 2,
            generatedLine: 1,
            sourceIndex: 2,
            nameIndex: -1
        });
    });
});

describe('decode', () => {
    let instance: MappingService;

    beforeEach(() => {
        instance = new MappingService();
        instance.decode('AAAA');

        xJet.spyOn(instance as any, 'decodeSourceMappingArray').mockImplementation(() => {});
        xJet.spyOn(instance as any, 'decodeSourceMappingString').mockImplementation(() => {});
    });

    afterEach(() => {
        xJet.resetAllMocks();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should call decodeSourceMappingArray when mapping is an array', () => {
        const mockArray: SourceMappingType = [
            null,
            [{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 2, generatedColumn: 1 }],
            null
        ];

        instance.decode(mockArray, 1, 2);

        expect(instance['decodeSourceMappingArray']).toHaveBeenCalledWith(mockArray);
        expect(instance['decodeSourceMappingString']).not.toHaveBeenCalled();
        expect((instance as any).offsets.name).toBe(1);
        expect((instance as any).offsets.sources).toBe(2);
    });

    test('should call decodeSourceMappingString when mapping is a string', () => {
        const mockString = ';;;AAiBO,SAAS,OAAO;AACnB,UAAQ,IAAI,MAAM;AACtB;;;ACjBA,QAAQ,IAAI,GAAG;AACf,KAAK;';
        instance.decode(mockString, 1, 2);

        expect(instance['decodeSourceMappingString']).toHaveBeenCalledWith(mockString);
        expect(instance['decodeSourceMappingArray']).not.toHaveBeenCalled();
        expect((instance as any).offsets.name).toBe(1);
        expect((instance as any).offsets.sources).toBe(2);
    });

    test('should use default offsets when none are provided', () => {
        const mockString = ';;;AAiBO,SAAS,OAAO;AACnB,UAAQ,IAAI,MAAM;AACtB;;;ACjBA,QAAQ,IAAI,GAAG;AACf,KAAK;';
        instance.decode(mockString);

        expect(instance['decodeSourceMappingString']).toHaveBeenCalledWith(mockString);
        expect((instance as any).offsets.name).toBe(0);
        expect((instance as any).offsets.sources).toBe(0);
        expect((instance as any).offsets.line).toBe(0);
    });

    test('should store lineOffset on offsets before delegating', () => {
        instance.decode([], 0, 0, 7);

        expect((instance as any).offsets.line).toBe(7);
    });

    test('should accept a MappingService instance and decode its lines', () => {
        const source = new MappingService();
        source.decode([[{ line: 1, column: 1, nameIndex: null, sourceIndex: 0, generatedLine: 1, generatedColumn: 1 }]]);

        const target = new MappingService();
        target.decode(source);

        expect((target as any).lines).toEqual((source as any).lines);
    });
});
