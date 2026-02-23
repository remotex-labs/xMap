# xMap

[![Documentation](https://img.shields.io/badge/Documentation-orange?logo=typescript&logoColor=f5f5f5)](https://remotex-labs.github.io/xMap/)
[![npm version](https://img.shields.io/npm/v/@remotex-labs/xmap.svg)](https://www.npmjs.com/package/@remotex-labs/xmap)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js CI](https://github.com/remotex-labs/xMap/actions/workflows/test.yml/badge.svg)](https://github.com/remotex-labs/xMap/actions/workflows/test.yml)
[![Discord](https://img.shields.io/discord/1364348850696884234?logo=Discord&label=Discord)](https://discord.gg/psV9grS9th)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/remotex-labs/xMap)


`xMap` is a TypeScript library for working with source maps, stack trace parsing, and code formatting. It provides powerful tools for debugging, error reporting, and code visualization in CLI environments.

## Features

- **Source Map Processing**: Parse, manipulate, and query source maps
- **Stack Trace Parsing**: Parse error stacks from V8, SpiderMonkey, and JavaScriptCore engines
- **Code Formatting**: Display code with line numbers and custom highlighting
- **Syntax Highlighting**: Semantic TypeScript code highlighting with customizable themes
- **Error Visualization**: Format code snippets with error indicators

## Installation

To install the package, use npm or yarn:

```bash
npm install @remotex-labs/xmap
```

or

```bash
yarn add @remotex-labs/xmap
```

## Optimizing Bundle Size

xMap supports subpath imports, allowing you to import only the specific components you need:

```ts
// Import only what you need
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { formatCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';
import { SourceService } from '@remotex-labs/xmap';
```

## Key Components

### SourceService

Process and query source maps to get original positions, concatenate maps, and retrieve code snippets.

```ts
import { SourceService, Bias } from '@remotex-labs/xmap';

// Create from JSON string
const sourceService = new SourceService(sourceMapJSON, 'bundle.js');

// Get original position for generated code
const originalPosition = sourceService.getPositionByGenerated(12, 34);

// Get position with code context
const positionWithCode = sourceService.getPositionWithCode(12, 34, Bias.LOWER_BOUND, { 
  linesBefore: 2, 
  linesAfter: 2 
});
```

#### Understanding Bias

When querying source maps, the parameter controls how positions are matched: `Bias`

- `Bias.BOUND` - No directional preference; returns the first match found
- `Bias.LOWER_BOUND` - Prefers segments with column values ≤ the target
- `Bias.UPPER_BOUND` - Prefers segments with column values ≥ the target `Bias.UPPER_BOUND`

Example:

```ts
// Using different bias values for position lookup
const exactPosition = sourceService.getPosition(10, 15, Bias.BOUND);
const beforePosition = sourceService.getPosition(10, 15, Bias.LOWER_BOUND);
const afterPosition = sourceService.getPosition(10, 15, Bias.UPPER_BOUND);
```

### Stack Trace Parser

Parse error stack traces from different JavaScript engines into a structured format.

```ts
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

try {
  throw new Error('Example error');
} catch (error) {
  const parsedStack = parseErrorStack(error);
  
  console.log(parsedStack.name);     // "Error"
  console.log(parsedStack.message);  // "Example error"
  
  // Access the first stack frame
  const frame = parsedStack.stack[0];
  console.log(frame.fileName);       // File where error occurred
  console.log(frame.line);           // Line number
  console.log(frame.functionName);   // Function name
}

```

### Code Highlighter

Apply semantic syntax highlighting to TypeScript code.

```ts
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

const code = `
function sum(a: number, b: number): number {
  return a + b;
}
`;

// Use default color scheme
const highlightedCode = highlightCode(code);

// Or customize with your own color scheme
const customScheme = {
    keywordColor: (text: string): string => `\x1b[36m${ text }\x1b[0m`,  // Blue for keywords
    stringColor: (text: string): string => `\x1b[32m${ text }\x1b[0m`,  // Blue for keywords
    numberColor: (text: string): string => `\x1b[31m${ text }\x1b[0m`  // Blue for keywords
};

const customHighlightedCode = highlightCode(code, customScheme);
console.log(customHighlightedCode)
```

![image](docs/public/images/code.png)

## formatCode

The `formatCode` function formats a given code snippet, adding line numbers with customizable padding and enabling specific actions for particular lines.
This utility is useful for displaying code snippets in a user-friendly manner, particularly in documentation or debugging scenarios.

```ts
import { formatCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

const code = `
function greet(name: string) {
  console.log('Hello, ' + name);
}

greet('World');
`;

// Format with custom options
const formattedCode = formatCode(highlightCode(code), {
    padding: 8,         // Padding for line numbers
    startLine: 1,       // Starting line number
    action: {
        triggerLine: 3,   // Line to apply custom formatting
        callback: (lineString, padding, lineNumber) => {
            return `*** Line ${ lineNumber } ***\n${ lineString }`;
        }
    }
});

console.log(formattedCode);
```

![image](docs/public/images/formatCode.png)

```ts
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';

const sourcePosition = {
    code: 'function divide(a, b) {\n  return a / b;\n}',
    line: 2,
    column: 13,
    startLine: 1,
    endLine: 0,
    name: null,
    source: '',
    sourceRoot: null,
    sourceIndex: 0,
    generatedLine: 0,
    generatedColumn: 0
};

// Format with error indicator
const formattedError = formatErrorCode(sourcePosition, {
    color: (text) => `\x1b[31m${ text }\x1b[0m`  // Red color for error indicator
});

console.log(formattedError)
```

![image](docs/public/images/formatErrorCode.png)

## Practical Examples

### Working with Source Maps and Errors

```ts
import { SourceService, Bias } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

try {
    // Code that throws an error
    throw new Error('Something went wrong');
} catch (error) {
    // Parse the error stack
    const parsedStack = parseErrorStack(error);

    // Get the top frame
    const frame = parsedStack.stack[0];

    if (frame.fileName && frame.line && frame.column) {
        // Initialize source service with your source map
        const sourceService = new SourceService(sourceMapJSON);

        // Get original position with code
        const position = sourceService.getPositionWithCode(
            frame.line,
            frame.column,
            Bias.LOWER_BOUND,
            { linesBefore: 2, linesAfter: 2 }
        );

        if (position) {
            // Apply syntax highlighting
            position.code = highlightCode(position.code);

            // Format with error indicator
            const formattedError = formatErrorCode(position, {
                color: (text) => `\x1b[31m${ text }\x1b[0m`
            });

            console.log('Error occurred:');
            console.log(formattedError);
        }
    }
}

```

```ts
import { SourceService } from '@remotex-labs/xmap';

const sourceMapJSON = `
{
  "version": 3,
  "sources": ["../src/core/core.component.ts", "../src/index.ts"],
  "sourceRoot": "https://github.com/remotex-lab/xmap/tree/test/",
  "sourcesContent": [
    "export class CoreModule {\\r\\n  private name: string;\\r\\n}",
    "import { CoreModule } from '@core/core.component';\\r\\nconsole.log(new CoreModule('Core Module'));"
  ],
  "mappings":
    "aAAO,IAAMA,EAAN,KAAiB,CACZ,KAER,YAAYC,EAAc,CACtB,KAAK,KAAOA,CAChB,CAEO,OAAgB,CACnB,MAAO,cAAc,KAAK,IAAI,GAClC,CACJ,ECRA,IAAMC,EAAe,IAAIC,EAAW,aAAa,EAEjD,QAAQ,IAAID,EAAa,MAAM,CAAC",
  "names": ["CoreModule", "name", "coreInstance", "CoreModule"]
}
`;
const sourceService = new SourceService(sourceMapJSON, 'bundle.js');
console.log(sourceService);

const position = sourceService.getPositionByOriginal(3, 7, 'index.ts');
console.log(position);

const positionWithCode = sourceService.getPositionWithCode(1, 104, 1, { linesBefore: 2, linesAfter: 2 });
console.log(positionWithCode);

```

## Documentation

For complete API documentation, examples, and guides, visit: [xMap Documentation](https://remotex-labs.github.io/xMap/)

## Compatibility

- Node.js 20+
- All modern browsers (via bundlers)
- TypeScript 4.5+

## Contributing

Contributions are welcome!\
Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with TypeScript
