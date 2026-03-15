# Resolve-service

Utilities for converting a parsed stack trace into formatted, optionally source-enriched stack entries.

The main entry point is `resolveError(parsedStack, options)`, which:

- Formats each frame into a single stack line (`format`)
- Optionally enriches frames with highlighted source context (`code`) when `options.getSource()` can provide a `SourceService`
- Filters native frames unless `options.withNativeFrames` is enabled

## Imports

```ts
import { resolveError, Bias, SourceService } from '@remotex-labs/xmap';

// Stack parsing lives in the parser component:
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
```

You can also import directly:

```ts
import { resolveError } from '@remotex-labs/xmap/resolve.service';
import { SourceService, Bias } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
```

## Quick Start

```ts
import { resolveError, Bias, SourceService } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

try {
  throw new Error('Boom');
} catch (e) {
  const parsed = parseErrorStack(e as Error);

  const resolved = resolveError(parsed, {
    bias: Bias.BOUND,
    withNativeFrames: false
  });

  // Each entry has a pre-formatted stack line.
  for (const entry of resolved.stack) {
    console.log(entry.format);
    if (entry.code) console.log(entry.code);
  }
}
```

## Enriching Frames With Source Context

To get `entry.code` for a frame, `resolveError()` needs a `SourceService` for the frame's `fileName` via `options.getSource`.

```ts
import { resolveError, Bias, SourceService } from '@remotex-labs/xmap';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';

// Example: build a SourceService from a source map payload for your generated bundle.
const bundleMapJson = '{ "version": 3, "file": "dist/bundle.js", "sources": ["src/app.ts"], "names": [], "mappings": "AAAA", "sourcesContent": ["console.log(1)\\n"] }';
const bundleSource = new SourceService(bundleMapJson);

function getSource(fileName: string): SourceService | undefined {
  // Keep this mapping logic consistent with how your stack frames render file paths.
  // For example, you might normalize `fileName` or match by suffix.
  if (fileName.endsWith('dist/bundle.js')) return bundleSource;
  return undefined;
}

try {
  throw new Error('Boom');
} catch (e) {
  const parsed = parseErrorStack(e as Error);
  const resolved = resolveError(parsed, {
    getSource,
    bias: Bias.LOWER_BOUND,
    linesBefore: 3,
    linesAfter: 4
  });

  for (const entry of resolved.stack) {
    console.log(entry.format);
    if (entry.code) console.log(entry.code);
  }
}
```

Notes:

- `stackEntry()` only attempts source enrichment when both `frame.line` and `frame.column` are present.
- Enriched frames use `SourceService.getPositionWithCode(...)` to extract context.
- `linesBefore` defaults to `3` and `linesAfter` defaults to `4` in the resolver implementation.

## Options

`ResolveOptionsInterface`:

| Option             | Type                                                   | Default      | Description                                                                      |
|--------------------|--------------------------------------------------------|--------------|----------------------------------------------------------------------------------|
| `bias`             | `Bias`                                                 | `Bias.BOUND` | Bias used when mapping generated positions to source positions.                  |
| `linesBefore`      | `number`                                               | `3`          | Lines of context to include before the mapped source line.                       |
| `linesAfter`       | `number`                                               | `4`          | Lines of context to include after the mapped source line.                        |
| `withNativeFrames` | `boolean`                                              | `false`      | Include frames where `frame.native === true`.                                    |
| `getSource`        | `(path: string) => SourceService \| null \| undefined` | `undefined`  | Provide a `SourceService` for a frame `fileName` so the resolver can add `code`. |

## API Reference

### resolveError

```ts
resolveError(
  error: ParsedStackTraceInterface,
  options?: ResolveOptionsInterface
): ResolveMetadataInterface
```

Returns:

- `name`: error name
- `message`: error message
- `stack`: formatted frames (`Array<FormatStackFrameInterface>`). Each frame always includes `format` and may include `code` when `getSource` can resolve the frame.

### stackEntry

```ts
stackEntry(
  frame: StackFrameInterface,
  options?: ResolveOptionsInterface
): FormatStackFrameInterface | undefined
```

Behavior:

- Returns `undefined` when the frame is filtered out (for example, native frames when `withNativeFrames` is false).
- Returns a formatted entry without `code` when source enrichment is not possible.

### stackSourceEntry

```ts
stackSourceEntry(
  position: PositionWithCodeInterface,
  frame: StackFrameInterface
): FormatStackFrameInterface
```

Notes:

- This function mutates `frame` (overwriting `line`, `column`, `fileName`, and optionally `functionName`) with resolved source info.

### formatStackLine

```ts
formatStackLine(frame: StackFrameInterface): string
```

Notes:

- When `frame.fileName` is an `http(s)` URL, `#L<line>` is appended.
- The `[line:column]` suffix is only rendered when *both* `line` and `column` are present.
