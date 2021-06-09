import {Resource} from './resource';
import {FieldGeometry} from './field-geometry';
import {FieldRelations} from './field-relations';


export interface FieldResource extends Resource {

    shortDescription: string;
    geometry?: FieldGeometry;
    relations: FieldRelations;
}


export module FieldResource {

    export const SHORTDESCRIPTION = 'shortDescription';
    export const GEOMETRY = 'geometry';
    export const RELATIONS = 'relations';
}
