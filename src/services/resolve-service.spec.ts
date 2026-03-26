/**
 * Import will remove at compile time
 */

import type { ResolveOptionsInterface } from '@services/interfaces/resolve-service.interface';
import type { PositionWithCodeInterface } from '@services/interfaces/source-service.interface';
import type { ParsedStackTraceInterface, StackFrameInterface } from '@components/interfaces/parser-component.interface';

/**
 * Imports
 */

import { Bias } from '@components/segment.component';
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { formatErrorCode } from '@components/formatter.component';
import { highlightCode } from '@components/highlighter.component';
import { formatStackLine, resolveError, stackEntry, stackSourceEntry } from '@services/resolve.service';

/**
 * Helpers
 */

function makeFrame(overrides = {}): StackFrameInterface {
    return {
        source: 'at fn file:1:1',
        eval: false,
        async: false,
        native: false,
        constructor: false,
        ...overrides
    };
}

/**
 * Tests
 */

describe('resolve.service', () => {
    beforeAll(() => {
        // Keep format assertions stable by stripping ANSI formatting.
        xJet.spyOn(xterm, 'gray').mockImplementation(((text: string) => `gray(${ text })`) as any);
        xJet.spyOn(xterm, 'darkGray').mockImplementation(((text: string) => `darkGray(${ text })`) as any);

        // Avoid asserting on the full formatter/highlighter behavior; we only care that resolve.service wires them together.
        xJet.mock(highlightCode).mockImplementation((code: string) => `HL(${ code })`);
        xJet.mock(formatErrorCode).mockImplementation((pos: any) => `EC(${ pos.code })`);
    });

    beforeEach(() => {
        xJet.clearAllMocks();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    describe('formatStackLine', () => {
        test('returns frame.source when frame.fileName is missing', () => {
            const frame = makeFrame({ fileName: undefined, source: 'RAW_FRAME' });
            expect(formatStackLine(frame)).toBe('RAW_FRAME');
        });

        test('appends #L<line> when fileName is an http(s) url', () => {
            const frame = makeFrame({
                functionName: 'boom',
                fileName: 'https://example.com/app.js',
                line: 10,
                column: 2
            });

            const out = formatStackLine(frame);
            expect(out).toContain('https://example.com/app.js#L10');
            expect(out).toContain('gray([10:2])');
        });

        test('omits the [line:column] suffix unless both are present', () => {
            const withLineOnly = makeFrame({ functionName: 'fn', fileName: '/tmp/a.js', line: 5, column: undefined });
            const withColumnOnly = makeFrame({ functionName: 'fn', fileName: '/tmp/a.js', line: undefined, column: 9 });

            expect(formatStackLine(withLineOnly)).not.toContain('gray([');
            expect(formatStackLine(withColumnOnly)).not.toContain('gray([');
        });
    });

    describe('stackSourceEntry', () => {
        test('mutates the frame with resolved position and returns formatted entry + code', () => {
            const frame = makeFrame({
                functionName: 'origFn',
                fileName: '/dist/bundle.js',
                line: 999,
                column: 999
            });

            const position: PositionWithCodeInterface = {
                name: 'resolvedFn',
                line: 3,
                column: 7,
                source: '/src/index.ts',
                sourceRoot: null,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 1,
                code: 'const x = 1;',
                startLine: 1,
                endLine: 5
            };

            const entry = stackSourceEntry(position, frame);

            expect(frame.line).toBe(3);
            expect(frame.column).toBe(7);
            expect(frame.fileName).toBe('/src/index.ts');
            expect(frame.functionName).toBe('resolvedFn');

            expect(entry.format).toContain('darkGray(/src/index.ts)');
            expect(entry.code).toBe('const x = 1;');
        });

        test('prepends sourceRoot when present and frame is not http(s)', () => {
            const frame = makeFrame({ functionName: 'fn', fileName: '/dist/bundle.js', line: 1, column: 1 });
            const position: PositionWithCodeInterface = {
                name: null,
                line: 1,
                column: 2,
                source: '/src/app.ts',
                sourceRoot: '/repo',
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 1,
                code: 'x',
                startLine: 1,
                endLine: 1
            };

            const entry = stackSourceEntry(position, frame);
            expect(entry.fileName).toBe('/repo/src/app.ts');
            expect(entry.format).toContain('darkGray(/repo/src/app.ts)');
        });
    });

    describe('stackEntry', () => {
        test('filters native frames by default', () => {
            const frame = makeFrame({ native: true, fileName: '/x.js', line: 1, column: 1, functionName: 'fn' });
            expect(stackEntry(frame, { withNativeFrames: false })).toBeUndefined();
            expect(stackEntry(frame, { withNativeFrames: true })).toBeDefined();
        });

        test('returns undefined for frames with no meaningful location info', () => {
            const frame = makeFrame({ line: undefined, column: undefined, fileName: undefined, functionName: undefined });
            expect(stackEntry(frame, {})).toBeUndefined();
        });

        test('enriches entry with code when getSource returns a position', () => {
            const frame = makeFrame({ fileName: '/dist/bundle.js', line: 10, column: 20, functionName: 'fn' });

            const getPositionWithCode = xJet.fn().mockReturnValue({
                name: 'mappedFn',
                line: 2,
                column: 3,
                source: '/src/app.ts',
                sourceRoot: null,
                sourceIndex: 0,
                generatedLine: 10,
                generatedColumn: 20,
                code: 'mapped();',
                startLine: 1,
                endLine: 3
            } satisfies PositionWithCodeInterface);

            const fakeSource = { getPositionWithCode } as any;

            const options: ResolveOptionsInterface = {
                getSource: () => fakeSource,
                linesAfter: 6,
                linesBefore: 2
            };

            const entry = stackEntry(frame, options);
            expect(entry).toBeDefined();
            expect(entry?.code).toBe('mapped();');

            expect(getPositionWithCode).toHaveBeenCalledWith(
                10,
                20,
                Bias.BOUND,
                { linesAfter: 6, linesBefore: 2 }
            );
        });

        test('falls back to plain formatted line when source lookup is missing or returns null', () => {
            const frame = makeFrame({ fileName: '/dist/bundle.js', line: 1, column: 1, functionName: 'fn' });

            const entryA = stackEntry(frame, { getSource: () => null });
            expect(entryA).toBeDefined();
            expect(entryA?.code).toBeUndefined();
            expect(entryA?.format).toContain('darkGray(/dist/bundle.js)');

            const fakeSource = { getPositionWithCode: xJet.fn().mockReturnValue(null) } as any;
            const entryB = stackEntry(frame, { getSource: () => fakeSource });
            expect(entryB).toBeDefined();
            expect(entryB?.code).toBeUndefined();
        });
    });

    describe('resolveError', () => {
        test('maps stack frames through stackEntry and omits filtered frames', () => {
            const err: ParsedStackTraceInterface = {
                name: 'TypeError',
                message: 'boom',
                rawStack: 'raw',
                stack: [
                    makeFrame({ native: true, fileName: 'node:internal', line: 1, column: 1, functionName: 'native' }),
                    makeFrame({ native: false, fileName: '/dist/bundle.js', line: 2, column: 3, functionName: 'user' })
                ]
            };

            const out = resolveError(err, { withNativeFrames: false });
            expect(out.name).toBe('TypeError');
            expect(out.message).toBe('boom');
            expect(out.stack).toHaveLength(1);
            expect(out.stack[0].format).toContain('darkGray(/dist/bundle.js)');
        });
    });
});

