/**
 * Bitmask for extracting the lower 5 bits of a VLQ chunk.
 *
 * @remarks
 * Used by {@link encodeVLQ} and {@link decodeVLQ} to isolate the data payload
 * portion of each VLQ segment. VLQ (Variable-Length Quantity) encoding uses
 * 5 bits for data and 1 bit for continuation.
 *
 * Binary: `0001 1111` (31 in decimal)
 *
 * @since 1.0.0
 */

const MASK = 0x1f;

/**
 * Continuation bit flag for VLQ encoding.
 *
 * @remarks
 * Used by {@link encodeVLQ} and {@link decodeVLQ} to indicate whether more
 * chunks follow in a VLQ sequence. When this bit is set (1), additional chunks
 * are expected. When clear (0), the current chunk is the final one.
 *
 * Binary: `0010 0000` (32 in decimal)
 *
 * @since 1.0.0
 */

const CONT = 0x20;

/**
 * Base64 character encoding table.
 *
 * @remarks
 * Standard Base64 alphabet used for encoding VLQ values. Each of the 64 characters
 * represents a 6-bit value (0-63). This table is used by {@link encodeVLQ} to convert
 * numeric values into Base64 characters.
 *
 * Encoding: `A-Z` (0-25), `a-z` (26-51), `0-9` (52-61), `+` (62), `/` (63)
 *
 * @since 1.0.0
 */

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Base64 character decoding lookup table.
 *
 * @remarks
 * Pre-computed lookup table for fast Base64 character-to-value conversion. Each valid
 * Base64 character maps to its corresponding numeric value (0-63), while invalid
 * characters map to 255. This table is initialized at module load time and used by
 * {@link decodeVLQ} for efficient decoding.
 *
 * Array size: 128 (ASCII character range)
 * Invalid character marker: 255
 *
 * @since 4.1.0
 */

const DECODE = new Uint8Array(128).fill(255);
for (let i = 0; i < 64; i++) DECODE[BASE64.charCodeAt(i)] = i;

/**
 * Encodes a signed integer into Base64 VLQ (Variable-Length Quantity) format.
 *
 * @param value - The signed integer to encode (can be negative)
 *
 * @returns The Base64-encoded VLQ string representation
 *
 * @remarks
 * This function implements VLQ encoding with Base64 character mapping:
 * 1. Converts the value to unsigned format (negative numbers get sign bit)
 * 2. Splits the value into 5-bit chunks
 * 3. Sets continuation bit on all chunks except the last
 * 4. Encodes each chunk as a Base64 character
 *
 * VLQ format:
 * - Sign bit: Least significant bit of the first chunk (1 for negative, 0 for positive)
 * - Data bits: Remaining bits store the absolute value
 * - Continuation bit: 6th bit indicates if more chunks follow
 *
 * This encoding is commonly used in source maps for efficient delta encoding.
 *
 * @example Encoding positive number
 * ```ts
 * const encoded = encodeVLQ(123);
 * // '6H' (VLQ representation)
 * ```
 *
 * @example Encoding negative number
 * ```ts
 * const encoded = encodeVLQ(-456);
 * // 'twB' (VLQ representation with sign bit)
 * ```
 *
 * @example Encoding zero
 * ```ts
 * const encoded = encodeVLQ(0);
 * // 'A'
 * ```
 *
 * @see {@link decodeVLQ} for decoding VLQ strings
 * @see {@link encodeArrayVLQ} for encoding multiple values
 *
 * @since 1.0.0
 */

export function encodeVLQ(value: number): string {
    // Use multiplication instead of bitwise left shift to avoid 32-bit signed
    // integer overflow. JavaScript's << operator truncates to 32 bits, which corrupts
    // values with absolute magnitude >= 2^30 (e.g., -1073741824 or larger).
    // Multiplication preserves the full integer range safely.
    let vlq = value < 0 ? ((-value) * 2) | 1 : value * 2;
    let encoded = '';

    do {
        const chunk = vlq & MASK;
        vlq >>>= 5;
        encoded += BASE64[vlq > 0 ? chunk | CONT : chunk];
    } while (vlq > 0);

    return encoded;
}

