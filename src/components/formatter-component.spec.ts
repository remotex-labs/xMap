/**
 * Imports
 */

import { formatCode, formatErrorCode } from '@components/formatter.component';

/**
 * Tests
 */

describe('formatCode', () => {
    test('should format code with default options', () => {
        const code = 'line1\nline2\nline3';
        const result = formatCode(code);

        expect(result).toBe('      1 | line1\n      2 | line2\n      3 | line3');
    });

    test('should format code with custom padding and start line', () => {
        const code = 'line1\nline2\nline3';
        const options = { padding: 5, startLine: 3 };
        const result = formatCode(code, options);

        expect(result).toBe(' 3 | line1\n 4 | line2\n 5 | line3');
    });

    test('should apply custom action to specific line', () => {
        const code = 'line1\nline2\nline3';
        const options = {
            padding: 5,
            startLine: 3,
            action: {
                triggerLine: 4,
                callback: (lineString: string, padding: number, line: number): string => `* ${ line } | ${ lineString }`
            }
        };
        const result = formatCode(code, options);

        expect(result).toBe(' 3 | line1\n* 4 |  4 | line2\n 5 | line3');
    });
});

describe('formatErrorCode', () => {
    const code = 'const a = 1;\nconst b = a || fallback;\nconst c = 2;';

    test('keeps the whole marked line when the code contains a pipe', () => {
        const result = formatErrorCode({ code, line: 2, column: 11, startLine: 1 });

        // the marked line used to be cut at the first `|` in the source
        expect(result).toContain('const b = a || fallback;');
        expect(result.split('\n')[1]).toContain('> 2 |');
    });

    test('marks the first and last line of a snippet', () => {
        expect(formatErrorCode({ code, line: 1, column: 1, startLine: 1 })).toContain('> 1 |');
        expect(formatErrorCode({ code, line: 3, column: 1, startLine: 1 })).toContain('> 3 |');
    });

    test('throws when the line falls outside the snippet', () => {
        expect(() => formatErrorCode({ code, line: 4, column: 1, startLine: 1 }))
            .toThrow('Invalid line or column number.');
        expect(() => formatErrorCode({ code, line: 1, column: 1, startLine: 2 }))
            .toThrow('Invalid line or column number.');
    });

    test('throws when the column is below 1', () => {
        expect(() => formatErrorCode({ code, line: 2, column: 0, startLine: 1 }))
            .toThrow('Invalid line or column number.');
    });

    test('honours a snippet that does not start at line 1', () => {
        const result = formatErrorCode({ code, line: 11, column: 1, startLine: 10 });

        expect(result).toContain('  10 | const a = 1;');
        expect(result).toContain('> 11 |');
    });
});
