# ShadowRenderer

`ShadowRenderer` is a virtual terminal renderer for building efficient terminal-based UIs. 
It manages an internal content buffer and a view buffer to minimize redraws, supports scrolling, viewport resizing, and styled text output.

## Features

- Partial screen updates for performance
- Content scrolling
- Adjustable viewport dimensions
- Rich text and ANSI styling support
- Efficient diffing algorithm for minimal redraws

## Performance Considerations

The Shadow Renderer is optimized for scenarios where:

1. You're building interactive terminal UIs with frequent updates
2. You need to manage content larger than the visible viewport
3. You want to avoid screen flicker from complete redraws

The diffing algorithm ensures minimal terminal I/O operations by tracking which cells have changed and only updating those specific positions.

## Imports
You can import the ANSI component in two ways:

```ts
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
```

or 

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';
```

## Creating a Renderer
```ts
// Create a renderer at row 2, column 3 with viewport size 80x24
const renderer = new ShadowRenderer(24, 80, 2, 3);
```

* `terminalHeight` – number of rows in the viewport
* `terminalWidth` – number of columns in the viewport
* `topPosition` – top offset within the terminal
* `leftPosition` – left offset within the terminal

## Writing Text
```ts
renderer.writeText(0, 0, 'Hello World');       // Top-left corner
renderer.writeText(5, 10, 'Menu Options', true); // Clear existing content before writing
renderer.render();                             // Display changes
```

* `row` – 0-based row index in viewport
* `column` – 0-based column index in viewport
* `text` – string to display
* `clean` – optional; clears existing content if true

## Basic Usage

```ts
import { ShadowRenderer, writeRaw, ANSI } from '@remotex-labs/xansi';

const topLeft = new ShadowRenderer(5, 40, 0, 0);
const topRight = new ShadowRenderer(5, 40, 0, 40);
const left = new ShadowRenderer(6, 40, 5, 5);
const right = new ShadowRenderer(6, 40, 5, 45);

writeRaw(ANSI.HIDE_CURSOR);
writeRaw(ANSI.CLEAR_SCREEN);

const letters = 'abcdefghijklmnopqrstuvwxyz';
let topIndex = 0;
let index = 0;

setInterval(() => {
    for (let i = 0; i < 5; i++) {
        const letterIndex = (topIndex + i) % letters.length;
        const letter = letters[letterIndex];
        topLeft.writeText(i, i, letter); // example: row = col = i
        topRight.writeText(i, i, letter); // example: row = col = i
    }

    topLeft.render();
    topRight.render();

    topIndex = (topIndex + 1) % letters.length;
}, 1000); // 1000ms = 1 second

setInterval(() => {
    for (let i = 0; i < 5; i++) {
        // Go backward from index: index, index-1, ..., index-4
        const letterIndex = (index - i + letters.length) % letters.length;
        const letter = letters[letterIndex];
        left.writeText(i, i, letter); // Display diagonally
        right.writeText(i, i, letter); // Display diagonally
    }

    left.render();
    right.render();

    // Move backward in the alphabet
    index = (index - 1 + letters.length) % letters.length;
}, 1000);
```

## Viewport Management

```ts
import { ShadowRenderer } from '@remotex-labs/xansi';

// Create a renderer that occupies the top part of the terminal
const renderer = new ShadowRenderer(10, 80, 0, 0);

// Reposition the renderer to create space for a header
renderer.top = 3;     // Now starts at row 3 (below a header area)
renderer.left = 2;    // Indented by 2 columns

// Resize the renderer to accommodate a sidebar
renderer.width = 70;  // Reduce width to leave space for a sidebar

// Handle terminal resize events
process.stdout.on('resize', () => {
  // Adjust to new terminal dimensions
  renderer.width = process.stdout.columns - 10;  // Leave 10 columns for sidebar
  renderer.height = process.stdout.rows - 5;     // Leave 5 rows for header/footer
  
  // Force redraw after resize
  renderer.render(true);
});
```

## Content Scrolling

```ts

import * as readline from 'readline';
import { ShadowRenderer } from '@services/shadow.service';
import { ANSI, writeRaw } from '@components/ansi.component';

// Create a renderer with viewport 10 rows x 50 columns at the top 3 left corners
const renderer = new ShadowRenderer(10, 50, 3, 0);

// Write all content to the renderer
for (let i = 0; i < 100; i++) {
    renderer.writeText(i, 0, `Item ${ i + 1 }: Scrollable content example`);
}

// Initial render
renderer.render();

// Setup keyboard input for scrolling
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        // Clear screen and exit on Ctrl+C
        writeRaw(ANSI.CLEAR_SCREEN);
        writeRaw(ANSI.SHOW_CURSOR);
        process.exit(0);
    }

    switch (key.name) {
        case 'up':
            renderer.scroll -= 1; // Scroll up one row
            break;
        case 'down':
            renderer.scroll += 1;  // Scroll down one row
            break;
        case 'pageup':
            renderer.scroll -= 5; // Scroll up five rows
            break;
        case 'pagedown':
            renderer.scroll += 5;  // Scroll down five rows
            break;
    }
});

