/**
 * Import will remove at compile time
 */

import type { SourceOptionsInterface } from '@services/interfaces/source-service.interface';
import type { PositionWithCodeInterface } from '@services/interfaces/source-service.interface';
import type { PositionWithContentInterface } from '@services/interfaces/source-service.interface';
import type { SourceMapInterface, PositionInterface } from '@services/interfaces/source-service.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { Bias } from '@components/segment.component';
import { MappingService } from '@services/mapping.service';
import { resolve, relative, dirname } from '@components/path.component';

/**
 * Service for loading, merging, and querying Source Map v3 data.
 *
 * @remarks
 * This service wraps a {@link MappingService} and enriches segment lookups with
 * source file paths, names, and optional source content/code context.
 *
 * @example
 * ```ts
 * const sourceMapJSON = '{"version": 3, "file": "bundle.js", "sources": ["foo.ts"], "names": [], "mappings": "AAAA"}';
 * const sourceService = new SourceService(sourceMapJSON);
 * console.log(sourceService.file); // 'bundle.js'
 * ```
 *
 * @since 5.0.0
 */

export class SourceService {
    /**
     * Normalized generated file path associated with this source map.
     * @since 5.0.0
     */

    readonly file: string = '';

    /**
     * Identifier names referenced by mapped segments.
     * @since 5.0.0
     */

    readonly names: Array<string> = [];

    /**
     * Resolved source file paths used by the map.
     * @since 5.0.0
     */

    readonly sources: Array<string> = [];

    /**
     * Optional source root from the source map payload.
     * @since 5.0.0
     */

    readonly sourceRoot: string = '';

    /**
     * Inline source contents aligned with {@link sources} by index.
     * @since 5.0.0
     */

    readonly sourcesContent: Array<string> = [];

    /**
     * Internal mappings handler for encode/decode and lookups.
     * @since 5.0.0
     */

    readonly mappings: MappingService = new MappingService();

    /**
     * Creates an empty source service instance.
     *
     * @remarks
     * Useful when building mappings incrementally or as an accumulator target
     * for {@link assign}.
     *
     * @example
     * ```ts
     * const source = new SourceService();
     * ```
     *
     * @since 5.0.0
     */

    constructor();

    /**
     * Creates a source service with a generated line offset.
     *
     * @param source - Source map payload as object or JSON string
     * @param offset - Generated line offset applied during mapping decode
     *
     * @remarks
     * Use this overload when the source map file path is already embedded in
     * the source map payload and only line shifting is required.
     *
     * @example
     * ```ts
     * const source = new SourceService(rawMap, 20);
     * ```
     *
     * @since 5.0.0
     */

    constructor(source: SourceMapInterface | string, offset?: number);

    /**
     * Creates a source service with explicit file path and optional line offset.
     *
     * @param source - Source map payload as object or JSON string
     * @param file - Generated file path override
     * @param offset - Generated line offset applied during mapping decode
     *
     * @remarks
     * Prefer this overload when the source map payload omits `file` or when a
     * normalized file path override is required.
     *
     * @example
     * ```ts
     * const source = new SourceService(rawMap, 'dist/app.js', 5);
     * ```
     *
     * @since 5.0.0
     */

    constructor(source: SourceMapInterface | string, file?: string, offset?: number);

    /**
     * Creates a new SourceService from a source map object or JSON string.
     *
     * @param source - Source map payload as object or JSON string
     * @param fileOrOffset - Generated file path override, or generated line offset when numeric
     * @param offset - Generated line offset when `fileOrOffset` is a file path
     *
     * @throws Error - If file path is missing after normalization
     * @throws Error - If source map input is invalid or unsupported
     *
     * @since 5.0.0
     */

    constructor(source?: SourceMapInterface | string, fileOrOffset?: string | number, offset?: number) {
        if(!source) return;
        const sourceObject = SourceService.parseSourceMap(source);
        const file = typeof fileOrOffset === 'string' ? fileOrOffset : sourceObject.file;
        if(!file)
            throw new Error('File Path not set for the sourcemap');

        this.file = resolve(file);
        const lineOffset = typeof fileOrOffset === 'number' ? fileOrOffset : (offset ?? 0);
        this.mappings.decode(sourceObject.mappings, 0, 0, lineOffset);

        this.sources.push(...this.resolveSources(sourceObject.sources));
        if(sourceObject.names) this.names.push(...sourceObject.names);
        if(sourceObject.sourceRoot) this.sourceRoot = sourceObject.sourceRoot;
        if(sourceObject.sourcesContent) this.sourcesContent.push(...sourceObject.sourcesContent);
    }

