/**
 * Import will remove at compile time
 */

import type { SourceMapInterface } from '@services/interfaces/source-service.interface';
import type { SegmentInterface } from '@components/interfaces/segment-component.interface';

/**
 * Imports
 */

import { toPosix } from '@components/path.component';
import { Bias } from '@components/segment.component';
import { MappingService } from '@services/mapping.service';

export interface PositionLookupOptions {
    linesAfter?: number;
    linesBefore?: number;
}

export interface GeneratedPositionResult {
    generatedLine: number;
    generatedColumn: number;
    sourceLine: number;
    sourceColumn: number;
    sourceIndex: number;
    sourcePath: string;
    sourceContent?: string;
    nameIndex: number | null;
    name?: string;
}

export interface OriginalPositionResult {
    generatedLine: number;
    generatedColumn: number;
    sourceLine: number;
    sourceColumn: number;
    sourceIndex: number;
    sourcePath: string;
    sourceContent?: string;
    nameIndex: number | null;
    name?: string;
}

export interface GeneratedPositionWithCodeResult extends GeneratedPositionResult {
    codeContext: Array<{ lineNumber: number; content: string }>;
}

export class SourceService {
    private readonly sourceMap: SourceMapInterface;
    private readonly mappingsService: MappingService = new MappingService();
    private generatedLineCount: number = 0;

    constructor(sourceMap: SourceMapInterface | string) {
        this.sourceMap = SourceService.normalizeSourceMap(
            typeof sourceMap === 'string'
                ? SourceService.parseSourceMap(sourceMap)
                : sourceMap
        );

        this.loadMappings(this.sourceMap.mappings);
    }

    mapGeneratedPosition(line: number, column: number, bias: Bias = Bias.BOUND): GeneratedPositionResult | null {
        const segment = this.mappingsService.getSegment(line, column, bias);

        return segment ? this.toPositionResult(segment, false) : null;
    }

    mapGeneratedPositionWithContent(line: number, column: number, bias: Bias = Bias.BOUND): GeneratedPositionResult | null {
        const segment = this.mappingsService.getSegment(line, column, bias);

        return segment ? this.toPositionResult(segment, true) : null;
    }

    mapGeneratedPositionWithCode(
        line: number,
        column: number,
        bias: Bias = Bias.BOUND,
        options: PositionLookupOptions = {}
    ): GeneratedPositionWithCodeResult | null {
        const result = this.mapGeneratedPositionWithContent(line, column, bias);
        if (!result || !result.sourceContent) return null;

        const linesBefore = Math.max(0, options.linesBefore ?? 2);
        const linesAfter = Math.max(0, options.linesAfter ?? 2);
        const sourceLines = result.sourceContent.split(/\r?\n/u);
        const startLine = Math.max(1, result.sourceLine - linesBefore);
        const endLine = Math.min(sourceLines.length, result.sourceLine + linesAfter);
        const codeContext = new Array<{ lineNumber: number; content: string }>();

        for (let currentLine = startLine; currentLine <= endLine; currentLine++) {
            codeContext.push({
                lineNumber: currentLine,
                content: sourceLines[currentLine - 1] ?? ''
            });
        }

        return { ...result, codeContext };
    }

    mapOriginalPosition(line: number, column: number, sourceIndex: number, bias: Bias = Bias.BOUND): OriginalPositionResult | null {
        const segment = this.mappingsService.getOriginalSegment(line, column, sourceIndex, bias);

        return segment ? this.toPositionResult(segment, false) : null;
    }

    duplicate(): SourceService {
        return new SourceService(this.getSourceMapObject());
    }

    getSourceMapObject(): SourceMapInterface {
        return {
            ...this.sourceMap,
            file: this.sourceMap.file,
            mappings: this.mappingsService.encode(),
            names: this.sourceMap.names ? [ ...this.sourceMap.names ] : undefined,
            sources: [ ...this.sourceMap.sources ],
            sourcesContent: this.sourceMap.sourcesContent ? [ ...this.sourceMap.sourcesContent ] : undefined
        };
    }

    concat(...maps: Array<SourceMapInterface | SourceService>): this {
        for (const mapItem of maps) {
            const map = mapItem instanceof SourceService
                ? mapItem.getSourceMapObject()
                : SourceService.normalizeSourceMap(mapItem);
            this.appendSourceMap(map);
        }

        return this;
    }

    concatNewMap(...maps: Array<SourceMapInterface | SourceService>): SourceService {
        return this.duplicate().concat(...maps);
    }