```

## Advanced Rendering Techniques

```ts
import { ShadowRenderer, writeRaw, ANSI, xterm } from '@remotex-labs/xansi';

// Create a renderer for a modal dialog
const renderer = new ShadowRenderer(10, 50, 5, 20);
writeRaw(ANSI.CLEAR_SCREEN);

// Create a modal dialog with title and content
function showModal(title, content) {
    // Hide cursor during rendering to prevent flicker
    writeRaw(ANSI.HIDE_CURSOR);

    try {
        // Clear previous content
        renderer.clear();
        const totalWidth = 40;
        const labelWithPadding = ` ${ title } `;
        const lineWidth = totalWidth - 2;

        const dashCount = lineWidth - labelWithPadding.length;
        const leftDashes = Math.floor(dashCount / 2);
        const rightDashes = dashCount - leftDashes;
        const line = '┌' + '─'.repeat(leftDashes) + xterm.hex('#bf1e1e').bold.dim(labelWithPadding) + '─'.repeat(rightDashes) + '┐';

        // Draw border and title
        renderer.writeText(0, 0, line);

        // Draw content
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            renderer.writeText(i + 2, 2, lines[i]);
        }

        // Draw bottom border
        renderer.writeText(9, 0, '└' + '─'.repeat(38) + '┘');

        // Replace content with clean flag to ensure no artifacts
        renderer.writeText(8, 2, xterm.dim('Press any key to continue...'), true);

        // Force complete redraw
        renderer.render(true);
    } finally {
        // Always restore cursor visibility
        writeRaw(ANSI.SHOW_CURSOR);
    }
}

// Usage example
showModal('Information', 'The operation completed successfully.\nAll files have been processed.');
```

## Terminal Bouncing Blocks Animation
This TypeScript program creates a visually engaging terminal
animation featuring multiple colored blocks (█) that bounce around your terminal window.

```ts
import { createInterface } from 'readline';
import { ShadowRenderer, writeRaw, ANSI, xterm } from '@remotex-labs/xansi';

interface BallInterface {
    x: number;
    y: number;
    dx: number;
    dy: number;
    colorStep: number;
    prevColor: string;
    nextColor: string;
}

class BouncingBalls {
    private renderer: ShadowRenderer;
    private width = 0;
    private height = 0;
    private intervalId: NodeJS.Timeout | null = null;
    private balls: BallInterface[] = [];
    private fadeSteps = 30;
    private ballCount = 15;

    constructor() {
        this.renderer = new ShadowRenderer(this.height, this.width, 0, 0);
        this.updateTerminalSize();

        process.stdout.on('resize', () => this.updateTerminalSize());

        writeRaw(ANSI.HIDE_CURSOR);
        writeRaw(ANSI.CLEAR_SCREEN);

        // Initialize multiple balls
        this.initializeBalls();
    }

    start(frameRate = 50): void {
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            this.updateBallPositions();
            this.drawBalls();
        }, frameRate);

        createInterface({ input: process.stdin, output: process.stdout });
        process.stdin?.setRawMode?.(true);
        process.stdin.on('data', (key) => {
            if (key.toString() === '\u0003' || key.toString().toLowerCase() === 'q') {
                this.stop();
                process.exit(0);
            }
        });
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        writeRaw(ANSI.CLEAR_SCREEN);
        writeRaw(ANSI.SHOW_CURSOR);
    }

    private initializeBalls(): void {
        this.balls = [];
        for (let i = 0; i < this.ballCount; i++) {
            const x = Math.floor(Math.random() * (this.width - 4));
            const y = Math.floor(Math.random() * (this.height - 2));
            const dx = Math.random() > 0.5 ? 1 : -1;
            const dy = Math.random() > 0.5 ? 1 : -1;
            const initialColor = this.getColor(x, y);

            this.balls.push({
                x,
                y,
                dx,
                dy,
                colorStep: 0,
                prevColor: initialColor,
                nextColor: initialColor
            });
        }
    }

    private updateTerminalSize(): void {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;

        this.renderer.width = this.width;
        this.renderer.height = this.height;

        // Reinitialize balls when terminal size changes
        this.initializeBalls();
    }

    private getColor(x: number, y: number): string {
        const r = (x * 5) % 255;
        const g = (y * 5) % 255;
        const b = ((x + y) * 3) % 255;

        return `#${ r.toString(16).padStart(2, '0') }${ g.toString(16).padStart(2, '0') }${ b.toString(16).padStart(2, '0') }`;
    }

    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result
            ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ]
            : [ 255, 255, 255 ];
    }

    private interpolateColor(c1: string, c2: string, t: number): string {
        const [ r1, g1, b1 ] = this.hexToRgb(c1);
        const [ r2, g2, b2 ] = this.hexToRgb(c2);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return `#${ [ r, g, b ].map((v) => v.toString(16).padStart(2, '0')).join('') }`;
    }

    private getFadedColor(ball: BallInterface): string {
        const t = ball.colorStep / this.fadeSteps;
        const color = this.interpolateColor(ball.prevColor, ball.nextColor, t);
        ball.colorStep++;

        if (ball.colorStep > this.fadeSteps) {
            ball.colorStep = 0;
            ball.prevColor = ball.nextColor;
            ball.nextColor = this.getColor(ball.x, ball.y);
        }

        return color;
    }

    private drawBalls(): void {
        for (const ball of this.balls) {
            const color = this.getFadedColor(ball);
            this.renderer.writeText(ball.y, ball.x, xterm.hex(color).bold('█'), true);
        }

        this.renderer.render();
    }

    private updateBallPositions(): void {
        for (const ball of this.balls) {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Bounce off walls
            if (ball.x <= 0 || ball.x >= this.width - 1) {
                ball.dx = -ball.dx;
                ball.x = Math.max(0, Math.min(this.width - 1, ball.x));
            }

            if (ball.y <= 0 || ball.y >= this.height - 1) {
                ball.dy = -ball.dy;
                ball.y = Math.max(0, Math.min(this.height - 1, ball.y));
            }
        }
    }
}

