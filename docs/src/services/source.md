# Source-service

A TypeScript service for validating and processing source maps.
The `SourceService` class provides functionality for parsing and manipulating source maps,
including retrieving position mappings, merging multiple source maps, and extracting code snippets around mapped positions.

```ts
import { SourceService, Bias } from '@remotex-labs/xmap';

// Create a SourceService instance from a source map
const sourceService = new SourceService(sourceMapJSON);

// Find a position in the original source
const position = sourceService.getPosition(10, 15);

// Get code snippets with context
const snippet = sourceService.getPositionWithCode(10, 15, Bias.BOUND, {
  linesBefore: 3,
  linesAfter: 3
});
```

## SourceService Instance

You can create a instance using various input formats: `SourceService`

### From a JSON String

```ts
import { SourceService } from '@remotex-labs/xmap';

const sourceMapJSON = `{
  "version": 3,
  "sources": ["file.ts"],
  "names": [],
  "mappings": "AAAA",
  "file": "bundle.js"
}`;

const sourceService = new SourceService(sourceMapJSON);
```

### From a Source Map Object

```ts
import { SourceService } from '@remotex-labs/xmap';

const sourceMapObj = {
  version: 3,
  sources: ["file.ts"],
  names: [],
  mappings: "AAAA",
  file: "bundle.js"
};

const sourceService = new SourceService(sourceMapObj);
```

### Copying from Another SourceService

```ts
// Copy by re-hydrating from the serialized source map payload
const copyA = new SourceService(existingSourceService.getSourceObject());

// or from JSON
const copyB = new SourceService(existingSourceService.toString());
```

## Retrieving Position Information

### From Generated Code

To find the original source location for a position in generated code:

```ts
// getPosition(generatedLine, generatedColumn, bias)
const position = sourceService.getPosition(5, 10);

if (position) {
  console.log(`Original source: ${position.source}`);
  console.log(`Line: ${position.line}, Column: ${position.column}`);
  console.log(`Symbol name: ${position.name}`);
}
```

