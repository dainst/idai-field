import {FieldDefinition} from './field-definition';
import {Named} from '../../util/named';

export module Groups {

    export const STEM = 'stem';
    export const DIMENSION = 'dimension';
    export const TIME = 'time';
    export const POSITION = 'position';
    export const IDENTIFICATION = 'identification';
    export const PROPERTIES = 'properties';
    export const PARENT = 'parent';
    export const CHILD = 'child';
}


export const DEFAULT_GROUP_ORDER = [
    'stem',
    'identification',
    'parent',
    'child',
    'dimension',
    'position',
    'time'
];


export interface Group extends Named {

    fields: Array<FieldDefinition>;
    label: string;
    // TODO add relations, more fields?
}


export interface EditFormGroup extends Group { // TODO review

    relations: any[];
    widget: string|undefined;
}


export module Group {

    export const FIELDS = 'fields';
    export const LABEL = 'label';
}