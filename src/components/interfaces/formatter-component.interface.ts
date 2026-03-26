/**
 * Import will remove at compile time
 */

import type { PositionWithCodeInterface } from '@services/interfaces/source-service.interface';
import type { ColorFunctionType } from '@components/interfaces/highlighter-component.interface';

/**
 * A callback function for formatting code lines
 *
 * @param lineString - The content of the line to be formatted
 * @param padding - The amount of padding to be applied to the line
 * @param line - The line number of the line to be formatted
 * @returns Formatted line string
 *
 * @since 1.0.0
 */

export type FormatCodeCallbackType =  (lineString: string, padding: number, line: number) => string;

/**
 * Configuration options for formatting code
 *
 * @since 1.0.0
 */

export interface FormatCodeInterface {
    /**
     * The amount of padding to be applied to each line
     * @since 1.0.0
     */

    padding?: number;

    /**
     * The starting line number for formatting
     * @since 1.0.0
     */

    startLine?: number;

    /**
     * An optional action object specifying a line where a callback function should be triggered.
     * @since 1.0.0
     */

    action?: {

        /**
         * The line number at which the callback function should be triggered.
         * @since 1.0.0
         */

        triggerLine: number;

        /**
         * The callback function to be executed when the trigger line is encountered.
         * @since 1.0.0
         */

        callback: FormatCodeCallbackType;
    };
}

/**
 * Configuration for ANSI color styling of error pointers
 * @since 1.0.0
 */

export interface AnsiOptionInterface {
    /**
     * ANSI color code to apply to the error pointer
     * @since 1.0.0
     */

    color: ColorFunctionType,
}

/**
 * A compact error position type used when only location and code metadata are needed.
 *
 * @remarks
 * This type includes the source code content and the minimal location fields required
 * to render or highlight an error snippet.
 *
 * @see PositionWithCodeInterface
 * @since 1.0.0
 */

export type ErrorCodeType = Pick<PositionWithCodeInterface, 'code' | 'line' | 'column' | 'startLine'>;