/**
 * Encodes an array of signed integers into a single Base64 VLQ string.
 *
 * @param values - Array of signed integers to encode
 *
 * @returns Concatenated Base64 VLQ string representing all values
 *
 * @remarks
 * This function encodes multiple values by applying {@link encodeVLQ} to each element
 * and concatenating the results. The encoded values are not separated by delimiters;
 * the VLQ format's continuation bits allow the decoder to determine value boundaries.
 *
 * This is commonly used in source maps to encode segment data efficiently.
 *
 * @example Encoding multiple values
 * ```ts
 * const encoded = encodeArrayVLQ([0, 5, -10, 100]);
 * // 'AKAS6H' (concatenated VLQ encoding)
 * ```
 *
 * @example Encoding empty array
 * ```ts
 * const encoded = encodeArrayVLQ([]);
 * // ''
 * ```
 *
 * @example Encoding single value
 * ```ts
 * const encoded = encodeArrayVLQ([42]);
 * // 'U' (equivalent to encodeVLQ(42))
 * ```
 *
 * @see {@link encodeVLQ} for single value encoding
 * @see {@link decodeVLQ} for decoding the result
 *
 * @since 1.0.0
 */

export function encodeArrayVLQ(values: Array<number>): string {
    return values.map(encodeVLQ).join('');
}

/**
 * Decodes a Base64 VLQ (Variable-Length Quantity) string into an array of signed integers.
 *
 * @param data - The Base64 VLQ-encoded string to decode
 *
 * @returns Array of decoded signed integers
 *
 * @throws {@link Error}
 * Thrown when encountering an invalid Base64 character or incomplete VLQ sequence
 *
 * @remarks
 * This function implements VLQ decoding with Base64 character mapping:
 * 1. Reads Base64 characters and converts them to 6-bit values
 * 2. Extracts 5-bit data chunks and checks continuation bits
 * 3. Accumulates chunks until a terminal chunk is found
 * 4. Converts accumulated value back to signed integer using the sign bit
 *
 * The function validates:
 * - All characters are valid Base64 characters
 * - VLQ sequences are properly terminated (no incomplete sequences)
 *
 * Error conditions:
 * - Invalid Base64 character: Reports the character and its position
 * - Incomplete sequence: Reports when the string ends mid-value
 *
 * @example Decoding single value
 * ```ts
 * const values = decodeVLQ('6H');
 * // [123]
 * ```
 *
 * @example Decoding multiple values
 * ```ts
 * const values = decodeVLQ('AKAS6H');
 * // [0, 5, -10, 100]
 * ```
 *
 * @example Handling errors - invalid character
 * ```ts
 * try {
 *   decodeVLQ('AB@C');
 * } catch (err) {
 *   console.error(err.message);
 *   // "Invalid Base64 character: '@' at index 2"
 * }
 * ```
 *
 * @example Handling errors - incomplete sequence
 * ```ts
 * try {
 *   decodeVLQ('g');
 * } catch (err) {
 *   console.error(err.message);
 *   // "Unexpected end of VLQ input: incomplete sequence"
 * }
 * ```
 *
 * @see {@link encodeVLQ} for encoding values
 * @see {@link encodeArrayVLQ} for encoding arrays
 *
 * @since 1.0.0
 */

export function decodeVLQ(data: string): Array<number> {
    const result: Array<number> = [];
    let shift = 0;
    let value = 0;

    for (let i = 0; i < data.length; i++) {
        const code = data.charCodeAt(i);
        const digit = code < 128 ? DECODE[code] : 255;

        if (digit === 255) {
            throw new Error(`Invalid Base64 character: '${ data[i] }' at index ${ i }`);
        }

        value += (digit & MASK) << shift;

        if (digit & CONT) {
            shift += 5;
        } else {
            result.push(value & 1 ? -(value >> 1) : value >> 1);
            value = shift = 0;
        }
    }

    if (shift > 0) {
        throw new Error('Unexpected end of VLQ input: incomplete sequence');
    }

    return result;
}