    getPosition(line: number, col: number, bias: Bias = Bias.BOUND): GeneratedPositionResult | null {
        return this.mapGeneratedPosition(line, col, bias);
    }

    getPositionWithContent(line: number, col: number, bias: Bias = Bias.BOUND): GeneratedPositionResult | null {
        return this.mapGeneratedPositionWithContent(line, col, bias);
    }

    getPositionWithCode(line: number, col: number, bias: Bias = Bias.BOUND, option: PositionLookupOptions = {}): GeneratedPositionWithCodeResult | null {
        return this.mapGeneratedPositionWithCode(line, col, bias, option);
    }

    getPositionByOriginal(line: number, col: number, sourceIndex: number, bias: Bias = Bias.BOUND): OriginalPositionResult | null {
        return this.mapOriginalPosition(line, col, sourceIndex, bias);
    }

    getMapObject(): SourceMapInterface {
        return this.getSourceMapObject();
    }

    private appendSourceMap(map: SourceMapInterface): void {
        const namesOffset = this.sourceMap.names?.length ?? 0;
        const sourcesOffset = this.sourceMap.sources.length;
        const lineOffset = this.generatedLineCount;
        const incomingLineCount = SourceService.getMappingLineCount(map.mappings);

        if (map.names && map.names.length > 0) {
            this.sourceMap.names ??= [];
            this.sourceMap.names.push(...map.names);
        }

        if (map.sources.length > 0) {
            this.sourceMap.sources.push(...map.sources.map(toPosix));
        }

        if (map.sourcesContent && map.sourcesContent.length > 0) {
            this.sourceMap.sourcesContent ??= [];
            this.sourceMap.sourcesContent.push(...map.sourcesContent);
        } else if (this.sourceMap.sourcesContent) {
            for (let i = 0; i < map.sources.length; i++) this.sourceMap.sourcesContent.push('');
        }

        if (map.mappings) {
            this.mappingsService.decode(map.mappings, namesOffset, sourcesOffset, lineOffset);
        }

        this.generatedLineCount += incomingLineCount;
        this.sourceMap.mappings = this.mappingsService.encode();
    }

    private loadMappings(mappings: string): void {
        this.generatedLineCount = SourceService.getMappingLineCount(mappings);
        if (!mappings) return;

        this.mappingsService.decode(mappings);
        this.sourceMap.mappings = this.mappingsService.encode();
    }

    private toPositionResult(segment: SegmentInterface, includeContent: boolean): GeneratedPositionResult {
        return {
            generatedLine: segment.generatedLine,
            generatedColumn: segment.generatedColumn,
            sourceLine: segment.line,
            sourceColumn: segment.column,
            sourceIndex: segment.sourceIndex,
            sourcePath: this.sourceMap.sources[segment.sourceIndex] ?? '',
            sourceContent: includeContent ? this.sourceMap.sourcesContent?.[segment.sourceIndex] : undefined,
            nameIndex: segment.nameIndex,
            name: segment.nameIndex !== null ? this.sourceMap.names?.[segment.nameIndex] : undefined
        };
    }

    private static parseSourceMap(raw: string): SourceMapInterface {
        try {
            return JSON.parse(raw) as SourceMapInterface;
        } catch (error) {
            throw new Error(`Invalid source map JSON: ${ error instanceof Error ? error.message : String(error) }`);
        }
    }

    private static normalizeSourceMap(sourceMap: SourceMapInterface): SourceMapInterface {
        if (!sourceMap || typeof sourceMap !== 'object')
            throw new Error('Invalid source map: expected an object.');
        if (!Array.isArray(sourceMap.sources))
            throw new Error('Invalid source map: "sources" must be an array.');
        if (typeof sourceMap.mappings !== 'string')
            throw new Error('Invalid source map: "mappings" must be a string.');
        if (typeof sourceMap.version !== 'number')
            throw new Error('Invalid source map: "version" must be a number.');

        return {
            ...sourceMap,
            file: sourceMap.file ? toPosix(sourceMap.file) : undefined,
            sourceRoot: sourceMap.sourceRoot ? toPosix(sourceMap.sourceRoot) : undefined,
            names: sourceMap.names ? [ ...sourceMap.names ] : [],
            sources: sourceMap.sources.map(toPosix),
            mappings: sourceMap.mappings,
            sourcesContent: sourceMap.sourcesContent ? [ ...sourceMap.sourcesContent ] : undefined
        };
    }

    private static getMappingLineCount(mappings: string): number {
        if (!mappings) return 0;

        return mappings.split(';').length;
    }
}
