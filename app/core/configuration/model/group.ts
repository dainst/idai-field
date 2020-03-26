import {FieldDefinition} from './field-definition';
import {Named} from '../../util/named';
import {RelationDefinition} from './relation-definition';

export module Groups {

    export const STEM = 'stem';
    export const DIMENSION = 'dimension';
    export const TIME = 'time';
    export const POSITION = 'position';
    export const IDENTIFICATION = 'identification';
    export const PROPERTIES = 'properties';
    export const PARENT = 'parent';
    export const CHILD = 'child';

    export const DEFAULT_ORDER = [
        'stem',
        'identification',
        'parent',
        'child',
        'dimension',
        'position',
        'time'
    ];
}


export interface Group extends Named {

    fields: Array<FieldDefinition>;
    label: string;
    relations: Array<RelationDefinition>;
}


export module Group {

    export const FIELDS = 'fields';
    export const RELATIONS = 'relations';
    export const LABEL = 'label';


    export function create(name: string) {

        return { name: name, fields: [], relations: [], label: '' };
    }
}