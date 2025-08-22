# Parse
The xMap library provides robust error stack trace parsing capabilities to help you extract structured information 
from JavaScript error stacks across different JavaScript engines. This document explains how to use the stack trace 
parsing functions and understand the parsed data structure.

## Imports
You can import the ANSI component in two ways:

```ts
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
```

## parseErrorStack
The `parseErrorStack` function is the main entry point for stack trace parsing in xMap. 

```ts
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

try {
    // Some code that throws an error
    throw new Error('Something went wrong');
} catch (error: any) {
    // Parse the error stack
    const parsedStack = parseErrorStack(error);

    console.log(parsedStack.name);    // "Error"
    console.log(parsedStack.message); // "Something went wrong"
    console.log(parsedStack.stack);   // Array of parsed stack frames
}

```

You can also parse a string representation of an error stack:
```ts
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

const errorString = `Error: Invalid argument
    at validateInput (/app/utils.js:42:3)
    at processRequest (/app/controllers/main.js:21:5)
    at async handleRequest (/app/server.js:15:10)`;

const parsedStack = parseErrorStack(errorString);
console.log(parsedStack)

```

### Parsed Stack Structure
The `parseErrorStack` function returns a object with the following properties: `ParsedStackTraceInterface`
- `name`: The error type name (e.g., "Error", "TypeError")
- `message`: The error message 
- `stack`: An array of parsed stack frames (StackFrameInterface objects)
- `rawStack`: The original unparsed stack trace string

Each stack frame in the `stack` array contains:
- `source`: The original stack line string 
- `fileName`: The file path where the error occurred
- `line`: The line number (if available) 
- `column`: The column number (if available) 
- `functionName`: The function name (if available)
- `eval`: Boolean indicating if the frame is from evaluated code
- `native`: Boolean indicating if the frame is from native code
- `async`: Boolean indicating if the frame is from an async function 
- `constructor`: Boolean indicating if the frame is from a constructor 
- `evalOrigin`: (Optional) If the frame is from evaluated code, contains information about the eval origin

## Supported JavaScript Engines
The xMap parser recognizes stack traces from three major JavaScript engines:
1. **V8** (Used in Chrome, Node.js, Edge)

```text
   at functionName (/path/to/file.js:10:15)
```

2. **SpiderMonkey** (Used in Firefox)

```ts
   functionName@/path/to/file.js:10:15
```

3. **JavaScriptCore** (Used in Safari, WebKit)
```text
   functionName@/path/to/file.js:10:15
```

The parser automatically detects the engine type from the stack format using the `detectJSEngine` function.
## Stack Frame Properties
Here's a detailed look at the properties available in each parsed stack frame:

| Property | Type | Description |
| --- | --- | --- |
| `source` | string | The original line from the stack trace |
| `fileName` | string | The normalized file path |
| `line` | number | The line number in the source file |
| `column` | number | The column number in the source file |
| `functionName` | string | The name of the function where the error occurred |
| `eval` | boolean | Whether the code was running in an eval context |
| `native` | boolean | Whether the code is from native browser/Node.js code |
| `async` | boolean | Whether the function is async |
| `constructor` | boolean | Whether the function is a constructor |
| `evalOrigin` | object | Contains information about the eval origin (if applicable) |

The `evalOrigin` object (present when `eval` is true) includes:
- `fileName`: The file where the eval was called
- `line`: The line number where the eval was called 
- `column`: The column number where the eval was called 
- `functionName`: The function that called eval

## Engine-Specific Parsing
Each JavaScript engine has a slightly different stack trace format. 
The parser handles these differences transparently, but you can also use the engine-specific parsing functions directly:

```ts
import { 
  parseV8StackLine,
  parseSpiderMonkeyStackLine,
  parseJavaScriptCoreStackLine,
  detectJSEngine,
  JSEngines
} from '@remotex-labs/xmap/parser.component';

const stackLine = "at functionName (/path/to/file.js:10:15)";
const engine = detectJSEngine(stackLine);

let frame;
if (engine === JSEngines.V8) {
  frame = parseV8StackLine(stackLine);
} else if (engine === JSEngines.SPIDERMONKEY) {
  frame = parseSpiderMonkeyStackLine(stackLine);
} else if (engine === JSEngines.JAVASCRIPT_CORE) {
  frame = parseJavaScriptCoreStackLine(stackLine);
}
```

## Advanced Usage
### Handling Eval Frames
The parser has special handling for code executed within `eval()`:

```ts
try {
  eval("throw new Error('Error in eval')");
} catch (error) {
  const parsedStack = parseErrorStack(error);
  
  // Check if the top frame is from eval
  if (parsedStack.stack[0].eval) {
    console.log("Error occurred in eval code");
    console.log("Eval was called from:", parsedStack.stack[0].evalOrigin?.fileName);
    console.log("At line:", parsedStack.stack[0].evalOrigin?.line);
  }
}
```

### Path Normalization
File paths in stack traces are normalized to use consistent separators and handle file URLs:

```ts
import { normalizePath } from '@remotex-labs/xmap/parser.component';

// Windows file URL to standard path
const path1 = normalizePath('file:///C:/Users/dev/app.js');
console.log(path1); // "C:/Users/dev/app.js"

// Unix file URL to standard path
const path2 = normalizePath('file:///var/www/app.js');
console.log(path2); // "/var/www/app.js"

// Convert Windows backslashes to forward slashes
const path3 = normalizePath('C:\\Users\\dev\\app.js');
console.log(path3); // "C:/Users/dev/app.js"
```

## Integration with Other xMap Features
The stack trace parser works seamlessly with other xMap features:

### With Source Maps
```ts
try {
    // Code that throws an error
    throw new Error('Something went wrong');
} catch (error: any) {
    // Parse the error stack
    const parsedStack = parseErrorStack(error);

    // Assuming you have a source service with source maps loaded
    const sourceService = new SourceService(sourceMapJSON);

    // For each stack frame, find the original source position
    const mappedStack = parsedStack.stack.map(frame => {
        if (frame.fileName && frame.line && frame.column) {
            const originalPosition = sourceService.getPositionWithCode(frame.line, frame.column);

            if (originalPosition) {
                return {
                    code: originalPosition.code,
                    originalLine: originalPosition.line,
                    originalColumn: originalPosition.column,
                    originalFileName: originalPosition.source
                };
            }
        }

        return frame;
    });

    console.log('Mapped stack:', mappedStack);
}
```

### With Code Formatting and Highlighting
```ts
try {
    // Code that throws an error
    throw new Error('Something went wrong');
} catch (error: any) {
    // Parse the error stack
    const parsedStack = parseErrorStack(error);

    // Get the top frame
    const topFrame = parsedStack.stack[0];

    if (topFrame.fileName && topFrame.line && topFrame.column) {
        // Get the source code from the file
        const sourceService = new SourceService(sourceMapJSON);
        const positionWithCode = sourceService.getPositionWithCode(
            topFrame.line,
            topFrame.column
        );

        if (positionWithCode) {
            // Highlight the code
            positionWithCode.code = highlightCode(positionWithCode.code);

            // Format with error indicator
            const formattedCode = formatErrorCode(positionWithCode);
            console.log(formattedCode);
        }
    }
}
```