    /**
     * Concatenates multiple source maps into one service instance.
     *
     * @param sources - Source services to merge in order
     *
     * @returns A new service containing merged mappings, names, sources, and contents
     *
     * @throws Error - If no source services are provided
     *
     * @remarks
     * Name and source indices are offset during decode to preserve index
     * correctness across all merged source maps.
     *
     * @example
     * ```ts
     * const merged = SourceService.assign(sourceA, sourceB, ...);
     * ```
     *
     * @since 5.0.0
     */

    static assign(...sources: Array<SourceService>): SourceService {
        if (sources.length < 1)
            throw new Error('At least one source-map must be provided for assign.');

        const result = new SourceService();
        for(const source of sources) {
            result.mappings.decode(source.mappings, result.names.length, result.sources.length);
            result.names.push(...source.names);
            result.sources.push(...source.sources.map(sourceFile => {
                if(this.isURL(sourceFile))
                    return sourceFile;

                return source.sourceRoot + sourceFile;
            }));
            result.sourcesContent.push(...source.sourcesContent);
        }

        return result;
    }

    /**
     * Serializes current data to a Source Map v3 object.
     *
     * @returns A source map object with encoded mappings
     *
     * @remarks
     * Includes optional `file` and `sourceRoot` only when they are set.
     *
     * @example
     * ```ts
     * const map = source.getSourceObject();
     * ```
     *
     * @since 5.0.0
     */

    getSourceObject(): SourceMapInterface {
        const sourceMap: SourceMapInterface = {
            version: 3,
            file: this.file,
            names: this.names,
            sources: this.sources,
            mappings: this.mappings.encode(),
            sourcesContent: this.sourcesContent
        };

        if (this.sourceRoot)
            sourceMap.sourceRoot = this.sourceRoot;

        return sourceMap;
    }

    /**
     * Resolves an original position from a generated position.
     *
     * @param line - 1-based generated line number
     * @param column - 1-based generated column number
     * @param bias - Search behavior when no exact match exists (default: {@link Bias.BOUND})
     *
     * @returns Position details, or `null` when no segment matches
     *
     * @remarks
     * The returned `name` can be `null` when the mapped segment has no
     * associated name index.
     *
     * @example
     * ```ts
     * const pos = source.getPosition(12, 8);
     * ```
     *
     * @since 5.0.0
     */

    getPosition(line: number, column: number, bias: Bias = Bias.BOUND): PositionInterface | null {
        const segment = this.mappings.getSegment(line, column, bias);
        if (!segment)
            return null;

        return {
            name: this.names[segment.nameIndex ?? -1] ?? null,
            line: segment.line,
            column: segment.column,
            source: this.sources[segment.sourceIndex],
            sourceRoot: this.sourceRoot,
            sourceIndex: segment.sourceIndex,
            generatedLine: segment.generatedLine,
            generatedColumn: segment.generatedColumn
        };
    }

    /**
     * Resolves an original position and includes full source content for that file.
     *
     * @param line - 1-based generated line number
     * @param column - 1-based generated column number
     * @param bias - Search behavior when no exact match exists (default: {@link Bias.BOUND})
     *
     * @returns Position details with source content, or `null` when unavailable
     *
     * @remarks
     * Returns `null` if no mapped segment is found for the generated position.
     *
     * @example
     * ```ts
     * const pos = source.getPositionWithContent(12, 8);
     * ```
     *
     * @since 5.0.0
     */

    getPositionWithContent(line: number, column: number, bias: Bias = Bias.BOUND): PositionWithContentInterface | null {
        const position = this.getPosition(line, column, bias);
        if (!position)
            return null;

        return {
            ...position,
            sourcesContent: this.sourcesContent[position.sourceIndex]
        };
    }

    /**
     * Resolves an original position and includes surrounding code context.
     *
     * @param line - 1-based generated line number
     * @param column - 1-based generated column number
     * @param bias - Search behavior when no exact match exists (default: {@link Bias.BOUND})
     * @param options - Optional line window configuration
     *
     * @returns Position details with extracted code context, or `null` when unavailable
     *
     * @remarks
     * Default window uses `3` lines before and `4` lines after the target line.
     *
     * @example
     * ```ts
     * const pos = source.getPositionWithCode(12, 8, Bias.BOUND, {
     *   linesBefore: 2,
     *   linesAfter: 2
     * });
     * ```
     *
     * @since 5.0.0
     */

    getPositionWithCode(line: number, column: number, bias: Bias = Bias.BOUND, options?: SourceOptionsInterface): PositionWithCodeInterface | null {
        const position = this.getPosition(line, column, bias);
        if (!position || !this.sourcesContent[position.sourceIndex])
            return null;

        const settings = Object.assign({
            linesAfter: 4,
            linesBefore: 3
        }, options);

        const code = this.sourcesContent[position.sourceIndex].split('\n');
        const linePosition = (position.line ?? 1) - 1;
        const startLine = Math.max(linePosition - settings.linesBefore, 0);
        const endLine = Math.min(linePosition + settings.linesAfter, code.length - 1);
        const relevantCode = code.slice(startLine, endLine + 1).join('\n');

        return {
            ...position,
            code: relevantCode,
            endLine: endLine,
            startLine: startLine
        };
    }

