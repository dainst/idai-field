import { Resource } from './resource';
import { FieldGeometry } from './field-geometry';
import { I18N } from '../../tools';


export module FieldRelations {

    export const __UNUSED__ = 0;
}


export interface FieldResource extends Resource {

    shortDescription: I18N.String|string;
    geometry?: FieldGeometry;
    relations: FieldResource.Relations;
    scanCode?: string;
}


export module FieldResource {

    export const SHORTDESCRIPTION = 'shortDescription';
    export const GEOMETRY = 'geometry';
    export const RELATIONS = 'relations';
    export const SCANCODE = 'scanCode';


    export interface Relations extends Resource.Relations {

        isRecordedIn: string[];
    }
}
