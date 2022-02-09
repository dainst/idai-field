import { ImageGeoreference } from './image-georeference';


export interface ImageResourceBase {

    identifier: string;
    originalFilename: string;
    width: number;
    height: number;
    georeference?: ImageGeoreference;
}
