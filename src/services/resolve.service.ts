/**
 * Import will remove at compile time
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
 * Formats a stack frame into a single display line.
 *
 * @param frame - Stack frame to format.
 * @returns Formatted stack trace line.
 *
 * @remarks
 * When `frame.fileName` is a URL, `#L<line>` is appended to improve linkability.
 * When both `line` and `column` are available, they are rendered as a `[line:column]` suffix.
 *
 * @since 5.0.0
 */

export function formatStackLine(frame: StackFrameInterface): string {
    let fileName = frame.fileName;
    if (!fileName) return frame.source ?? '';

    if(fileName.startsWith('http'))
        fileName += `#L${ frame.line }`;

    const position =
        frame.line && frame.column
            ? xterm.gray(`[${ frame.line }:${ frame.column }]`)
            : '';

    return `at ${ frame.functionName ?? '' } ${ xterm.darkGray(fileName) } ${ position }`
        .trim();
}

/**
 * Creates a formatted stack entry enriched with source context and highlighted code.
 *
 * @param position - Resolved position and extracted code context for the frame.
 * @param frame - Stack frame to enrich.
 * @returns Formatted stack frame entry containing `format` and optional `code`.
 *
 * @remarks
 * This function mutates `frame` with resolved `line`, `column`, `fileName`, and optionally `functionName`.
 * It formats the stack line with {@link formatStackLine} and highlights code with {@link highlightCode}
 * before passing it to {@link formatErrorCode}.
 *
 * @since 5.0.0
 */

export function stackSourceEntry(position: PositionWithCodeInterface, frame: StackFrameInterface): FormatStackFrameInterface {
    frame.line = position.line;
    frame.column = position.column;
    frame.fileName = position.source;
    if(position.name) frame.functionName = position.name;

    if(position.sourceRoot && !position.source.startsWith('http')) {
        frame.fileName = `${ position.sourceRoot }${ position.source }`;
    }

    return {
        ...frame,
        code: position.code,
        format: formatStackLine(frame),
        stratLine: position.startLine
    };
}

/**
 * Converts a stack frame into a formatted entry, optionally enriched with source code context.
 *
 * @param frame - Stack frame to convert.
 * @param options - Resolver options controlling filtering and source lookups.
 * @returns Formatted stack frame entry, or `undefined` when filtered out.
 *
 * @remarks
 * Frames marked as native (`frame.native === true`) are excluded unless `options.withNativeFrames` is true.
 * If a source is available via `options.getSource`, the frame is enriched with a highlighted code snippet.
 *
 * @since 5.0.0
 */

export function stackEntry(frame: StackFrameInterface, options?: ResolveOptionsInterface): FormatStackFrameInterface | undefined {
    if (!options?.withNativeFrames && frame.native) return;
    if (!frame.line && !frame.column && !frame.fileName && !frame.functionName) return;

    const source = options?.getSource?.(frame.fileName ?? '');
    if(source && frame.line && frame.column) {
        const position = source.getPositionWithCode(frame.line, frame.column, options?.bias ?? Bias.BOUND, {
            linesAfter: options?.linesAfter ?? 4,
            linesBefore: options?.linesBefore ?? 3
        });

        if(position) return stackSourceEntry(position, frame);
    }

    return {
        ...frame,
        format: formatStackLine(frame)
    };
}

/**
 * Resolves a parsed stack trace into structured metadata with formatted stack entries.
 *
 * @param error - Parsed stack trace to resolve.
 * @param options - Resolver options controlling filtering and source lookups.
 * @returns Resolved metadata containing `name`, `message`, and formatted `stack`.
 *
 * @remarks
 * Stack entries that are filtered out or cannot be enriched are omitted from the returned `stack`.
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