::: warning info
:rocket: Support Bias [Go to Bias](#bias)
:::

### From Original Source

To find the generated code location for a position in the original source:

```ts
// getPositionByOriginal(originalLine, originalColumn, sourceIndex, bias)
const position = sourceService.getPositionByOriginal(3, 15, 'file.ts');

if (position) {
  console.log(`Generated line: ${position.generatedLine}`);
  console.log(`Generated column: ${position.generatedColumn}`);
}
```

## Working with Code Snippets

The `getPositionWithCode` and `getPositionWithContent` methods allow you to retrieve not just position information
but also the associated source code:

```ts
// Get position with content
const posWithContent = sourceService.getPositionWithContent(3, 10);
if (posWithContent) {
  console.log(`Source content: ${posWithContent.sourcesContent}`);
}

// Get position with code snippet (with context)
const posWithCode = sourceService.getPositionWithCode(3, 10, Bias.BOUND, {
  linesBefore: 2,  // Show 2 lines before the target line
  linesAfter: 3    // Show 3 lines after the target line
});

if (posWithCode) {
  console.log(`Code snippet: 
${posWithCode.code}`);
  // Note: startLine/endLine are 0-based indices into the original source content.
  console.log(`From line ${posWithCode.startLine + 1} to ${posWithCode.endLine + 1}`);
}
```

## Source Map Manipulation

### Merging Source Maps

You can merge multiple `SourceService` instances using `SourceService.assign(...)`.

```ts
import { SourceService } from '@remotex-labs/xmap';

const merged = SourceService.assign(mapA, mapB, mapC);

// assign() returns a new service; if you need to force a specific generated file path:
const mergedWithFile = new SourceService(merged.getSourceObject(), 'dist/bundle.js');
```

### Converting to JSON

```ts
// Get the source map as a plain object
const mapObject = sourceService.getSourceObject();

// Get the source map as a JSON string
const jsonString = sourceService.toString();
```

## API Reference

### Constructor

```ts
constructor();
constructor(source: SourceMapInterface | string, offset?: number);
constructor(source: SourceMapInterface | string, file?: string, offset?: number);
```

- `source`: The source map data (a `SourceMapInterface` object or a JSON string)
- `file`: Optional generated file path override (required when the payload does not include `file`)
- `offset`: Optional generated line offset applied during mapping decode

### Properties

- `file`: The name of the generated file this source map applies to
- `mappings`: Provider for accessing and manipulating the base64 VLQ-encoded mappings
- `sourceRoot`: The root URL for resolving relative paths in the source files
- `names`: List of symbol names referenced by the mappings
- `sources`: Array of source file paths
- `sourcesContent`: Array of source file contents

### Methods

#### Position Mapping

- `getPosition(line: number, column: number, bias?: Bias): PositionInterface | null`
- `getPositionByOriginal(line: number, column: number, sourceIndex: number | string, bias?: Bias): PositionInterface | null`
- `getPositionWithContent(line: number, column: number, bias?: Bias): PositionWithContentInterface | null`
- `getPositionWithCode(line: number, column: number, bias?: Bias, options?: SourceOptionsInterface): PositionWithCodeInterface | null`

#### Map Manipulation

- `getSourceObject(): SourceMapInterface`
- `SourceService.assign(...sources: Array<SourceService>): SourceService`
- `toString(): string`

## Bias

When using the `SourceService` class to query source maps, you'll encounter the `Bias`
enum which plays a crucial role in determining how positions are matched
when an exact position isn't found in the mapping data.

### What is Bias

The `Bias` enum is a parameter used in methods like `getPosition()`, `getPositionByOriginal()`, and `getPositionWithCode()`
to control the matching behavior when an exact position match isn't available in the source map.

```ts
enum Bias {
    BOUND,
    LOWER_BOUND,
    UPPER_BOUND
}

```

### `Bias.BOUND`

`Bias.BOUND` is the default. It returns a result only on an exact match for the requested column.

```ts
// Using default bias (BOUND)
const position = sourceService.getPosition(10, 15);

// Explicitly specifying BOUND (same behavior as above)
const position = sourceService.getPosition(10, 15, Bias.BOUND);
```

### `Bias.LOWER_BOUND`

`Bias.LOWER_BOUND` prefers segments with positions that come before or exactly at the specified position:

- When an exact match is not found, it will return the mapping for the closest position that is less than or equal to the target
- This is useful when you want to find "where this code came from" in cases where every character isn't mapped
- It's like saying "show me the nearest mapping that's at or before this position"

```ts
// Prefer positions that come before the target position
const position = sourceService.getPosition(10, 15, Bias.LOWER_BOUND);
```

### `Bias.UPPER_BOUND`

`Bias.UPPER_BOUND` prefers segments with positions that come after or exactly at the specified position:

- When an exact match is not found, it will return the mapping for the closest position that is greater than or equal to the target
- This is useful when you want to find "what generated code corresponds to this original code" in sparse mappings
- It's like saying "show me the nearest mapping that's at or after this position"

```ts
// Prefer positions that come after the target position
const position = sourceService.getPosition(10, 15, Bias.UPPER_BOUND);
```

### When to Use Different Bias Values

- **Use (default) `Bias.BOUND`** when you need an exact mapping at the requested column (returns `null` otherwise)
- **Use `Bias.LOWER_BOUND`** when debugging minified code and want to find what original source code generated a particular point in the output
- **Use `Bias.UPPER_BOUND`** when you want to make sure you capture the mapping for code that might appear slightly after your target position

### Practical Example

Consider a scenario where you're trying to find the source of an error in minified code:

```ts
// The error is reported at line 1, column 104
const errorPosition = sourceService.getPositionWithCode(1, 104, Bias.LOWER_BOUND, {
  linesBefore: 2,
  linesAfter: 2
});

// Using LOWER_BOUND will find the mapping that generated this code,
// even if the exact character position isn't mapped
```

In this case, using `Bias.LOWER_BOUND` ensures you get the mapping for the code segment that most likely contains the error,
even if the exact character position isn't mapped in the source map.

### Visual Representation

Think of it like this:

```text
Original source:   function example() { throw new Error(); }
                   ^                   ^
                   |                   |
Generated code:    function e(){throw Error()}
                   ^           ^
                   |           |
                   
Positions:         1           2
```

- If you query for a position between 1 and 2:
  - : Will return `null` if there is no exact match `Bias.BOUND`
  - : Will return position 1 `Bias.LOWER_BOUND`
  - : Will return position 2 `Bias.UPPER_BOUND`

## Examples

### Finding Error Locations

```ts
import { SourceService, Bias } from '@remotex-labs/xmap';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

// Create a SourceService from your source map
const sourceService = new SourceService(sourceMapJSON);

// Find the original source location for an error in generated code
const errorPos = sourceService.getPositionWithCode(errorLine, errorColumn, Bias.BOUND, {
  linesBefore: 3,
  linesAfter: 3
});

if (errorPos) {
  // Highlight the code
  errorPos.code = highlightCode(errorPos.code);
  
  // Format and display the error location
  console.log(formatErrorCode(errorPos, {
    color: (text) => `\x1b[38;5;160m${ text }\x1b[0m`
  }));
}
```

### Working with Multiple Source Maps

```ts
import { SourceService } from '@remotex-labs/xmap';

// Create individual source maps for different parts of your application
const mainSourceService = new SourceService(mainSourceMap);
const moduleSourceService = new SourceService(moduleSourceMap);

// Combine them into a single source map
const combinedService = SourceService.assign(mainSourceService, moduleSourceService);

// Use the combined source map for debugging
const position = combinedService.getPosition(errorLine, errorColumn);
```

### Extracting Code Snippets

```ts
import { SourceService, Bias } from '@remotex-labs/xmap';
import { formatCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

const sourceService = new SourceService(sourceMapJSON);

// Get code snippet around a specific position
const snippet = sourceService.getPositionWithCode(10, 15, Bias.BOUND, {
  linesBefore: 5,
  linesAfter: 5
});

if (snippet) {
  // Highlight the code
  const highlightedCode = highlightCode(snippet.code);
  
  // Format with line numbers
  const formattedCode = formatCode(highlightedCode, {
    padding: 4,
    startLine: snippet.startLine
  });
  
  console.log(formattedCode);
}
```
