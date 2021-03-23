import {Resource} from 'idai-components-2';
import {FieldGeometry} from './field-geometry';
import {FieldRelations} from './field-relations';


export interface FieldResource extends Resource {

    identifier: string;
    shortDescription: string;
    geometry?: FieldGeometry;
    relations: FieldRelations;
}


export module FieldResource {

    export const IDENTIFIER = 'identifier';
    export const SHORTDESCRIPTION = 'shortDescription';
    export const GEOMETRY = 'geometry';
    export const RELATIONS = 'relations';
}
