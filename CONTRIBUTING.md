# Contributing to xMap

Thanks for your interest in contributing.
Bug reports, fixes, features, and documentation improvements are all welcome.
This guide explains how to set up the project and get a change merged.

## Code of conduct

By participating you agree to follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be respectful and constructive in issues, pull requests, and reviews.

## Ways to contribute

- **Report a bug**: open a [bug report](https://github.com/remotex-labs/xMap/issues/new?template=bug_report.md) with a minimal reproduction.
- **Request a feature**: open a [feature request](https://github.com/remotex-labs/xMap/issues/new?template=feature_request.md) describing the use case.
- **Send a pull request**: fix a bug, add a feature, or improve the docs.

Search [existing issues](https://github.com/remotex-labs/xMap/issues) first to avoid duplicates.

## Development setup

xMap uses [pnpm](https://pnpm.io) and requires Node.js 20 or later; CI runs the test suite on 22 and 24.

```bash
git clone https://github.com/remotex-labs/xMap.git
cd xMap
pnpm install
```

### Scripts

| Command              | Description                                              |
|----------------------|----------------------------------------------------------|
| `pnpm build`         | Build the project to `dist/`.                            |
| `pnpm dev`           | Build in watch mode.                                     |
| `pnpm test`          | Run the test suite (xJet).                               |
| `pnpm test:coverage` | Run tests with coverage.                                 |
| `pnpm lint`          | Run markdownlint, ESLint, and the TypeScript type check. |
| `pnpm build:clean`   | Remove `dist/` and rebuild from scratch.                 |
| `pnpm docs:dev`      | Serve the VitePress docs locally.                        |
| `pnpm docs:build`    | Build the docs.                                          |

Run `pnpm lint`, `pnpm test`, and `pnpm build` before opening a pull request. CI runs these as separate jobs.

## Workflow

1. Fork the repository and create a branch from `master`. Never commit directly to `master`.

   ```bash
   git checkout -b bugfix/parser-null-sources
   ```

   | Prefix      | Use for                               |
   |-------------|---------------------------------------|
   | `docs/`     | Documentation only                    |
   | `test/`     | Test-only changes                     |
   | `chore/`    | Build, CI, tooling                    |
   | `bugfix/`   | Bug fixes                             |
   | `feature/`  | New features                          |
   | `refactor/` | Code changes with no behaviour change |

2. Make your change, with tests and documentation.
3. Verify everything passes:

   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

4. Push your branch and open a pull request against `master`. Fill in the pull request template.

Keep pull requests small and focused; they are easier to review and merge.

## Commit messages

Follow the existing history: a lowercase area prefix, a colon, then a summary.
The prefix is the filename without its extension, or a general area (`docs`, `chore`, `test`, `ci`).

```text
parser.component: handle empty sources array without throwing
source.service: fix off-by-one in line position mapping
docs: update SourceService examples in README
```

- Keep the description lowercase, with no period at the end.
- Keep the first line at or under 72 characters.
- Use the body when the reason is not obvious, and reference related issues there (for example, `Closes #123`).

```text
parser.component: handle empty sources array without throwing

Previously threw when the sourcemap had no sources field.
Now returns null position instead.
```

## Coding standards

- Write **TypeScript** with explicit types; avoid `any`.
- Document every exported symbol with **TSDoc**, including an `@since` tag. Keep the tag order consistent with the
  rest of the codebase: description, `@param`, `@returns`, `@throws`, `@remarks`, `@example`, `@see`, `@since`.
- Keep functions small, pure, and testable.
- Match the surrounding style; `pnpm lint` enforces formatting, imports, and the type check.

## Tests

Tests use **xJet**. Place a `*.spec.ts` file next to the code it covers - `base64.component.ts` is covered by
`base64-component.spec.ts` - and assert the observable behavior of the unit.

```ts
import { encodeVLQ } from '@components/base64.component';

describe('encodeVLQ', () => {
    test('encodes zero', () => {
        expect(encodeVLQ(0)).toBe('A');
    });
});
```

Cover edge cases: empty input, malformed source maps that should throw, and the boundaries of each option.

## Documentation

- Update the TSDoc for any public API you change.
- Update the VitePress docs under `docs/src/` when behavior or the API changes.
- Run `pnpm lint:md` to keep Markdown clean, and `pnpm docs:build` to check for broken links.

## Tree-shaking

xMap ships a tree-shakeable ESM build with `sideEffects: false`, and exposes its components as subpath exports.
Keep it that way:

- Use named exports only; no default exports.
- No top-level side effects - no logging, no mutation of globals, no work at import time.
- Add a matching `exports` entry in `package.json` when you introduce a new public component.

```ts
// Do
export { parseErrorStack } from '@components/parser.component';
export type { StackFrameInterface } from '@components/interfaces/parser-component.interface';

// Do not
export default { parseErrorStack, highlightCode };
console.log('parser loaded');
```

## Versioning

xMap follows [Semantic Versioning](https://semver.org/): MAJOR for incompatible API changes, MINOR for backward-compatible features, and PATCH for backward-compatible fixes.

## License

By contributing, you agree that your contributions are licensed under the project's [Mozilla Public License 2.0](LICENSE).
