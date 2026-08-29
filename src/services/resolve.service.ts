/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { FormatStackFrameInterface } from './interfaces/resolve-service.interface';
import type { PositionWithCodeInterface } from '@services/interfaces/source-service.interface';
import type { ResolveOptionsInterface, ResolveMetadataInterface } from './interfaces/resolve-service.interface';
import type { ParsedStackTraceInterface, StackFrameInterface } from '@components/interfaces/parser-component.interface';

/**
 * Imports
 */

import { Bias } from '@components/segment.component';
import { xterm } from '@remotex-labs/xansi/xterm.component';

/**
 * The pattern that marks a source as an absolute `http` or `https` URL.
 *
 * @remarks
 * The scheme separator is part of the match, so a local file merely named `httpClient.ts`
 * stays a path.
 *
 * @since 6.0.0
 */

const HTTP_URL_RE = /^https?:\/\//i;

/**
 * Formats a stack frame into a single display line.
 *
 * @param frame - Stack frame to format
 * @returns Formatted stack trace line
 *
 * @remarks
 * A frame whose `fileName` is an `http` or `https` URL gains a `#L<line>` suffix,
 * so the line stays linkable.
 * A frame carrying no line number gets no suffix, since `#L` alone points nowhere.
 * The `[line:column]` suffix renders only when the frame carries both.
 *
 * @example
 * ```ts
 * formatStackLine({ fileName: '/app/index.ts', line: 12, column: 8, functionName: 'boom' });
 * // 'at boom /app/index.ts [12:8]'
 * ```
 *
 * @see StackFrameInterface
 *
 * @since 5.0.0
 */

export function formatStackLine(frame: StackFrameInterface): string {
    let fileName = frame.fileName ?? frame.source ?? '';
    const functionName = frame.functionName ? `${ frame.functionName } ` : '';
    if (frame.line !== undefined && HTTP_URL_RE.test(fileName))
        fileName += `#L${ frame.line }`;

    const position =
        frame.line && frame.column
            ? xterm.gray(`[${ frame.line }:${ frame.column }]`)
            : '';

    return `at ${ functionName }${ xterm.darkGray(fileName) } ${ position }`
        .trim();
}

/**
 * Creates a formatted stack entry enriched with source context and highlighted code.
 *
 * @param position - Resolved position and extracted code context for the frame
 * @param frame - Stack frame to enrich
 * @returns Formatted stack frame entry carrying `format`, the `code` snippet, and its start line
 *
 * @remarks
 * This function overwrites the frame's `line`, `column`, `fileName`, and where the position names one,
 * its `functionName`.
 * A position that carries a `sourceRoot` and a source outside `http` prefixes the frame's file name
 * with that root.
 * {@link formatStackLine} renders the display line, and the extracted code context carries through
 * for a caller to render.
 *
 * @example
 * ```ts
 * const entry = stackSourceEntry(position, frame);
 * entry.format;    // 'at boom /app/index.ts [12:8]'
 * entry.stratLine; // 9 - the first line the snippet holds
 * ```
 *
 * @see StackFrameInterface
 * @see PositionWithCodeInterface
 *
 * @since 5.0.0
 */

export function stackSourceEntry(position: PositionWithCodeInterface, frame: StackFrameInterface): FormatStackFrameInterface {
    frame.line = position.line;
    frame.column = position.column;
    if (position.name) frame.functionName = position.name;

    if (position.sourceRoot && !HTTP_URL_RE.test(position.source)) {
        frame.fileName = `${ position.sourceRoot }${ position.source }`;
    }

    return {
        ...frame,
        code: position.code,
        format: formatStackLine(frame),
        stratLine: position.startLine,
        sourceRoot: position.sourceRoot
    };
}

/**
 * Converts a stack frame into a formatted entry, optionally enriched with source code context.
 *
 * @param frame - Stack frame to convert
 * @param options - Resolver options controlling filtering and source lookups
 * @returns Formatted stack frame entry, or `undefined` when filtered out
 *
 * @remarks
 * Frames marked as native (`frame.native === true`) are excluded unless `options.withNativeFrames` is true.
 * If a source is available via `options.getSource`, the frame is enriched with a highlighted code snippet.
 *
 * Only those two filters drop a frame.
 * Where enrichment is not possible - no `getSource`, no mapping for the position,
 * or a map carrying no `sourcesContent` for the resolved file - the frame still comes back
 * with its `format` line and without `code`.
 *
 * @example
 * ```ts
 * const entry = stackEntry(frame, { getSource });
 * entry?.code; // the source snippet, or undefined when the map carries no content for the file
 * ```
 *
 * @see ResolveOptionsInterface
 * @see FormatStackFrameInterface
 *
 * @since 5.0.0
 */

export function stackEntry(frame: StackFrameInterface, options?: ResolveOptionsInterface): FormatStackFrameInterface | undefined {
    if (!options?.withNativeFrames && frame.native) return;
    if (!frame.line && !frame.column && !frame.fileName && !frame.functionName) return;

    const source = options?.getSource?.(frame.fileName ?? '');
    if (source && frame.line && frame.column) {
        const position = source.getPositionWithCode(frame.line, frame.column, options?.bias ?? Bias.BOUND, {
            linesAfter: options?.linesAfter ?? 4,
            linesBefore: options?.linesBefore ?? 3
        });

        if (position) {
            position.line += options?.lineOffset ?? 0;
            position.endLine += options?.lineOffset ?? 0;
            position.startLine += options?.lineOffset ?? 0;

            return stackSourceEntry(position, frame);
        }
    }

    return {
        ...frame,
        format: formatStackLine(frame)
    };
}

/**
 * Resolves a parsed stack trace into structured metadata with formatted stack entries.
 *
 * @param error - Parsed stack trace to resolve
 * @param options - Resolver options controlling filtering and source lookups
 * @returns Resolved metadata carrying `name`, `message`, and the formatted `stack`
 *
 * @remarks
 * The returned `stack` holds one entry per frame that {@link stackEntry} kept,
 * so it omits the frames that filtering dropped and no others.
 * A frame that the resolver could not enrich still appears, carrying its `format` line and no `code`.
 *
 * @example
 * ```ts
 * const { stack } = resolveError(parsedStack, { getSource });
 * stack.length; // 3 - one entry per frame that survived filtering
 * ```
 *
 * @see ResolveOptionsInterface
 * @see ResolveMetadataInterface
 *
 * @since 5.0.0
 */

export function resolveError(error: ParsedStackTraceInterface, options: ResolveOptionsInterface = {}): ResolveMetadataInterface {
    const stacks = error.stack
        .map(frame => stackEntry(frame, options))
        .filter(Boolean) as Array<FormatStackFrameInterface>;

    return {
        name: error.name,
        stack: stacks,
        message: error.message
    };
}
