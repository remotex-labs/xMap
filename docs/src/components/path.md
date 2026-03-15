# Path

Cross-platform path helpers used by xMap. These utilities normalize common path operations to return POSIX-style paths (forward slashes) to keep outputs stable across Windows/macOS/Linux.

These functions are intended for file paths. Do not pass `http(s)` URLs into them, because `toPosix()` collapses duplicate slashes and will turn `https://...` into `https:/...`.

## API

### toPosix

```ts
declare function toPosix(input: string | null | undefined): string;
```

Converts backslashes to forward slashes and collapses duplicate slashes.

```ts
toPosix('C:\\Users\\Documents\\file.txt'); // 'C:/Users/Documents/file.txt'
toPosix('src//components///Button.tsx');   // 'src/components/Button.tsx'
toPosix(undefined);                        // ''
```

### normalize

```ts
declare function normalize(path: string): string;
```

Normalizes a path to POSIX format and resolves `.` and `..` segments using `path.posix.normalize()`.

```ts
normalize('src/components/../utils/./helper.ts'); // 'src/utils/helper.ts'
normalize('C:\\Users\\..\\Documents\\file.txt');  // 'C:/Documents/file.txt'
```

### join

```ts
declare function join(...paths: Array<string>): string;
```

Joins multiple path segments using `path.posix.join()` after converting each segment with `toPosix()`.

```ts
join('src', 'components', 'Button.tsx');                 // 'src/components/Button.tsx'
join('C:\\Users', 'Documents', '../Pictures/photo.jpg'); // 'C:/Users/Pictures/photo.jpg'
```

### resolve

```ts
declare function resolve(...paths: Array<string>): string;
```

Resolves to an absolute path using Node's `path.resolve(...)`, then converts the result to POSIX format.

```ts
// Example (result depends on process.cwd()):
resolve('src', 'components', 'Button.tsx'); // '/abs/path/.../src/components/Button.tsx'

resolve('/var/www', 'html', 'index.html');  // '/var/www/html/index.html'
```

### dirname

```ts
declare function dirname(p: string): string;
```

Returns the directory name for `p` (POSIX output).

```ts
dirname('/home/user/file.txt');              // '/home/user'
dirname('C:\\Users\\Documents\\file.txt');   // 'C:/Users/Documents'
dirname('file.txt');                         // '.'
dirname('/file.txt');                        // '/'
```

### relative

```ts
declare function relative(from: string, to: string): string;
```

Computes the relative path from `from` to `to` (POSIX output). Returns `'.'` when both paths point to the same location.

```ts
relative('/home/user/project', '/home/user/docs/file.txt'); // '../docs/file.txt'
relative('/home/user', '/home/user');                       // '.'
relative('C:\\Users\\project\\src', 'C:\\Users\\project\\dist\\bundle.js'); // '../dist/bundle.js'
```

### basename

```ts
declare function basename(p: string, suffix?: string): string;
```

Returns the last portion of a path (file name or final directory name). If `suffix` is provided and matches, it is removed.

```ts
basename('/home/user/documents/report.pdf');       // 'report.pdf'
basename('/home/user/documents/report.pdf', '.pdf'); // 'report'
basename('C:\\Users\\Documents\\file.txt');        // 'file.txt'
basename('/home/user/documents/');                 // 'documents'
```