    /**
     * Resolves a generated position from an original source position.
     *
     * @param line - 1-based original source line number
     * @param column - 1-based original source column number
     * @param sourceIndex - Source index or a partial source path to locate the index
     * @param bias - Search behavior when no exact match exists (default: {@link Bias.BOUND})
     *
     * @returns Position details, or `null` when no segment/source matches
     *
     * @remarks
     * String `sourceIndex` is matched using substring search against resolved
     * source paths in {@link sources}.
     *
     * @example
     * ```ts
     * const pos = source.getPositionByOriginal(40, 3, 'src/main.ts');
     * ```
     *
     * @since 5.0.0
     */

    getPositionByOriginal(line: number, column: number, sourceIndex: number | string, bias: Bias = Bias.BOUND): PositionInterface | null {
        let index = <number> sourceIndex;
        if (typeof sourceIndex === 'string')
            index = this.sources.findIndex(str => str.includes(sourceIndex));

        if (index < 0)
            return null;

        const segment = this.mappings.getOriginalSegment(line, column, index, bias);
        if (!segment)
            return null;

        return {
            name: this.names[segment.nameIndex ?? -1] ?? null,
            line: segment.line,
            column: segment.column,
            source: this.sources[segment.sourceIndex],
            sourceRoot: this.sourceRoot,
            sourceIndex: segment.sourceIndex,
            generatedLine: segment.generatedLine,
            generatedColumn: segment.generatedColumn
        };
    }

    /**
     * Serializes the current source map object as JSON.
     *
     * @returns JSON string representation of {@link getSourceObject}
     *
     * @remarks
     * Output is suitable for writing a `.map` file or transport over APIs.
     *
     * @example
     * ```ts
     * const json = source.toString();
     * ```
     *
     * @since 5.0.0
     */

    toString(): string {
        return JSON.stringify(this.getSourceObject());
    }

    /**
     * Parses and validates Source Map v3 input.
     *
     * @param input - Source map object or JSON string
     *
     * @returns Parsed and validated source map object
     *
     * @throws Error - If source map version is not `3`
     * @throws Error - If required keys are missing
     *
     * @remarks
     * Accepts JSON input for convenience and validates required structural keys
     * before decode operations are attempted.
     *
     * @example
     * ```ts
     * const map = SourceService['parseSourceMap'](raw);
     * ```
     *
     * @since 5.0.0
     */

    private static parseSourceMap(input: SourceMapInterface | string): SourceMapInterface {
        if (typeof input === 'string') input = <SourceMapInterface> JSON.parse(input);
        if (input.version !== 3)
            throw new Error(`Unsupported SourceMap version: ${ input.version }. Expected version 3.`);

        const requiredKeys: Array<keyof SourceMapInterface> = [ 'sources', 'mappings' ];
        const missingKeys = requiredKeys.filter(key => !(key in input));

        if (missingKeys.length > 0)
            throw new Error(
                `Invalid SourceMap: missing required ${ missingKeys.length === 1 ? 'key' : 'keys' }: ${
                    missingKeys.join(', ')
                }.`
            );

        return input;
    }

    /**
     * Checks whether a source path is an HTTP(S) URL.
     *
     * @param path - Path or URL candidate to evaluate
     *
     * @returns `true` when the value starts with `http` or `https`, otherwise `false`
     *
     * @remarks
     * This helper is used to preserve absolute URL sources and avoid filesystem
     * path normalization for remote resources.
     *
     * @example
     * ```ts
     * SourceService['isURL']('https://cdn.example.com/app.ts'); // true
     * SourceService['isURL']('src/app.ts'); // false
     * ```
     *
     * @since 5.0.0
     */

    private static isURL(path: string): boolean {
        return path.startsWith('http') || path.startsWith('https');
    }

    /**
     * Resolves source paths relative to the current working directory.
     *
     * @param sources - Raw source entries from source map payload
     *
     * @returns Normalized relative source file paths
     *
     * @remarks
     * Each path is resolved from the generated file location, then converted to
     * a path relative to `process.cwd()`.
     *
     * @example
     * ```ts
     * // internal utility used during construction
     * ```
     *
     * @since 5.0.0
     */

    private resolveSources(sources: Array<string>): Array<string> {
        return sources?.map(source => {
            if(SourceService.isURL(source))
                return source;

            if(source.startsWith('..'))
                return relative(cwd(), resolve(dirname(this.file), source));

            return source;
        }) ?? [];
    }
}
