---
outline: deep
---

# Guide

`xMap` is a TypeScript library for working with source maps, stack trace parsing, and code formatting.
It provides utilities for turning generated runtime locations (stack frames) into readable, CLI-friendly error reports.

## Installation

::: code-group

```bash [npm]
npm install @remotex-labs/xmap
```

```bash [yarn]
yarn add @remotex-labs/xmap
```

```bash [pnpm]
pnpm add @remotex-labs/xmap
```

:::

## Quick Start

A common workflow is: parse an error stack, map a generated location back to original code using a source map, then render a readable code frame.

```ts
import { readFileSync } from 'fs';
import { SourceService, Bias } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';

try {
    throw new Error('Example error');
} catch (error) {
    const parsed = parseErrorStack(error as Error);
    const frame = parsed.stack[0];

    // Provide your Source Map v3 JSON (string or object).
    const sourceMapJSON = readFileSync(`${ frame.fileName }.map`, 'utf8');

    // Construct the SourceService. You can also pass an explicit file path override.
    const source = new SourceService(sourceMapJSON, frame.fileName);// [!code focus]

    // Query with optional code context.
    const pos = source.getPositionWithCode(frame.line ?? 0, frame.column ?? 0, Bias.LOWER_BOUND, { // [!code focus]
        linesBefore: 2, // [!code focus]
        linesAfter: 2 // [!code focus]
    });// [!code focus]

    if (pos) {
        console.log(formatErrorCode(pos));
    }
}
```

## Key Concepts

### SourceService

`SourceService` loads a Source Map v3 payload and lets you query positions:

- `getPositionByGenerated(line, column, bias?)`
- `getPositionByOriginal(line, column, sourceFile, bias?)`
- `getPositionWithCode(line, column, bias?, { linesBefore, linesAfter, ... }?)`

See: `/sourceService`

### Bias

When an exact mapping is not found, `Bias` controls how lookups behave:

- `Bias.BOUND`: closest match
- `Bias.LOWER_BOUND`: segment column less than or equal to the target
- `Bias.UPPER_BOUND`: segment column greater than or equal to the target

## Components

### Stack Trace Parser

Parse stacks from V8, SpiderMonkey, and JavaScriptCore into a normalized structure:

```ts
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

const parsed = parseErrorStack(new Error('Boom'));
console.log(parsed.name);
console.log(parsed.message);
console.log(parsed.stack[0]);
```

See: `/parse`

### Formatter

Format code snippets (line numbers, padding, custom actions) and render error code frames:

```ts
import { formatCode } from '@remotex-labs/xmap/formatter.component';

const formatted = formatCode('console.log("hi")\n', { startLine: 1, padding: 4 });
console.log(formatted);
```

See: `/formatter`

### Highlighter

Apply semantic TypeScript highlighting for terminal output:

```ts
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';

console.log(highlightCode('const x: number = 123\n'));
```

See: `/highlighter`

## Optimizing Bundle Size

xMap supports subpath imports so you can pull in only what you use:

```ts
import { SourceService } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';
```

## Need Help?

- Discord: <https://discord.gg/psV9grS9th>
- Issues: <https://github.com/remotex-labs/xMap/issues>
- npm: <https://www.npmjs.com/package/@remotex-labs/xmap>
