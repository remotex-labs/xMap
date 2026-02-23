/**
 * Imports
 */

import { decodeVLQ, encodeArrayVLQ, encodeVLQ } from '@components/base64.component';

/**
 * Tests
 */

describe('VLQ Encoding/Decoding', () => {
    describe('encodeVLQ', () => {
        test('encodes zero', () => {
            expect(encodeVLQ(0)).toBe('A');
        });

        test('encodes positive numbers', () => {
            expect(encodeVLQ(1)).toBe('C');
            expect(encodeVLQ(18)).toBe('kB');
        });

        test('encodes negative numbers', () => {
            expect(encodeVLQ(-1)).toBe('D');
            expect(encodeVLQ(-10)).toBe('V');
        });

        test('encodes large positive numbers requiring multiple chunks', () => {
            expect(encodeVLQ(1000)).toBe('w+B');   // 1000 << 1 = 2000 → multi-chunk
            expect(encodeVLQ(100000)).toBe('gqjG'); // requires multiple chunks
        });

        test('encodes large negative numbers requiring multiple chunks', () => {
            expect(encodeVLQ(-1000)).toBe('x+B');
            expect(encodeVLQ(-100000)).toBe('hqjG');
        });

        test('encodes boundary values', () => {
            // Max safe 30-bit signed value before bit shifting breaks down
            expect(encodeVLQ(2147483647)).toBe('+/////D');
            expect(encodeVLQ(-2147483647)).toBe('//////D');
        });

        test('encode and decode are inverse operations (round-trip)', () => {
            const values = [ 0, 1, -1, 15, -15, 16, -16, 255, -255, 1024, -1024, 100000, -100000 ];
            for (const v of values) {
                expect(decodeVLQ(encodeVLQ(v))).toEqual([ v ]);
            }
        });
    });

    describe('encodeArrayVLQ', () => {
        test('encodes a mixed array', () => {
            expect(encodeArrayVLQ([ 0, 1, -1, -18, 18, -18 ])).toBe('ACDlBkBlB');
        });

        test('encodes an empty array to an empty string', () => {
            expect(encodeArrayVLQ([])).toBe('');
        });

        test('encodes a single-element array', () => {
            expect(encodeArrayVLQ([ 0 ])).toBe('A');
            expect(encodeArrayVLQ([ -1 ])).toBe('D');
        });

        test('encodes an array of zeros', () => {
            expect(encodeArrayVLQ([ 0, 0, 0 ])).toBe('AAA');
        });

        test('result is the concatenation of individually encoded values', () => {
            const values = [ 1, -5, 0, 100 ];
            const individual = values.map(encodeVLQ).join('');
            expect(encodeArrayVLQ(values)).toBe(individual);
        });
    });

    describe('decodeVLQ', () => {
        test('decodes a VLQ encoded string', () => {
            expect(decodeVLQ('ACDlBkBlB')).toEqual([ 0, 1, -1, -18, 18, -18 ]);
        });

        test('decodes an empty string to an empty array', () => {
            expect(decodeVLQ('')).toEqual([]);
        });

        test('decodes a single zero', () => {
            expect(decodeVLQ('A')).toEqual([ 0 ]);
        });

        test('decodes multi-chunk values', () => {
            expect(decodeVLQ('w+B')).toEqual([ 1000 ]);
            expect(decodeVLQ('x+B')).toEqual([ -1000 ]);
        });

        test('throws on invalid Base64 characters', () => {
            expect(() => decodeVLQ('!')).toThrow('Invalid Base64 character: \'!\' at index 0');
            expect(() => decodeVLQ('A!')).toThrow('Invalid Base64 character: \'!\' at index 1');
            expect(() => decodeVLQ('!@#')).toThrow('Invalid Base64 character: \'!\' at index 0');
        });

        test('throws on truncated / incomplete VLQ sequence', () => {
            // 'g' = Base64 index 32 = 0b100000, meaning only the continuation bit is set
            // This signals "more chunks follow" but the string ends — an incomplete sequence
            expect(() => decodeVLQ('g')).toThrow('Unexpected end of VLQ input');
        });

        test('round-trips encode → decode', () => {
            const values = [ 0, 1, -1, -18, 18, -18, 1000, -1000, 100000 ];
            expect(decodeVLQ(encodeArrayVLQ(values))).toEqual(values);
        });
    });
});
