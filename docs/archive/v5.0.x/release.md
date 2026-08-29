# Release Notes

What shipped in the `v5.0.x` line of `@remotex-labs/xmap`.

::: warning 🗄️ Archived version
These are the notes for an archived version. See the [current release notes](/release) for the supported line.
:::

## v5.0.0

A rewrite of the mapping internals, plus three new public modules: path helpers, source-map segments, and
stack-frame resolution.

```ts
import { SourceService, Bias, resolveError } from '@remotex-labs/xmap';
```

- **Added**: [`resolve.service`](services/resolve): `resolveError`, `stackEntry`, `stackSourceEntry`, and
  `formatStackLine` map a parsed stack back to original sources and render it as terminal-ready text.
- **Added**: [`path.component`](components/path#api): POSIX-normalizing `toPosix`, `normalize`, `join`, `resolve`,
  `dirname`, `relative`, and `basename`.
- **Added**: `segment.component`: segment encoding and decoding, and the `Bias` enum used by every lookup. See
  [Bias](services/source#bias).
- **Added**: [`SourceService.assign`](services/source#merging-source-maps) concatenates several maps into one service
  while keeping name and source indices correct.
- **Changed**: `Bias` moved from `source.service` to `segment.component`. It is still re-exported from the package root,
  so `import { Bias } from '@remotex-labs/xmap'` keeps working. See [Bias](services/source#bias).
- **Changed**: The internal `mapping.provider` was replaced by a `mapping.service`. `SourceService` is the supported
  entry point for querying a map. See [API Reference](services/source#api-reference).
- **Changed**: Path handling across the library returns POSIX-style paths on every platform.

## Earlier releases

- [v4.0.x](/v4.0.x/release) - stack parser fixes and `getStackWithoutMessage` (archived docs).

## See also

- [Getting Started](guide)
- [Source Service](services/source)
- [Resolve Service](services/resolve)
