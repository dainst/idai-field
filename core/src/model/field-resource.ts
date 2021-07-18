import {Resource} from './resource';
import {FieldGeometry} from './field-geometry';





export module FieldRelations {
    export const __UNUSED__ = 0
}


export interface FieldResource extends Resource {

    shortDescription: string;
    geometry?: FieldGeometry;
    relations: FieldResource.Relations;
}


export module FieldResource {

    export const SHORTDESCRIPTION = 'shortDescription';
    export const GEOMETRY = 'geometry';
    export const RELATIONS = 'relations';

    export interface Relations extends Resource.Relations {

        isRecordedIn: string[];
    }
}
