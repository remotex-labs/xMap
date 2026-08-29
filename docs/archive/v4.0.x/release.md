# Release Notes

What shipped in the `v4.0.x` line of `@remotex-labs/xmap`.

::: warning 🗄️ Archived version
These are the notes for an archived version. See the [current release notes](/release) for the supported line.
:::

## v4.0.5

- **Fixed**: SpiderMonkey stack lines with unusual group shapes are parsed instead of being skipped. See [Supported
  JavaScript Engines](components/parse#supported-javascript-engines).

## v4.0.4

- **Fixed**: `async` frames with no function name are recognized by the V8 pattern. See [Engine-Specific
  Parsing](components/parse#engine-specific-parsing).

## v4.0.3

- **Fixed**: Stack lines with empty capture groups no longer produce malformed frames. See [Stack Frame
  Properties](components/parse#stack-frame-properties).

## v4.0.2

- **Fixed**: Corrected the line-slicing logic used when extracting a code window from a source map. See [Working with
  Code Snippets](services/source#working-with-code-snippets).

## v4.0.1

- **Added**: `getStackWithoutMessage` returns the stack body with the leading error message removed, which keeps
  multi-line messages from being parsed as frames. See [parseErrorStack](components/parse#parseerrorstack).

## v4.0.0

The first release built on `@remotex-labs/xansi` for color output.

- **Added**: `Bias` for controlling how inexact positions resolve. See [Bias](services/source#bias).
- **Changed**: The highlighter and formatter take color **functions** rather than escape-code strings, so any
  `@remotex-labs/xansi` style can be passed straight in. See [Highlighter](components/highlighter).
- **Changed**: Node.js 20 is the minimum supported runtime.

## See also

- [Getting Started](guide)
- [Source Service](services/source)
