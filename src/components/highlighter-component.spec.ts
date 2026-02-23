/**
 * Import will remove at compile time
 */

import type { PositionWithCodeInterface } from '@services/interfaces/source-service.interface';

/**
 * Imports
 */

import ts from 'typescript';
import { xterm } from '@remotex-labs/xansi/xterm.component';
import { formatErrorCode } from '@components/formatter.component';
import { CodeHighlighter, highlightCode } from '@components/highlighter.component';


/**
 * Schema test
 */

const schema = {
    enumColor: xterm.burntOrange,
    typeColor: xterm.lightGoldenrodYellow,
    classColor: xterm.lightOrange,
    stringColor: xterm.oliveGreen,
    keywordColor: xterm.lightCoral,
    commentColor: xterm.darkGray,
    functionColor: xterm.lightOrange,
    variableColor: xterm.burntOrange,
    interfaceColor: xterm.lightGoldenrodYellow,
    parameterColor: xterm.deepOrange,
    getAccessorColor: xterm.lightYellow,
    numericLiteralColor: xterm.lightGray,
    methodSignatureColor: xterm.burntOrange,
    regularExpressionColor: xterm.oliveGreen,
    propertyAssignmentColor: xterm.canaryYellow,
    propertyAccessExpressionColor: xterm.lightYellow,
    expressionWithTypeArgumentsColor: xterm.lightOrange
};

/**
 * Tests
 */

describe('highlightCode', () => {
    beforeEach(() => {
        xJet.resetAllMocks();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should highlight keywords in the code', () => {
        const code = 'const x = 42;';
        const highlightedCode = highlightCode(code, { keywordColor: (text: string) => `brightPink: ${ text }` });

        expect(highlightedCode).toContain('brightPink: ');
        expect(highlightedCode).toContain('const');
    });

    test('should highlight string literals in the code', () => {
        const code = 'const str = "hello";';
        const highlightedCode = highlightCode(code, { stringColor: (text: string) => `oliveGreen: ${ text }` });
        expect(highlightedCode).toContain('oliveGreen: ');
        expect(highlightedCode).toContain('"hello"');
    });

    test('should highlight comments in the code', () => {
        const code = '// this is a comment\nconst x = 42;';
        const highlightedCode = highlightCode(code, { commentColor: (text: string) => `darkGray: ${ text }` });
        expect(highlightedCode).toContain('darkGray: ');
        expect(highlightedCode).toContain('// this is a comment');
    });

    test('should use default scheme when no schema is provided', () => {
        const code = 'const x: number = 42;';
        const highlightedCode = highlightCode(code, { keywordColor: (text: string) => `lightCoral: ${ text }` });

        expect(highlightedCode).toBe(
            'lightCoral: const \u001b[38;5;208mx\u001b[39m: ' +
            '\u001b[38;5;221mnumber\u001b[39m = \u001b[38;5;252m42\u001b[39m;'
        );
    });

    test('should combine segments correctly when segment.start < parent.end', () => {
        const code = 'const x: Promise<string>;';
        const result = highlightCode(code, schema);

        expect(result).toBe(
            '\u001b[38;5;203mconst\u001b[39m \u001b[38;5;208mx\u001b[39m: \u001b[38;5;221mPromise\u001b[39m<\u001b[38;5;221mstring\u001b[39m>;'
        );
    });

    test('should correctly highlight template strings with embedded expressions', () => {
        const code = 'const x: string = `dat to validate ${ this.name } end string`';
        const result = highlightCode(code, schema);

        expect(result).toBe(
            '\u001b[38;5;203mconst\u001b[39m \u001b[38;5;208mx\u001b[39m: \u001b[38;5;221mstring\u001b[39m = ' +
            '\u001b[38;5;149m`dat to validate ${\u001b[39m \u001b[38;5;203mthis\u001b[39m.\u001b[38;5;230mname\u001b[39m \u001b[38;5;149m} end string`\u001b[39m'
        );
    });
});

