// /**
//  * Export interfaces
//  */
//
// export type * from '@services/interfaces/source-service.interface';
// export type * from '@services/interfaces/mapping-service.interface';
// export type * from '@components/interfaces/segment-component.interface';
//
// /**
//  * Export components
//  */
//
// export * from '@components/path.component';
// export * from '@components/base64.component';
// export * from '@components/segment.component';
//
// /**
//  * Export services
//  */
//
// export * from '@services/source.service';


import { readFileSync } from 'fs';
import { SourceService } from '@services/source.service';

const u = new SourceService(readFileSync('src/index.js.map', 'utf8'));

