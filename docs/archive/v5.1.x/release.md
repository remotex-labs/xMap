# Release Notes

What shipped in the `v5.1.x` line of `@remotex-labs/xmap`.

::: warning 🗄️ Archived version
These are the notes for an archived version. See the [current release notes](/release) for the supported line.
:::

## v5.1.0

Stack frames resolved through [`resolve.service`](services/resolve) can now be shifted and traced back to a
source root, and `formatErrorCode` accepts a narrower position type.

```ts
import { resolveError } from '@remotex-labs/xmap';

const metadata = resolveError(parsedStack, { lineOffset: 2, sourceMap });
```

- **Added**: `lineOffset` option on the resolve options, added to every resolved line before a formatted entry is built.
  Useful when the source context comes from a shifted or combined file. See [Options](services/resolve#options).
- **Added**: `sourceRoot` on the formatted stack frame, so an entry can be traced back to the URL its source came from.
  See [Options](services/resolve#options).
- **Added**: `ErrorCodeType`, the compact position type `formatErrorCode` now accepts, exposed from
  [`formatter.component`](components/formatter#formaterrorcode).
- **Changed**: The root entry point no longer re-exports `formatter.component` or `highlighter.component`. Import them
  from their subpaths instead: `@remotex-labs/xmap/formatter.component` and `@remotex-labs/xmap/highlighter.component`.
  See [Getting Started](guide#optimizing-bundle-size).
- **Changed**: Segment interfaces are exported as types from the root entry point. See [Segment](services/source#bias).
- **Changed**: The VLQ decoder uses a lookup table for Base64 characters. Behavior is unchanged.

## Earlier releases

- [v5.0.x](/v5.0.x/release) - stack parser fixes and `getStackWithoutMessage` (archived docs).

## See also

- [Getting Started](guide)
- [Source Service](services/source)
- [Resolve Service](services/resolve)
