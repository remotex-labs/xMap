# Release Notes

What changed in each release of `@remotex-labs/xmap`.

## v6.0.0

Every line and column a position carries is now 1-based, and a position reports the generated location you
looked up rather than the segment that answered.

```ts
import { SourceService, Bias } from '@remotex-labs/xmap';
import { formatCode } from '@remotex-labs/xmap/formatter.component';

// a stack frame column rarely lands exactly on a mapped segment, so reach past the default bias
const position = source.getPosition(1, 3770, Bias.LOWER_BOUND);
position.generatedColumn; // 3770 - the column you looked up
position.startLine;       // 1-based, counted the same way as `line`

// and formatCode/formatErrorCode take it as-is
formatCode(position.code, { startLine: position.startLine });
```

- **Changed**: Stack frames survive a column the map does not hold. `stackEntry` returned `undefined` whenever
  `getPositionWithCode` found nothing, dropping the frame entirely - its `format` line included - so
  `resolveError` silently lost frames. The frame now comes back with its `format` line and without `code`.
  See [stackEntry](services/resolve#stackentry).
- **Changed**: `getPosition` reports the generated position you looked up. `generatedLine` and `generatedColumn`
  now echo the arguments rather than describing the segment that answered the lookup, so they line up with the
  column an engine reports in a stack frame. `getPositionByOriginal` is unaffected - there the generated position
  is the answer. See [Retrieving Position Information](services/source#retrieving-position-information).
- **Changed**: `Bias.BOUND` answers within one column of the column you asked for. It matched the exact column
  only, and a reported column commonly sits a column away from the one the bundler emitted the segment at, so a
  position that was in fact mapped came back as unmapped. `getSegment` - and `getPosition`, `getPositionWithCode`
  and `resolveError` through it - now returns the segment at `column`, `column - 1` or `column + 1`, preferring
  the lower one when both neighbours are a column away, and still `null` for anything further. A one-sided bias
  is unaffected, and `getOriginalSegment` is unchanged: `BOUND` stays exact there.
  See [Bias](services/source#bias).
- **Changed**: `startLine` and `endLine` on `PositionWithCodeInterface` are 1-based. They were 0-based indices
  sitting beside a 1-based `line`, and they are now the numbers of the first and last line held in `code`, so
  `line - startLine` is the error's offset within it. `stratLine` on a formatted stack frame carries `startLine`
  straight through, so it shifts by one as well.
  See [Working with Code Snippets](services/source#working-with-code-snippets).
- **Changed**: `formatCode` and `formatErrorCode` take a 1-based `startLine`, matching what `getPositionWithCode`
  returns. `formatCode` previously treated it as a 0-based offset and numbered its first line `startLine + 1`. It
  now numbers it `startLine`, and the default rose from `0` to `1` so the rendered output is unchanged when the
  option is omitted. See [formatCode](components/formatter#formatcode).
- **Fixed**: `resolveError` no longer returns an empty stack for a map without `sourcesContent`. `stackEntry`
  treated a failed snippet lookup as a reason to drop the frame, so a map that carried no content - which many
  bundlers emit - lost every frame, `format` line included. Enrichment failure now falls back to the plain
  formatted entry. See [stackEntry](services/resolve#stackentry).
- **Fixed**: `SourceService.assign` keeps `sourcesContent` aligned with `sources`. A merged map whose earlier
  input omitted its content used to shift every later map's content onto the wrong file, so code frames showed a
  different file's source. Content is now padded to each input's `sources` length.
- **Fixed**: `formatErrorCode` no longer truncates the marked line at the first `|`. A line containing `||`, a
  bitwise `|`, or a union type lost everything after it. It also now rejects a `line` past the end of the snippet
  instead of rendering a frame with no caret. See [formatErrorCode](components/formatter#formaterrorcode).
- **Fixed**: A custom `highlightCode` scheme no longer leaks into later calls. The overrides were merged into the
  shared default scheme, so one call with a custom color changed every call after it, process-wide.
  See [Highlighter](components/highlighter).
- **Fixed**: A segment's `generatedLine` matches the line it answers at. Decoding a structured array copied the
  incoming value through instead of renumbering it, so after `assign` a forward lookup and `getPositionByOriginal`
  disagreed about the generated line of the same segment.
- **Fixed**: A malformed segment fails instead of silently corrupting the map. An empty segment between two
  separators left the column accumulator `NaN`, which broke the binary search for the whole line and re-encoded to
  a different map. It now throws. VLQ values outside the range the 32-bit chunking can carry throw as well, in
  both directions: `encodeVLQ` rejects a magnitude above `2^30 - 1` instead of wrapping it to a different number,
  and `decodeVLQ` rejects an over-long sequence instead of wrapping the shift count.
- **Fixed**: An empty `mappings` string is accepted. It is what a valid v3 map carries when it maps nothing, and
  it used to be rejected as "contains characters outside the VLQ alphabet".
- **Fixed**: Stack-frame flags are no longer set by the file path. `constructor` and `async` came from scanning
  the whole line for `new` and `async`, so `renewSession` or a frame under `node_modules/newrelic` tripped them.
  V8 frames now match the `at new` and `at async` markers V8 actually writes, and the other engines only inspect
  the function name.
- **Fixed**: `formatStackLine` no longer emits `#Lundefined` for an `http(s)` frame with no line number, and a
  local file named `httpClient.ts` is no longer treated as a remote URL.
- **Migration**: A resolver that relied on the default bias to enrich stack frames should pass
  `Bias.LOWER_BOUND` explicitly. `Bias.BOUND` reaches one column either way and no further, so a frame whose
  column sits further than that from any mapping still comes back without `code`.
- **Migration**: Drop any `+ 1` applied to `startLine`/`endLine` when displaying them, and drop any `- 1` applied
  before handing `startLine` to `formatCode`. A `startLine` passed to `formatCode` as a literal needs `+ 1` to
  render the same numbers as before. `stratLine` on a resolved stack frame moves with them.
- **Migration**: Code that treated a missing `stackEntry` result as "this frame has no mapping" will now see those
  frames come back resolved. Nothing needs changing to get the frames, so drop any workaround that re-added them
  by hand.
- **Migration**: Code reading `generatedColumn` to find where the matching segment sits should read it from
  `mappings.getSegment` directly.

## Earlier releases

Documentation for previous versions stays available in the archive:

- [v5.1.x](/v5.1.x/release) - `lineOffset` and `sourceRoot` on resolved frames, and `ErrorCodeType`.
- [v5.0.x](/v5.0.x/guide) - the mapping rewrite, `resolve.service`, and `path.component`.
- [v4.0.x](/v4.0.x/release) - stack parser fixes and `getStackWithoutMessage`.

## See also

- [Getting Started](guide)
- [Source Service](services/source)
- [Resolve Service](services/resolve)
