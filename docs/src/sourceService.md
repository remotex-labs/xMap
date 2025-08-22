# Source-service

A TypeScript service for validating and processing source maps.
The `SourceService` class provides functionality for parsing and manipulating source maps, 
including retrieving position mappings, concatenating source maps, and getting code snippets based on mappings.

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
const newSourceService = new SourceService(existingSourceService);
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
The and `getPositionWithCode` and `getPositionWithContent` methods allow you to retrieve not just position information 
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
  console.log(`From line ${posWithCode.startLine} to ${posWithCode.endLine}`);
}
```

## Source Map Manipulation
### Concatenating Source Maps
You can combine multiple source maps using the method: `concat`

```ts
// Concat in-place (modifies the current instance)
sourceService.concat(anotherSourceMap);

// Create a new instance with concatenated maps
const combinedService = sourceService.concatNewMap(map1, map2, map3);
```

### Converting to JSON
```ts
// Get the source map as a plain object
const mapObject = sourceService.getMapObject();

// Get the source map as a JSON string
const jsonString = sourceService.toString();
```
## API Reference
### Constructor

```ts
constructor(source: SourceService | SourceMapInterface | string, file?: string | null)
```

- `source`: The source map data (another SourceService, a SourceMapInterface object, or a JSON string)
- `file`: Optional file name for the generated bundle

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
- `getMapObject(): SourceMapInterface`
- `concat(...maps: Array<SourceMapInterface | SourceService>): void`
- `concatNewMap(...maps: Array<SourceMapInterface | SourceService>): SourceService`
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

`Bias.BOUND` is the default option when no bias is specified. It has no directional preference, meaning: `Bias.BOUND`
- When searching for a mapping and there's no exact match at the specified position
- The first suitable match that's found will be returned, regardless of whether it's before or after the target position
- This is a good general-purpose option when you have no specific preference

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
- **Use (default)`Bias.BOUND`** when you have no specific preference and just want any relevant match
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

n this case, using `Bias.LOWER_BOUND` ensures you get the mapping for the code segment that most likely contains the error, 
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
    - : Could return either position 1 or 2 `Bias.BOUND`
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
    color: '\x1b[38;5;160m',  // Red color for error marker
    reset: '\x1b[0m'          // Reset color
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
const combinedService = mainSourceService.concatNewMap(moduleSourceService);

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
