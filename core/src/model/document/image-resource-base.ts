import { ImageGeoreference } from './image-georeference';


export interface ImageResourceBase {
    
    originalFilename: string;
    width: number;
    height: number;
    georeference?: ImageGeoreference;
}
