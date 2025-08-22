# ANSI Component

The **ANSI component** provides essential utilities for terminal control using raw ANSI escape sequences,
enabling low-level manipulation of terminal output for styling, cursor movement, and screen control.

## Imports

You can import the ANSI component in two ways:
```ts
import { writeRaw, ANSI } from '@remotex-labs/xansi/ansi.component';
```

or

```ts
import { writeRaw, ANSI } from '@remotex-labs/xansi';
```

## Output Functions
`writeRaw`

Writes text or ANSI sequences directly to the terminal.

```ts
import { writeRaw } from '@remotex-labs/xansi';

// Simple text output
writeRaw('Hello, world!');

// Styled output using xterm
import { xterm } from '@remotex-labs/xansi';
writeRaw(xterm.bold.green('Success!'));

// Multiline content
writeRaw(`First line
Second line`);
```

Behavior:
- Uses process.stdout.write in Node.js for efficient output.
- Falls back to console.log in other environments.

## Cursor Movement
`moveCursor`

Generates an ANSI escape sequence to move the cursor to a specific position (1-based row/column).

```ts
import { moveCursor, writeRaw } from '@remotex-labs/xansi';

// Move cursor to row 5, column 10
writeRaw(moveCursor(5, 10));
writeRaw('Text at specific position');

// Move cursor to beginning of line 3
writeRaw(moveCursor(3, 1));
writeRaw('Line 3 content');
```

::: tip
The `moveCursor` function generates ANSI sequences to position the cursor at specific coordinates in the terminal. 
Both row and column use 1-based indexing (1 is the first row/column).
:::

## Terminal Control Constants
The `ANSI` object provides common control sequences:
```ts
import { ANSI, writeRaw } from '@remotex-labs/xansi';

// Clear the current line
writeRaw(ANSI.CLEAR_LINE);

// Hide and show cursor (useful for animations)
writeRaw(ANSI.HIDE_CURSOR);
// ... perform operations ...
writeRaw(ANSI.SHOW_CURSOR);

// Save and restore cursor position
writeRaw(ANSI.SAVE_CURSOR);
// ... move cursor and write content ...
writeRaw(ANSI.RESTORE_CURSOR);

// Clear the entire screen
writeRaw(ANSI.CLEAR_SCREEN);

// Clear screen from cursor down
writeRaw(ANSI.CLEAR_SCREEN_DOWN);

// Reset terminal to initial state (RIS)
writeRaw(ANSI.RESET_TERMINAL);
```

Description of Key Constants:
* CLEAR_LINE – Clears from cursor to end of line.
* HIDE_CURSOR / SHOW_CURSOR – Hide or show the terminal cursor.
* SAVE_CURSOR / RESTORE_CURSOR – Save and restore the cursor position.
* CLEAR_SCREEN – Clears the whole screen and moves cursor home.
* CLEAR_SCREEN_DOWN – Clears from cursor to the bottom of the screen.
* RESET_TERMINAL – Hard reset of terminal (clears screen, scrollback, settings).