const balls = new BouncingBalls();
balls.start(15); // smoother animation
console.log('Press q or Ctrl+C to exit');
```

## Terminal Bouncing Block Animation
A mesmerizing terminal-based animation featuring a colored block character (█) that bounces around your terminal window.
This program creates a simple yet captivating visual effect using ANSI terminal capabilities.

```ts
import { ShadowRenderer, writeRaw, ANSI, xterm } from '@remotex-labs/xansi';
import { createInterface } from 'readline';

class BouncingBall {
    private x = 0;
    private y = 0;
    private dx = 1;
    private dy = 1;
    private width = 0;
    private height = 0;
    private intervalId: NodeJS.Timeout | null = null;

    private colorStep = 0;
    private fadeSteps = 30;
    private prevColor = '#000000';
    private nextColor = '#ffffff';
    private renderer: ShadowRenderer;

    constructor() {
        this.renderer = new ShadowRenderer(this.height, this.width, 0, 0);
        this.updateTerminalSize();

        process.stdout.on('resize', () => this.updateTerminalSize());

        writeRaw(ANSI.HIDE_CURSOR);
        writeRaw(ANSI.CLEAR_SCREEN);

        this.resetPosition();
        this.prevColor = this.getColor(this.x, this.y);
        this.nextColor = this.prevColor;
    }

    private updateTerminalSize(): void {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;

        this.renderer.width = this.width;
        this.renderer.height = this.height;

        if (this.x >= this.width - 4 || this.y >= this.height - 2) {
            this.resetPosition();
        }
    }

    private resetPosition(): void {
        this.x = Math.floor(this.width / 2);
        this.y = Math.floor(this.height / 2);
    }

    private getColor(x: number, y: number): string {
        const r = (x * 5) % 255;
        const g = (y * 5) % 255;
        const b = ((x + y) * 3) % 255;
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ]
            : [255, 255, 255];
    }

    private interpolateColor(c1: string, c2: string, t: number): string {
        const [r1, g1, b1] = this.hexToRgb(c1);
        const [r2, g2, b2] = this.hexToRgb(c2);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    }

    private getFadedColor(): string {
        const t = this.colorStep / this.fadeSteps;
        const color = this.interpolateColor(this.prevColor, this.nextColor, t);
        this.colorStep++;

        if (this.colorStep > this.fadeSteps) {
            this.colorStep = 0;
            this.prevColor = this.nextColor;
            this.nextColor = this.getColor(this.x, this.y);
        }

        return color;
    }

    private drawBall(): void {
        const color = this.getFadedColor();

        this.renderer.writeText(this.y, this.x, xterm.hex(color).bold('█'), true);
        this.renderer.writeText(this.y, this.x + 1, xterm.hex(color).bold('█'), true);

        this.renderer.render();
    }

    private updateBallPosition(): void {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x <= 0 || this.x >= this.width - 3) {
            this.dx = -this.dx;
            this.x = Math.max(0, Math.min(this.width - 3, this.x));
        }

        if (this.y <= 0 || this.y >= this.height - 2) {
            this.dy = -this.dy;
            this.y = Math.max(0, Math.min(this.height - 2, this.y));
        }
    }

    public start(frameRate = 50): void {
        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            this.updateBallPosition();
            this.drawBall();
        }, frameRate);

        const rl = createInterface({ input: process.stdin, output: process.stdout });
        process.stdin?.setRawMode?.(true);
        process.stdin.on('data', (key) => {
            if (key.toString() === '\u0003' || key.toString().toLowerCase() === 'q') {
                this.stop();
                process.exit(0);
            }
        });
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        writeRaw(ANSI.CLEAR_SCREEN);
        writeRaw(ANSI.SHOW_CURSOR);
    }
}

const ball = new BouncingBall();
ball.start(15); // smoother animation
console.log('Press q or Ctrl+C to exit');
```
