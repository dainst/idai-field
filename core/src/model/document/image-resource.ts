import { ImageResourceBase } from './image-resource-base';
import { NewResource, Resource } from './resource';


export interface NewImageResource extends NewResource, ImageResourceBase {

    relations: ImageResource.Relations;
}


export interface ImageResource extends Resource, ImageResourceBase {

    relations: ImageResource.Relations;
}


export module ImageResource {

    export const GEOREFERENCE = 'georeference';
    export const ORIGINAL_FILENAME = 'originalFilename';

    export interface Relations extends Resource.Relations {

        depicts?: string[];
    }
}