describe('Process Identifier', () => {
    let highlighter: CodeHighlighter;
    const mockAddSegment = xJet.fn();

    beforeEach(() => {
        highlighter = new CodeHighlighter(<any> {}, '', schema);
        (<any> highlighter).addSegment = mockAddSegment;
        xJet.resetAllMocks();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    const testCases = [
        { kind: ts.SyntaxKind.EnumMember, color: schema.enumColor },
        { kind: ts.SyntaxKind.CallExpression, color: schema.variableColor },
        { kind: ts.SyntaxKind.EnumDeclaration, color: schema.variableColor },
        { kind: ts.SyntaxKind.PropertySignature, color: schema.variableColor },
        { kind: ts.SyntaxKind.ModuleDeclaration, color: schema.variableColor },
        { kind: ts.SyntaxKind.InterfaceDeclaration, color: schema.interfaceColor },
        { kind: ts.SyntaxKind.GetAccessor, color: schema.getAccessorColor },
        { kind: ts.SyntaxKind.PropertyAssignment, color: schema.propertyAssignmentColor },
        { kind: ts.SyntaxKind.MethodSignature, color: schema.methodSignatureColor },
        { kind: ts.SyntaxKind.MethodDeclaration, color: schema.functionColor },
        { kind: ts.SyntaxKind.FunctionDeclaration, color: schema.functionColor },
        { kind: ts.SyntaxKind.ClassDeclaration, color: schema.classColor },
        { kind: ts.SyntaxKind.Parameter, color: schema.parameterColor },
        { kind: ts.SyntaxKind.VariableDeclaration, color: schema.variableColor },
        { kind: ts.SyntaxKind.PropertyDeclaration, color: schema.variableColor },
        { kind: ts.SyntaxKind.ExpressionWithTypeArguments, color: schema.expressionWithTypeArgumentsColor },
        { kind: ts.SyntaxKind.BreakStatement, color: schema.variableColor },
        { kind: ts.SyntaxKind.ShorthandPropertyAssignment, color: schema.variableColor },
        { kind: ts.SyntaxKind.BindingElement, color: schema.variableColor },
        { kind: ts.SyntaxKind.BinaryExpression, color: schema.variableColor },
        { kind: ts.SyntaxKind.SwitchStatement, color: schema.variableColor },
        { kind: ts.SyntaxKind.TemplateSpan, color: schema.variableColor },
        { kind: ts.SyntaxKind.TypeReference, color: schema.typeColor },
        { kind: ts.SyntaxKind.TypeAliasDeclaration, color: schema.typeColor },
        { kind: ts.SyntaxKind.NewExpression, color: schema.variableColor }
    ];

    testCases.forEach(({ kind, color }) => {
        test(`should add segment for ${ ts.SyntaxKind[kind] } nodes`, () => {
            const mockNode = {
                getStart: xJet.fn().mockReturnValue(0),
                getEnd: xJet.fn().mockReturnValue(10),
                kind: ts.SyntaxKind.Identifier,
                parent: {
                    kind: kind
                }
            };

            (<any> highlighter).processNode(mockNode);
            expect(mockAddSegment).toHaveBeenCalledWith(0, 10, color);
        });
    });

    test('should add segment with variableColor when parent text matches node text', () => {
        const mockNode = {
            getStart: xJet.fn().mockReturnValue(0),
            getEnd: xJet.fn().mockReturnValue(10),
            getText: xJet.fn().mockReturnValue('propertyAccess'),
            kind: ts.SyntaxKind.Identifier,
            parent: {
                kind: ts.SyntaxKind.PropertyAccessExpression,
                getChildAt: xJet.fn().mockReturnValue({
                    getText: xJet.fn().mockReturnValue('propertyAccess')
                })
            }
        };

        (<any> highlighter).processNode(mockNode);
        expect(mockAddSegment).toHaveBeenCalledWith(0, 10, schema.variableColor);
    });

    test('should add segment with propertyAccessExpressionColor when parent text does not match node text', () => {
        const mockNode = {
            getStart: xJet.fn().mockReturnValue(0),
            getEnd: xJet.fn().mockReturnValue(10),
            getText: xJet.fn().mockReturnValue('propertyAccess'),
            kind: ts.SyntaxKind.Identifier,
            parent: {
                kind: ts.SyntaxKind.PropertyAccessExpression,
                getChildAt: xJet.fn().mockReturnValue({
                    getText: xJet.fn().mockReturnValue('differentText')
                })
            }
        };

        (<any> highlighter).processNode(mockNode);
        expect(mockAddSegment).toHaveBeenCalledWith(0, 10, schema.propertyAccessExpressionColor);
    });
});

describe('Process Node', () => {
    let highlighter: CodeHighlighter;
    const mockAddSegment = xJet.fn();

    beforeEach(() => {
        highlighter = new CodeHighlighter(<any> {}, '', schema);
        (<any> highlighter).addSegment = mockAddSegment;
        xJet.resetAllMocks();
    });

    afterAll(() => {
        xJet.restoreAllMocks();
    });

    const testCases = [
        { kind: ts.SyntaxKind.TypeParameter, color: schema.typeColor, end: 4 },
        { kind: ts.SyntaxKind.RegularExpressionLiteral, color: schema.regularExpressionColor, end: 10 }
    ];

    testCases.forEach(({ kind, color, end }) => {
        test(`should add segment for ${ ts.SyntaxKind[kind] } nodes`, () => {

            const mockNode = {
                getStart: xJet.fn().mockReturnValue(0),
                getEnd: xJet.fn().mockReturnValue(10),
                kind,
                name: {
                    text: '1234'
                }
            };

            (<any> highlighter).processNode(mockNode);
            expect(mockAddSegment).toHaveBeenCalledWith(0, end, color);
        });
    });
});

describe('formatErrorCode', () => {
    afterAll(() => {
        xJet.restoreAllMocks();
    });

    test('should format code with error highlight with custom color', () => {
        const code = 'line1\nline2\nline3';
        const sourcePosition = <PositionWithCodeInterface> {
            code,
            line: 3,
            column: 4,
            name: '',
            source: '',
            endLine: 3,
            startLine: 1
        };
        const ansiOption = {
            color: xterm.red
        };

        const result = formatErrorCode(sourcePosition, ansiOption);
        expect(result).toBe('      2 | line1\n    \u001b[31m>\u001b[39m 3 | line2\n        |    \u001b[31m^\u001b[39m\n      4 | line3');
    });

    test('should format code with error highlight', () => {
        const code = 'line1\nline2\nline3';
        const sourcePosition = <PositionWithCodeInterface> {
            code,
            line: 2,
            name: '',
            source: '',
            column: 4,
            endLine: 3,
            startLine: 0
        };

        expect(formatErrorCode(sourcePosition)).toBe('      1 | line1\n    > 2 | line2\n        |    ^\n      3 | line3');
    });

    test('should throw an error for invalid line number', () => {
        const sourcePosition = {
            code: 'line1\nline2\nline3',
            line: 4,
            column: 2,
            startLine: 5
        };

        expect(() => formatErrorCode(<any> sourcePosition)).toThrow('Invalid line or column number.');
    });

    test('should throw an error for invalid column number', () => {
        const sourcePosition = {
            code: 'line1\nline2\nline3',
            line: 2,
            column: -1,
            startLine: 1
        };

        expect(() => formatErrorCode(<any> sourcePosition)).toThrow('Invalid line or column number.');
    });
});

