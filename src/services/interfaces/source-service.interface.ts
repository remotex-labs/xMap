export interface SourceMapInterface {
    file?: string;
    names?: Array<string>;
    version: number;
    sources: Array<string>;
    mappings: string;
    sourceRoot?: string;
    sourcesContent?: Array<string>;
}
