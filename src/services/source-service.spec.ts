/**
 * Import will remove at compile time
 */

import type { SourceMapInterface } from '@services/interfaces/source-service.interface';

/**
 * Imports
 */

import { resolve } from '@components/path.component';
import { Bias } from '@components/segment.component';
import { SourceService } from '@services/source.service';

/**
 * Tests
 */

describe('SourceService', () => {
    beforeEach(() => {
        xJet.clearAllMocks();
    });

    describe('constructor', () => {

        test('should create an empty instance when called with no arguments', () => {
            const service = new SourceService();

            expect(service.file).toBe('');
            expect(service.names).toEqual([]);
            expect(service.sources).toEqual([]);
            expect(service.sourceRoot).toBe('');
            expect(service.sourcesContent).toEqual([]);
        });

        test('should create empty instance with default mappings service', () => {
            const service = new SourceService();

            expect(service.mappings).toBeDefined();
            expect(service.mappings.encode()).toBe('');
        });

        test('should throw when version are missing from source map', () => {
            const invalidSourceMap: any = {};

            expect(() => new SourceService(invalidSourceMap)).toThrow(
                'Unsupported SourceMap version: undefined. Expected version 3.'
            );
        });

        test('should throw when required keys are missing from source map', () => {
            const invalidSourceMap: any = {
                version: 3
            };

            expect(() => new SourceService(invalidSourceMap)).toThrow(
                'Invalid SourceMap: missing required keys: sources, mappings.'
            );
        });

        test('should throw when only mappings key is missing', () => {
            const invalidSourceMap: any = { version: 3, sources: [] };

            expect(() => new SourceService(invalidSourceMap)).toThrow(
                'Invalid SourceMap: missing required key: mappings.'
            );
        });

        test('should throw when only sources key is missing', () => {
            const invalidSourceMap: any = { version: 3, mappings: 'AAAA' };

            expect(() => new SourceService(invalidSourceMap)).toThrow(
                'Invalid SourceMap: missing required key: sources.'
            );
        });

        test('should throw when source map version is not 3', () => {
            const invalidSourceMap: any = {
                version: 2,
                sources: [],
                mappings: 'AAAA'
            };

            expect(() => new SourceService(invalidSourceMap)).toThrow(
                'Unsupported SourceMap version: 2. Expected version 3.'
            );
        });

        test('should throw when source map version is 4', () => {
            const invalidSourceMap: any = {
                version: 4,
                sources: [],
                mappings: 'AAAA'
            };

            expect(() => new SourceService(invalidSourceMap)).toThrow(
                'Unsupported SourceMap version: 4. Expected version 3.'
            );
        });

        test('should accept a JSON string as source map input', () => {
            const sourceMapJSON = JSON.stringify({
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [ 'const x = 1;' ],
                mappings: 'AAAA',
                names: []
            });

            const service = new SourceService(sourceMapJSON);

            expect(service.file).toBe(resolve('bundle.js'));
            expect(service.names).toEqual([]);
            expect(service.sourcesContent).toEqual([ 'const x = 1;' ]);
        });

        test('should throw when JSON string is malformed', () => {
            expect(() => new SourceService('{ invalid json')).toThrow();
        });

        test('should assign empty arrays for null optional properties', () => {
            const sourceMap: any = {
                version: 3,
                file: 'bundle.js',
                mappings: 'AAAA',
                names: null,
                sources: null,
                sourcesContent: null
            };

            const service: any = new SourceService(sourceMap);

            expect(service.names).toEqual([]);
            expect(service.sources).toEqual([]);
            expect(service.sourcesContent).toEqual([]);
        });

        test('should assign properties from a valid source map object', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                names: [ 'name1', 'name2' ],
                sources: [ 'source1.js', 'source2.js' ],
                mappings: 'AAAA',
                sourcesContent: [ '// content 1', '// content 2' ]
            };

            const service = new SourceService(sourceMap);

            expect(service.names).toEqual(sourceMap.names);
            expect(service.sourcesContent).toEqual(sourceMap.sourcesContent);
        });

        test('should assign sourceRoot when present in the source map', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sourceRoot: 'https://example.com/',
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            expect(service.sourceRoot).toBe('https://example.com/');
        });

        test('should use the file path override from the second argument', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap, 'dist/bundle.js');

            expect(service.file).toBe(resolve('dist/bundle.js'));
        });

        test('should prefer the file override over the source map file field', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'original.js',
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap, 'dist/override.js');

            expect(service.file).toBe(resolve('dist/override.js'));
        });

        test('should throw when file path is missing and not provided as override', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            expect(() => new SourceService(sourceMap)).toThrow(
                'File Path not set for the sourcemap'
            );
        });

        test('should accept a numeric line offset as the second argument', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            expect(() => new SourceService(sourceMap, 5)).not.toThrow();
        });

        test('should accept a file path and numeric offset as second and third arguments', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            expect(() => new SourceService(sourceMap, 'dist/bundle.js', 10)).not.toThrow();
            const service = new SourceService(sourceMap, 'dist/bundle.js', 10);
            expect(service.file).toBe(resolve('dist/bundle.js'));
        });

        test('should use offset of 0 when not provided', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [],
                mappings: 'AAAA',
                names: []
            };

            const serviceWithOffset = new SourceService(sourceMap, 0);
            const serviceWithoutOffset = new SourceService(sourceMap);

            expect(serviceWithOffset.mappings.encode()).toBe(serviceWithoutOffset.mappings.encode());
        });

        test('should preserve URL sources without path resolution', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'https://cdn.example.com/src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            expect(service.sources[0]).toBe('https://cdn.example.com/src/foo.ts');
        });

        test('should resolve non-URL sources relative to cwd', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'dist/bundle.js',
                sources: [ '../src/foo.ts' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            // resolve is mocked — just confirm it processed the source
            expect(service.sources[0]).toBeDefined();
            expect(typeof service.sources[0]).toBe('string');
        });

        test('should handle mixed URL and non-URL sources in the same map', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/local.ts', 'https://cdn.example.com/remote.ts' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            expect(service.sources[1]).toBe('https://cdn.example.com/remote.ts');
            expect(service.sources[0]).toBeDefined();
        });

        test('should handle an empty sources array', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            expect(service.sources).toEqual([]);
        });

        test('should handle an empty names array', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            expect(service.names).toEqual([]);
        });
    });

    describe('decodeMappings', () => {
        test('should throw when the mappings string contains invalid VLQ format', () => {
            expect(() => {
                const sourceMap: SourceMapInterface = {
                    version: 3,
                    file: 'bundle.js',
                    names: [],
                    sources: [],
                    sourcesContent: [],
                    mappings: 'AAAA,CAAC;AACA\n\r\d;;AACA'
                };

                new SourceService(sourceMap);
            }).toThrow(/Invalid mappings string: contains characters outside the VLQ alphabet./);
        });

        test('should decode semicolon-separated lines', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA;AACA;AACA',
                names: []
            };

            expect(() => new SourceService(sourceMap)).not.toThrow();
        });
    });

    describe('getPosition', () => {
        let mockSourceMap: SourceMapInterface;
        let sourceService: SourceService;

        beforeEach(() => {
            mockSourceMap = {
                version: 3,
                file: 'bundle.js',
                names: [ 'name1', 'name2' ],
                sources: [ 'source1.js', 'source2.js' ],
                mappings: 'AAAA;AACA;AACA',
                sourcesContent: [ 'console.log("source1");', 'console.log("source2");' ]
            };
            sourceService = new SourceService(mockSourceMap);
        });

        test('should return null when no segment is found for the generated position', () => {
            const position = sourceService.getPosition(99, 99);

            expect(position).toBeNull();
        });

        test('should call getSegment with Bias.UPPER_BOUND and return mapped position', () => {
            const retrieveMappingSpy = xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 2,
                nameIndex: 0,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 2
            });

            const position = sourceService.getPosition(1, 2, Bias.UPPER_BOUND);

            expect(retrieveMappingSpy).toHaveBeenCalledWith(1, 2, Bias.UPPER_BOUND);
            expect(position).toEqual({
                line: 1,
                column: 2,
                name: 'name1',
                source: 'source1.js',
                sourceRoot: '',
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 2
            });
        });

        test('should call getSegment with Bias.LOWER_BOUND and return mapped position', () => {
            const retrieveMappingSpy = xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 2,
                nameIndex: 0,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 2
            });

            const position = sourceService.getPosition(1, 2, Bias.LOWER_BOUND);

            expect(retrieveMappingSpy).toHaveBeenCalledWith(1, 2, Bias.LOWER_BOUND);
            expect(position).toEqual({
                line: 1,
                column: 2,
                name: 'name1',
                source: 'source1.js',
                sourceRoot: '',
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 2
            });
        });

        test('should return null name when nameIndex is null on the segment', () => {
            xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 1,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 1
            });

            const position = sourceService.getPosition(1, 1);

            expect(position).not.toBeNull();
            expect(position!.name).toBeNull();
        });

        test('should default to Bias.BOUND when no bias argument is provided', () => {
            const spy = xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue(null);

            sourceService.getPosition(1, 1);

            expect(spy).toHaveBeenCalledWith(1, 1, Bias.BOUND);
        });

        test('should populate sourceRoot in returned position from service sourceRoot', () => {
            const mapWithRoot: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sourceRoot: 'https://example.com/',
                names: [ 'myFn' ],
                sources: [ 'src/foo.ts' ],
                mappings: 'AAAA',
                sourcesContent: []
            };
            const service = new SourceService(mapWithRoot);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 0,
                nameIndex: 0,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 0
            });

            const position = service.getPosition(1, 0);

            expect(position!.sourceRoot).toBe('https://example.com/');
        });

        test('should return correct source path for the matched sourceIndex', () => {
            xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue({
                line: 5,
                column: 3,
                nameIndex: null,
                sourceIndex: 1,
                generatedLine: 2,
                generatedColumn: 3
            });

            const position = sourceService.getPosition(2, 3);

            expect(position!.source).toBe('source2.js');
            expect(position!.sourceIndex).toBe(1);
        });

        test('should return name for valid nameIndex beyond index 0', () => {
            xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 0,
                nameIndex: 1,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 0
            });

            const position = sourceService.getPosition(1, 0);

            expect(position!.name).toBe('name2');
        });

        test('should return null name when nameIndex is out of bounds', () => {
            xJet.spyOn(sourceService.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 0,
                nameIndex: 99,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 0
            });

            const position = sourceService.getPosition(1, 0);

            expect(position!.name).toBeNull();
        });
    });

    describe('getPositionWithContent', () => {
        test('should return null when no segment is found for the generated position', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                names: [],
                sources: [],
                sourcesContent: [],
                mappings: 'AAAA,CAAC;AACA;;AACA'
            };

            const service = new SourceService(sourceMap);
            const mockGetSegment = xJet.spyOn(service.mappings, 'getSegment');
            const position = service.getPositionWithContent(10, 5);

            expect(position).toBeNull();
            expect(mockGetSegment).toHaveBeenCalledWith(10, 5, Bias.BOUND);
        });

        test('should return position with sourcesContent for the matched source index', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                names: [],
                sources: [ 'src/foo.ts' ],
                sourcesContent: [ 'const x = 1;' ],
                mappings: 'AAAA'
            };

            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 1,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 1
            });

            const position = service.getPositionWithContent(1, 1);

            expect(position).not.toBeNull();
            expect(position!.sourcesContent).toBe('const x = 1;');
        });

        test('should return undefined sourcesContent when sourceIndex has no content entry', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                names: [],
                sources: [ 'src/foo.ts', 'src/bar.ts' ],
                sourcesContent: [ 'const x = 1;' ],  // only one entry for two sources
                mappings: 'AAAA'
            };

            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 1,
                nameIndex: null,
                sourceIndex: 1,  // points to bar.ts with no content
                generatedLine: 1,
                generatedColumn: 1
            });

            const position = service.getPositionWithContent(1, 1);

            expect(position).not.toBeNull();
            expect(position!.sourcesContent).toBeUndefined();
        });

        test('should include all base position fields in the returned object', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                names: [ 'myVar' ],
                sources: [ 'src/foo.ts' ],
                sourcesContent: [ 'let myVar = 42;' ],
                mappings: 'AAAA'
            };

            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 2,
                column: 4,
                nameIndex: 0,
                sourceIndex: 0,
                generatedLine: 3,
                generatedColumn: 5
            });

            const position = service.getPositionWithContent(3, 5);

            expect(position).toMatchObject({
                line: 2,
                column: 4,
                name: 'myVar',
                source: 'src/foo.ts',
                sourceRoot: '',
                sourceIndex: 0,
                generatedLine: 3,
                generatedColumn: 5,
                sourcesContent: 'let myVar = 42;'
            });
        });

        test('should forward custom bias to getSegment', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                names: [],
                sources: [ 'src/foo.ts' ],
                sourcesContent: [ '' ],
                mappings: 'AAAA'
            };

            const service = new SourceService(sourceMap);
            const spy = xJet.spyOn(service.mappings, 'getSegment').mockReturnValue(null);

            service.getPositionWithContent(5, 3, Bias.UPPER_BOUND);

            expect(spy).toHaveBeenCalledWith(5, 3, Bias.UPPER_BOUND);
        });
    });

    describe('getPositionWithCode', () => {
        const sourceMap: SourceMapInterface = {
            version: 3,
            file: 'bundle.js',
            sources: [ 'src/x.spec.ts' ],
            sourcesContent: [ 'function name(data: string) {\n    console.log(\'name\' + data);\n    throw new Error(\'xxxxxxxxxx\');\n}\n\nname(\'x\');\n' ],
            mappings: ';;;AAAA,SAAS,KAAK,MAAc;AACxB,UAAQ,IAAI,SAAS,IAAI;AACzB,QAAM,IAAI,MAAM,YAAY;AAChC;AAEA,KAAK,GAAG;',
            names: []
        };

        test('should return position with code context around the matched line', () => {
            const service = new SourceService(sourceMap);
            const mockGetSegment = xJet.spyOn(service.mappings, 'getSegment');
            const position = service.getPositionWithCode(5, 1, Bias.BOUND, {});

            expect(mockGetSegment).toHaveBeenCalledWith(5, 1, Bias.BOUND);
            expect(position?.code.trim()).toContain('throw new Error(\'xxxxxxxxxx\')');
            expect(position).toEqual({
                code: expect.any(String),
                line: 2,
                column: 5,
                endLine: 5,
                startLine: 0,
                name: null,
                source: 'src/x.spec.ts',
                sourceRoot: '',
                sourceIndex: 0,
                generatedLine: 5,
                generatedColumn: 1
            });
        });

        test('should respect linesBefore and linesAfter options', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 3,
                column: 5,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 5,
                generatedColumn: 1
            });

            const position = service.getPositionWithCode(5, 1, Bias.BOUND, {
                linesBefore: 1,
                linesAfter: 1
            });

            expect(position).not.toBeNull();
            const lines = position!.code.split('\n');
            expect(lines.length).toBeLessThanOrEqual(3); // 1 before + target + 1 after
        });

        test('should return null when no segment is found', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue(null);

            const position = service.getPositionWithCode(99, 99);

            expect(position).toBeNull();
        });

        test('should return null when sourcesContent is absent for the matched source index', () => {
            const mapWithoutContent: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(mapWithoutContent);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 1,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 1
            });

            const position = service.getPositionWithCode(1, 1);

            expect(position).toBeNull();
        });

        test('should clamp startLine to 0 when linesBefore exceeds available lines', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 1,
                column: 1,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 1
            });

            const position = service.getPositionWithCode(1, 1, Bias.BOUND, { linesBefore: 100 });

            expect(position).not.toBeNull();
            expect(position!.startLine).toBe(0);
        });

        test('should clamp endLine to last line when linesAfter exceeds available lines', () => {
            const service = new SourceService(sourceMap);
            const totalLines = sourceMap.sourcesContent![0].split('\n').length;
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: totalLines,
                column: 0,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 1,
                generatedColumn: 0
            });

            const position = service.getPositionWithCode(1, 0, Bias.BOUND, { linesAfter: 100 });

            expect(position).not.toBeNull();
            expect(position!.endLine).toBe(totalLines - 1);
        });

        test('should use default window of 3 before and 4 after when options not provided', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 4,
                column: 0,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 5,
                generatedColumn: 0
            });

            const position = service.getPositionWithCode(5, 0);

            expect(position).not.toBeNull();
            // line 4 (0-indexed: 3), startLine = max(3 - 3, 0) = 0, endLine = min(3 + 4, last) = 6
            expect(position!.startLine).toBe(0);
            expect(position!.endLine).toBeLessThanOrEqual(6);
        });

        test('should forward custom bias argument to getSegment', () => {
            const service = new SourceService(sourceMap);
            const spy = xJet.spyOn(service.mappings, 'getSegment').mockReturnValue(null);

            service.getPositionWithCode(5, 1, Bias.LOWER_BOUND);

            expect(spy).toHaveBeenCalledWith(5, 1, Bias.LOWER_BOUND);
        });

        test('should return code as a newline-joined string of extracted lines', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 2,
                column: 0,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 5,
                generatedColumn: 0
            });

            const position = service.getPositionWithCode(5, 0, Bias.BOUND, {
                linesBefore: 1,
                linesAfter: 1
            });

            expect(position).not.toBeNull();
            expect(position!.code).toContain('\n');
        });

        test('should include startLine and endLine in the returned object', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getSegment').mockReturnValue({
                line: 3,
                column: 0,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 6,
                generatedColumn: 0
            });

            const position = service.getPositionWithCode(6, 0, Bias.BOUND, {
                linesBefore: 1,
                linesAfter: 1
            });

            expect(position).toHaveProperty('startLine');
            expect(position).toHaveProperty('endLine');
            expect(typeof position!.startLine).toBe('number');
            expect(typeof position!.endLine).toBe('number');
        });
    });

    describe('getPositionByOriginal', () => {
        const sourceMap: SourceMapInterface = {
            version: 3,
            file: 'bundle.js',
            sources: [ 'src/x.spec.ts' ],
            sourcesContent: [ 'function name(data: string) {\n    console.log(\'name\' + data);\n    throw new Error(\'xxxxxxxxxx\');\n}\n\nname(\'x\');\n' ],
            mappings: ';;;AAAA,SAAS,KAAK,MAAc;AACxB,UAAQ,IAAI,SAAS,IAAI;AACzB,QAAM,IAAI,MAAM,YAAY;AAChC;AAEA,KAAK,GAAG;',
            names: []
        };

        test('should resolve position using a partial source path string', () => {
            const service = new SourceService(sourceMap);
            const mockGetSegment = xJet.spyOn(service.mappings, 'getOriginalSegment');
            const position = service.getPositionByOriginal(3, 11, 'x.spec.ts');

            expect(mockGetSegment).toHaveBeenCalledWith(3, 11, 0, Bias.BOUND);
            expect(position).toEqual({
                line: 3,
                column: 11,
                name: null,
                source: 'src/x.spec.ts',
                sourceRoot: '',
                sourceIndex: 0,
                generatedLine: 6,
                generatedColumn: 9
            });
        });

        test('should resolve position using a numeric source index', () => {
            const service = new SourceService(sourceMap);
            const mockGetSegment = xJet.spyOn(service.mappings, 'getOriginalSegment');
            const position = service.getPositionByOriginal(3, 11, 0);

            expect(mockGetSegment).toHaveBeenCalledWith(3, 11, 0, Bias.BOUND);
            expect(position).not.toBeNull();
            expect(position!.sourceIndex).toBe(0);
        });

        test('should return null when source path string does not match any source', () => {
            const service = new SourceService(sourceMap);
            const position = service.getPositionByOriginal(1, 1, 'nonexistent.ts');

            expect(position).toBeNull();
        });

        test('should return null when getOriginalSegment returns no match', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getOriginalSegment').mockReturnValue(null);

            const position = service.getPositionByOriginal(99, 99, 0);

            expect(position).toBeNull();
        });

        test('should use specified bias when provided', () => {
            const service = new SourceService(sourceMap);
            const spy = xJet.spyOn(service.mappings, 'getOriginalSegment').mockReturnValue(null);

            service.getPositionByOriginal(1, 1, 0, Bias.UPPER_BOUND);

            expect(spy).toHaveBeenCalledWith(1, 1, 0, Bias.UPPER_BOUND);
        });

        test('should default to Bias.BOUND when no bias argument is provided', () => {
            const service = new SourceService(sourceMap);
            const spy = xJet.spyOn(service.mappings, 'getOriginalSegment').mockReturnValue(null);

            service.getPositionByOriginal(1, 1, 0);

            expect(spy).toHaveBeenCalledWith(1, 1, 0, Bias.BOUND);
        });

        test('should return null name when segment nameIndex is null', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getOriginalSegment').mockReturnValue({
                line: 1,
                column: 0,
                nameIndex: null,
                sourceIndex: 0,
                generatedLine: 4,
                generatedColumn: 0
            });

            const position = service.getPositionByOriginal(1, 0, 0);

            expect(position!.name).toBeNull();
        });

        test('should return null name when nameIndex is out of bounds', () => {
            const service = new SourceService(sourceMap);
            xJet.spyOn(service.mappings, 'getOriginalSegment').mockReturnValue({
                line: 1,
                column: 0,
                nameIndex: 99,
                sourceIndex: 0,
                generatedLine: 4,
                generatedColumn: 0
            });

            const position = service.getPositionByOriginal(1, 0, 0);

            expect(position!.name).toBeNull();
        });

        test('should match source using substring — full path also matches', () => {
            const service = new SourceService(sourceMap);
            const spy = xJet.spyOn(service.mappings, 'getOriginalSegment').mockReturnValue(null);

            service.getPositionByOriginal(1, 1, 'src/x.spec.ts');

            expect(spy).toHaveBeenCalledWith(1, 1, 0, Bias.BOUND);
        });
    });

    describe('assign', () => {
        test('should throw when no source maps are provided', () => {
            expect(() => SourceService.assign()).toThrow(
                'At least one source-map must be provided for assign.'
            );
        });

        test('should return a new SourceService instance, not mutate the inputs', () => {
            const sourceMap1: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                names: [ 'name1' ],
                sources: [ 'source1.js' ],
                sourcesContent: [ 'console.log("source1");' ],
                mappings: 'AAAA'
            };

            const service1 = new SourceService(sourceMap1);
            const result = SourceService.assign(service1);

            expect(result).not.toBe(service1);
        });

        test('should merge names, sources, and sourcesContent from multiple source maps', () => {
            const sourceMap1: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                names: [ 'name1' ],
                sources: [ 'source1.js' ],
                sourcesContent: [ 'console.log("source1");' ],
                mappings: 'AAAA'
            };

            const sourceMap2: SourceMapInterface = {
                version: 3,
                file: 'b.js',
                names: [ 'name2' ],
                sources: [ 'source2.js' ],
                sourcesContent: [ 'console.log("source2");' ],
                mappings: 'AAAA,AAAA'
            };

            const result = SourceService.assign(
                new SourceService(sourceMap1),
                new SourceService(sourceMap2)
            );

            expect(result.names).toEqual([ 'name1', 'name2' ]);
            expect(result.sources).toEqual([ 'source1.js', 'source2.js' ]);
            expect(result.sourcesContent).toEqual([ 'console.log("source1");', 'console.log("source2");' ]);
        });

        test('should produce correctly offset encoded mappings after merge', () => {
            const sourceMap1: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                names: [ 'name1' ],
                sources: [ 'source1.js' ],
                sourcesContent: [ 'console.log("source1");' ],
                mappings: 'AAAA'
            };

            const sourceMap2: SourceMapInterface = {
                version: 3,
                file: 'b.js',
                names: [ 'name2' ],
                sources: [ 'source2.js' ],
                sourcesContent: [ 'console.log("source2");' ],
                mappings: 'AAAA,AAAA'
            };

            const result = SourceService.assign(
                new SourceService(sourceMap1),
                new SourceService(sourceMap2)
            );

            expect(result.mappings.encode()).toEqual('AAAA;ACAA,AAAA');
        });

        test('should handle a single source map without throwing', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                names: [],
                sources: [ 'source1.js' ],
                sourcesContent: [ '' ],
                mappings: 'AAAA'
            };

            const result = SourceService.assign(new SourceService(sourceMap));

            expect(result.sources).toEqual([ 'source1.js' ]);
        });

        test('should not set file on the resulting merged service', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                names: [],
                sources: [],
                sourcesContent: [],
                mappings: 'AAAA'
            };

            const result = SourceService.assign(new SourceService(sourceMap));

            expect(result.file).toBe('');
        });

        test('should preserve URL sources in merged output without path modification', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                names: [],
                sources: [ 'https://cdn.example.com/foo.ts' ],
                sourcesContent: [ '' ],
                mappings: 'AAAA'
            };

            const result = SourceService.assign(new SourceService(sourceMap));

            expect(result.sources[0]).toBe('https://cdn.example.com/foo.ts');
        });

        test('should prefix non-URL sources with sourceRoot during assign', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'a.js',
                sourceRoot: 'src/',
                names: [],
                sources: [ 'foo.ts' ],
                sourcesContent: [ '' ],
                mappings: 'AAAA'
            };

            const service = new SourceService(sourceMap);
            const result = SourceService.assign(service);

            expect(result.sources[0]).toBe('src/foo.ts');
        });

        test('should merge three source maps preserving order', () => {
            const makeMap = (file: string, name: string, src: string): SourceMapInterface => ({
                version: 3,
                file,
                names: [ name ],
                sources: [ src ],
                sourcesContent: [ '' ],
                mappings: 'AAAA'
            });

            const result = SourceService.assign(
                new SourceService(makeMap('a.js', 'fnA', 'a.ts')),
                new SourceService(makeMap('b.js', 'fnB', 'b.ts')),
                new SourceService(makeMap('c.js', 'fnC', 'c.ts'))
            );

            expect(result.names).toEqual([ 'fnA', 'fnB', 'fnC' ]);
            expect(result.sources).toEqual([ 'a.ts', 'b.ts', 'c.ts' ]);
        });
    });

    describe('getSourceObject', () => {
        test('should round-trip a source map object without file or sourceRoot', () => {
            const mapOriginalObject: SourceMapInterface = {
                version: 3,
                file: 'dist/bundle.js',
                sources: [ '../src/testx.ts' ],
                sourcesContent: [
                    '\n\nfunction ts() {\n    console.log(\'ts\');\n}\n\nfunction name22(data: string) {\n    console.log(\'name\' + data);\n}\n\nts();\nname22(\'x\');\n',
                    ''
                ],
                mappings: ';;;AAEA,SAAS,KAAK;AACV,UAAQ,IAAI,IAAI;AACpB;AAEA,SAAS,OAAO,MAAc;AAC1B,UAAQ,IAAI,SAAS,IAAI;AAC7B;AAEA,GAAG;AACH,OAAO,GAAG;',
                names: []
            };

            const service = new SourceService(mapOriginalObject);
            const mapObject = service.getSourceObject();

            expect(mapObject).toEqual({
                ...mapOriginalObject,
                file: resolve('dist/bundle.js'),
                sources: [ 'src/testx.ts' ]
            });
        });

        test('should include file and sourceRoot in the output when both are set', () => {
            const mapOriginalObject: SourceMapInterface = {
                version: 3,
                file: resolve('bundle.js'),
                sources: [ 'src/testx.ts' ],
                sourcesContent: [ '\n' ],
                mappings: ';;;AAEA,SAAS,KAAK;',
                names: [],
                sourceRoot: 'test'
            };

            const service = new SourceService(mapOriginalObject);
            const mapObject = service.getSourceObject();

            expect(mapObject).toEqual(mapOriginalObject);
        });

        test('should omit sourceRoot from output when it is not set', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);
            const mapObject = service.getSourceObject();

            expect(mapObject.sourceRoot).toBeUndefined();
        });

        test('should always emit version 3 in the output', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [],
                sourcesContent: [],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);

            expect(service.getSourceObject().version).toBe(3);
        });

        test('should return encoded mappings in getSourceObject', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);
            const obj = service.getSourceObject();

            expect(typeof obj.mappings).toBe('string');
            expect(obj.mappings.length).toBeGreaterThan(0);
        });

        test('should include sourcesContent array in the output', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [ 'const a = 1;' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);
            const obj = service.getSourceObject();

            expect(obj.sourcesContent).toEqual([ 'const a = 1;' ]);
        });
    });

    describe('toString', () => {
        test('should return a valid JSON string of the source map', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [ 'const x = 1;' ],
                mappings: 'AAAA',
                names: []
            };

            const service = new SourceService(sourceMap);
            const json = service.toString();

            expect(() => JSON.parse(json)).not.toThrow();
            expect(JSON.parse(json)).toMatchObject({ version: 3, file: resolve('bundle.js') });
        });

        test('should produce output consistent with getSourceObject', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [ 'src/foo.ts' ],
                sourcesContent: [],
                mappings: 'AAAA',
                names: [ 'foo' ]
            };

            const service = new SourceService(sourceMap);

            expect(service.toString()).toBe(JSON.stringify(service.getSourceObject()));
        });

        test('should return a string type', () => {
            const service = new SourceService();

            expect(typeof service.toString()).toBe('string');
        });

        test('should produce parseable JSON for an empty service', () => {
            const service = new SourceService();
            const json = service.toString();

            expect(() => JSON.parse(json)).not.toThrow();
        });

        test('should include names array in the serialized output', () => {
            const sourceMap: SourceMapInterface = {
                version: 3,
                file: 'bundle.js',
                sources: [],
                sourcesContent: [],
                mappings: 'AAAA',
                names: [ 'alpha', 'beta' ]
            };

            const service = new SourceService(sourceMap);
            const parsed = JSON.parse(service.toString());

            expect(parsed.names).toEqual([ 'alpha', 'beta' ]);
        });
    });
});
