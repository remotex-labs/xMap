/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { PositionWithCodeInterface } from '@services/interfaces/source-service.interface';
import type { AnsiOptionInterface, FormatCodeInterface, ErrorCodeType } from '@components/interfaces/formatter-component.interface';

/**
 * Exports
 */

export type * from '@components/interfaces/formatter-component.interface';

/**
 * Formats a code snippet with optional line padding and custom actions
 *
 * @param code - The source code | stack to be formatted
 * @param options - Configuration options for formatting the code
 * @returns A formatted string of the code snippet with applied padding and custom actions
 *
 * @remarks
 * This function takes a code string and an options object to format the code snippet.
 * It applies padding to line numbers and can trigger custom actions for specific lines.
 * Options include padding (default 10), startLine (default 1), and custom actions for specific lines.
 *
 * `startLine` is the 1-based number of the first line held in `code`,
 * so the first rendered line carries the number `startLine`.
 * `action.triggerLine` counts the same way.
 *
 * @example
 * ```ts
 * const formattedCode = formatCode(code, {
 *     padding: 8,
 *     startLine: 5,
 *     action: {
 *         triggerLine: 7,
 *         callback: (lineString, padding, lineNumber) => {
 *             return `Custom formatting for line ${lineNumber}: ${lineString}`;
 *         }
 *     }
 * });
 * ```
 *
 * @since 1.0.0
 */

export function formatCode(code: string, options: FormatCodeInterface = {}): string {
    const lines = code.split('\n');
    const padding = options.padding ?? 10;
    const startLine = options.startLine ?? 1;

    return lines.map((lineContent, index) => {
        const currentLineNumber = index + startLine;
        const prefix = `${ currentLineNumber } | `;
        const string = `${ prefix.padStart(padding) }${ lineContent }`;

        if (options.action && currentLineNumber === options.action.triggerLine) {
            return options.action.callback(string, padding, currentLineNumber);
        }

        return string;
    }).join('\n');
}

/**
 * Formats a code snippet around an error location with special highlighting
 *
 * @param sourcePosition - An object containing information about the source code and error location
 * @param ansiOption - Optional configuration for ANSI color codes
 * @returns A formatted string representing the relevant code snippet with error highlighting
 *
 * @throws Error - If the provided sourcePosition object has invalid line or column numbers
 *
 * @remarks
 * This function takes a sourcePosition object with code content and error location information,
 * then uses formatCode to format and highlight the relevant code snippet around the error.
 * The sourcePosition object should contain code (string), line (number), column (number),
 * and optional startLine (number, defaults to 1).
 *
 * `startLine` is the 1-based number of the first line held in `code`, matching `line`
 * and the `startLine` that {@link PositionWithCodeInterface} carries.
 * {@link formatCode} counts the same way, so this function passes the value straight through.
 *
 * `line` must fall inside the snippet and `column` must be at least `1`,
 * because a caret outside the rendered lines would mark nothing.
 *
 * @example
 * ```ts
 * const formattedErrorCode = formatErrorCode({
 *     code: "const x = 1;\nconst y = x.undefined;\n",
 *     line: 2,
 *     column: 15,
 *     startLine: 1
 * });
 * // renders the snippet numbered from line 1, with a caret under column 15 of line 2
 * ```
 *
 * @see formatCode - The underlying function used for basic code formatting
 *
 * @since 1.0.0
 */

export function formatErrorCode(
    sourcePosition: PositionWithCodeInterface | ErrorCodeType, ansiOption?: AnsiOptionInterface
): string {
    const { code, line: errorLine, column: errorColumn } = sourcePosition;
    const startLine = sourcePosition.startLine ?? 1;
    const endLine = startLine + code.split('\n').length - 1;

    if (errorLine < startLine || errorLine > endLine || errorColumn < 1)
        throw new Error('Invalid line or column number.');

    return formatCode(code, {
        startLine,
        action: {
            triggerLine: errorLine,
            callback: (lineString, padding, line) => {
                let pointer = '^';
                let ansiPadding = padding - 1;
                let prefixPointer = '>';

                if (ansiOption) {
                    pointer = ansiOption.color(pointer);
                    ansiPadding += pointer.length - 1;
                    prefixPointer = ansiOption.color('>');
                }

                const content = lineString.slice(lineString.indexOf('|') + 1);
                const errorMarker = ' | '.padStart(padding) + ' '.repeat(errorColumn - 1) + `${ pointer }`;
                lineString = `${ prefixPointer } ${ line } |`.padStart(ansiPadding) + content;

                return lineString + `\n${ errorMarker }`;
            }
        }
    });
}
