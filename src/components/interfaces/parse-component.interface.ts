/**
 * Describes the origin of evaluated code referenced by a stack frame.
 *
 * @since 3.0.0
 */

export interface EvalOriginInterface {
    /**
     * 1-based line number within the evaluated source, when available.
     * @since 3.0.0
     */

    line?: number;

    /**
     * 1-based column number within the evaluated source line, when available.
     * @since 3.0.0
     */

    column?: number;

    /**
     * File name associated with the evaluated source, when available.
     * @since 3.0.0
     */

    fileName?: string;

    /**
     * Function name associated with the evaluated source, when available.
     * @since 3.0.0
     */

    functionName?: string;
}

/**
 * Represents a stack frame in a stack trace.
 *
 * @remarks
 * This structure provides location and classification details about a single call site,
 * primarily used for diagnostics, stack analysis, and rendering stack traces in a structured form.
 *
 * @since 3.0.0
 */

export interface StackFrameInterface {
    /**
     * The original frame text as provided by the runtime or parser.
     * @since 3.0.0
     */

    source: string;

    /**
     * 1-based line number within the source file, when available.
     * @since 3.0.0
     */

    line?: number;

    /**
     * 1-based column number within the source line, when available.
     * @since 3.0.0
     */

    column?: number;

    /**
     * File name for the call site, when available.
     * @since 3.0.0
     */

    fileName?: string;

    /**
     * Function name for the call site, when available.
     * @since 3.0.0
     */

    functionName?: string;

    /**
     * True when the frame originates from evaluated code (for example, `eval()`).
     * @since 3.0.0
     */

    eval: boolean;

    /**
     * True when the frame is part of an asynchronous call chain, when detectable.
     * @since 3.0.0
     */

    async: boolean;

    /**
     * True when the frame originates from native code execution.
     * @since 3.0.0
     */

    native: boolean;

    /**
     * True when the frame represents a constructor invocation.
     * @since 3.0.0
     */

    constructor: boolean;

    /**
     * Information about the evaluated code origin, when `eval` is true and the runtime provides it.
     * @see EvalOriginInterface
     * @since 3.0.0
     */

    evalOrigin?: EvalOriginInterface;
}

/**
 * Represents a fully parsed error stack trace with structured information.
 *
 * @remarks
 * `rawStack` preserves the original stack string for debugging and fallback rendering.
 *
 * @see StackFrameInterface
 * @since 2.1.0
 */

export interface ParsedStackTraceInterface {
    /**
     * Error name (for example, `TypeError`).
     * @since 2.1.0
     */

    name: string;

    /**
     * Error message.
     * @since 2.1.0
     */

    message: string;

    /**
     * Parsed frames in call order.
     * @see StackFrameInterface
     * @since 2.1.0
     */

    stack: Array<StackFrameInterface>;

    /**
     * The raw stack string as received from the runtime.
     * @since 2.1.0
     */

    rawStack: string;
}
