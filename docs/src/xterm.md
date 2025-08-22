# xTerm

The `xterm` component provides advanced terminal styling capabilities with a **chainable API** for applying colors, text styles, and backgrounds. It supports standard ANSI colors, RGB, and hexadecimal color codes, and allows combination of multiple styles in a type-safe manner.

::: warning :rocket: NO_COLOR
Environment variable flag that indicates if color output should be disabled.\
@see https://no-color.org/ - The NO_COLOR standard specification
:::

## Imports
You can import the ANSI component in two ways:
```ts
import { xterm } from '@remotex-labs/xansi/xterm.component';
```

or

```ts
import { xterm } from '@remotex-labs/xansi';
```

## Basic Usage

```ts
import { xterm } from '@remotex-labs/xansi';

// Simple color styling
console.log(xterm.red('This text is red'));
console.log(xterm.blue('This text is blue'));

// Chaining multiple styles
console.log(xterm.bold.yellow('Bold yellow text'));
console.log(xterm.green.bgBlack.inverse('Styled text'));

// Using template literals
const name = 'world';
console.log(xterm.cyan`Hello ${name}!`);

// Using printf-style placeholders
console.log(xterm.yellow('Hello %s'), name);
```

## RGB and Hex Colors
`xterm` supports 24-bit RGB colors and hexadecimal color codes for foreground and background styling.

```ts
// RGB colors
console.log(xterm.rgb(255, 100, 50)('Custom RGB colored text'));
console.log(xterm.bgRgb(30, 60, 90)('Text with RGB background'));

// Hex colors
console.log(xterm.hex('#ff5733')('Hex colored text'));
console.log(xterm.bgHex('#3498db')('Text with hex background'));

// Combining RGB/Hex with other styles
console.log(xterm.hex('#ff5733').bold.bgHex('#3498db')('Custom styled text'));
```

## Style Combinations

`xterm` enforces proper style usage via TypeScript:
* Only one foreground color can be applied.
* Only one background color can be applied.
* Text modifiers (bold, dim, inverse, etc.) can be combined freely.

```ts
// Valid combinations
xterm.red.bold.inverse('Valid styling');
xterm.green.bgBlue.dim('Valid styling');
xterm.rgb(100, 150, 200).bgHex('#333').bold('Valid styling');

// Invalid combinations (TypeScript errors)
// xterm.red.green('Invalid - two foreground colors');
// xterm.bgBlue.bgRed('Invalid - two background colors');
```

## Template Literal Support
xterm can style strings using tagged template literals:

```ts
const name = 'Alice';
console.log(xterm.magenta`Hello ${name}, welcome!`);
```

## Chainable API
All styles and colors can be chained:
```ts
console.log(
    xterm.bold.underline.rgb(120, 200, 150).bgHex('#333')('Chained styling')
);
```
