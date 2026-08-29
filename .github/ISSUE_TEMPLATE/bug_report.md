---
name: 🐞 Bug Report
title: 🐞 Bug Report
about: Something is broken
labels: [ "bug", "needs triage" ]
---

**Describe the bug**

A clear and concise description of what is wrong.

**Reproduction**

A minimal snippet that triggers the problem, plus the source map or stack trace it runs against.

```ts
import { SourceService } from '@remotex-labs/xmap';

const source = new SourceService(sourceMapJSON, 'bundle.js');
console.log(source.getPosition(12, 34));
```

**Expected behavior**

What you expected to happen.

**Actual behavior**

What actually happened. Include the full error message and stack trace if there is one.

```text
Error: ...
    at ...
```

**Environment**

|                              | |
|------------------------------|-|
| `@remotex-labs/xmap` version | |
| Node.js version              | |
| TypeScript version           | |
| OS                           | |

**Checklist**

- [ ] I have searched for existing issues, and this is not a duplicate.
- [ ] I am using the latest published version.
- [ ] I have included a minimal reproduction above.
