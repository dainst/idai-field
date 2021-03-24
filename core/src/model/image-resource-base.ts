import {ImageGeoreference} from './image-georeference';

export interface ImageResourceBase {

    identifier: string;
    shortDescription: string;

    originalFilename: string;
    width: number;
    height: number;
    georeference?: ImageGeoreference;
}