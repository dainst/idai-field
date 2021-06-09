import {ImageGeoreference} from './image-georeference';

export interface ImageResourceBase {

    shortDescription: string;

    originalFilename: string;
    width: number;
    height: number;
    georeference?: ImageGeoreference;
}