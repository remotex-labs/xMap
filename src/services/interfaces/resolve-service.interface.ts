/**
 * Import will remove at compile time
 */

import type { Bias } from '@components/segment.component';
import type { SourceService } from '@services/source.service';
import type { StackFrameInterface } from '@components/interfaces/parser-component.interface';

/**
 * Options controlling stack trace resolution and source context extraction.
 *
 * @remarks
 * These options are consumed by the resolver to decide how to interpret positions,
 * how much code context to include, and whether to filter native frames.
 *
 * @since 5.0.0
 */

export interface ResolveOptionsInterface {
    /**
     * Bias used when mapping line/column pairs to a source position.
     *
     * @remarks
     * Passed through to the underlying source resolver when extracting code context.
     *
     * @since 5.0.0
     */

    bias?: Bias;

    /**
     * Number of lines of source code to include after the error line.
     *
     * @defaultValue 3
     *
     * @remarks
     * Defaults to 3 if not specified. Used when extracting code context
     * from source files or snapshots.
     *
     * @since 5.0.0
     */

    linesAfter?: number;

    /**
     * Number of lines of source code to include before the error line.
     *
     * @defaultValue 3
     *
     * @remarks
     * Defaults to 3 if not specified. Used when extracting code context
     * from source files or snapshots.
     *
     * @since 5.0.0
     */

    linesBefore?: number;

    /**
     * Whether to include native (built-in) stack frames in the output.
     *
     * @defaultValue Based on `ConfigurationService.verbose` setting
     *
     * @remarks
     * Native frames are those marked with `frame.native === true`, typically
     * representing Node.js internal functions. When false, these frames are
     * filtered out during processing. Automatically set based on the `verbose`
     * configuration setting if not explicitly provided.
     *
     * @since 5.0.0
     */

    withNativeFrames?: boolean;

    /**
     * Resolves a {@link SourceService} for the provided path.
     *
     * @param path - File path or URL to resolve.
     * @returns The source service when available, otherwise `null`/`undefined`.
     *
     * @remarks
     * When provided, the resolver uses this callback to enrich frames with highlighted code context.
     *
     * @since 5.0.0
     */

    getSource?(path: string): SourceService | null | undefined;
}

/**
 * Structured metadata produced by resolving a parsed stack trace.
 *
 * @since 5.0.0
 */

export interface ResolveMetadataInterface {
    /**
     * Error name (for example, `TypeError`).
     * @since 5.0.0
     */

    name: string;

    /**
     * Error message.
     * @since 5.0.0
     */

    message: string;

    /**
     * Formatted stack frames.
     * @see FormatStackFrameInterface
     * @since 5.0.0
     */

    stack: Array<FormatStackFrameInterface>;
}

/**
 * A stack frame enriched with display formatting and optional source code context.
 *
 * @see StackFrameInterface
 * @since 5.0.0
 */

export interface FormatStackFrameInterface extends StackFrameInterface {
    /**
     * Highlighted code context, when available.
     * @since 5.0.0
     */

    code?: string;

    /**
     * Formatted stack line representation.
     * @since 5.0.0
     */

    format: string;

    /**
     * Starting line number of the highlighted code fragment.
     *
     * @remarks
     * Used together with {@link code} to indicate the first line displayed
     * in the extracted source context.
     *
     * @since 5.0.1
     */

    stratLine?: number;
}
