/**
 * Represents a function that applies coloring or formatting to strings.
 *
 * @param args - Strings to be formatted
 * @returns The formatted string
 *
 * @since 1.0.0
 */

export type ColorFunctionType = (...args: Array<string>) => string;

/**
 * Defines a color scheme for syntax highlighting various code elements.
 *
 * @remarks
 * Each property is a {@link ColorFunctionType} that formats a specific type of syntax element,
 * such as enums, classes, keywords, or literals.
 *
 * @see ColorFunctionType
 * @since 1.0.0
 */

export interface HighlightSchemeInterface {
    /**
     * Color function for enum names.
     * @since 1.0.0
     */

    enumColor: ColorFunctionType;

    /**
     * Color function for type names.
     * @since 1.0.0
     */

    typeColor: ColorFunctionType;

    /**
     * Color function for class names.
     * @since 1.0.0
     */

    classColor: ColorFunctionType;

    /**
     * Color function for string literals.
     * @since 1.0.0
     */

    stringColor: ColorFunctionType;

    /**
     * Color function for language keywords.
     * @since 1.0.0
     */

    keywordColor: ColorFunctionType;

    /**
     * Color function for comments.
     * @since 1.0.0
     */

    commentColor: ColorFunctionType;

    /**
     * Color function for function names.
     * @since 1.0.0
     */

    functionColor: ColorFunctionType;

    /**
     * Color function for variable names.
     * @since 1.0.0
     */

    variableColor: ColorFunctionType;

    /**
     * Color function for interface names.
     * @since 1.0.0
     */

    interfaceColor: ColorFunctionType;

    /**
     * Color function for function/method parameters.
     * @since 1.0.0
     */

    parameterColor: ColorFunctionType;

    /**
     * Color function for getter accessor names.
     * @since 1.0.0
     */

    getAccessorColor: ColorFunctionType;

    /**
     * Color function for numeric literals.
     * @since 1.0.0
     */

    numericLiteralColor: ColorFunctionType;

    /**
     * Color function for method signatures.
     * @since 1.0.0
     */

    methodSignatureColor: ColorFunctionType;

    /**
     * Color function for regular expressions.
     * @since 1.0.0
     */

    regularExpressionColor: ColorFunctionType;

    /**
     * Color function for property assignments.
     * @since 1.0.0
     */

    propertyAssignmentColor: ColorFunctionType;

    /**
     * Color function for property access expressions.
     * @since 1.0.0
     */

    propertyAccessExpressionColor: ColorFunctionType;

    /**
     * Color function for expressions with type arguments.
     * @since 1.0.0
     */

    expressionWithTypeArgumentsColor: ColorFunctionType;
}

/**
 * Represents a segment of source code to be highlighted with specific styling.
 *
 * @remarks
 * Segments are the fundamental units of the highlighting system.
 * Each segment represents a portion of text that should receive specific styling.
 * When the source code is processed for display,
 * these segments are used to insert the appropriate color/style codes at the correct positions.
 *
 * The highlighter maintains a collection of these segments and applies them
 * in position order to create the complete highlighted output.
 *
 * @example
 * ```ts
 * const keywordSegment: HighlightNodeSegmentInterface = {
 *   start: 0,
 *   end: 6,
 *   color: xterm.red
 * };
 * ```
 *
 * @see addSegment
 * @see HighlightSchemeInterface
 *
 * @since 1.0.0
 */

export interface HighlightNodeSegmentInterface {
    /**
     * The starting character position of the segment in the source text.
     * @since 1.0.0
     */
    start: number;

    /**
     * The ending character position of the segment in the source text.
     * @since 1.0.0
     */
    end: number;

    /**
     * The color or style code to apply to this segment.
     * @since 1.0.0
     */
    color: ColorFunctionType;
}
