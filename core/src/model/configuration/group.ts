import { Named } from '../../tools/named';
import { I18N } from '../../tools/i18n';
import { Field } from './field';


export interface GroupDefinition {

    name: string;
    fields: string[];
}


export module Groups {

    export const STEM = 'stem';
    export const DIMENSION = 'dimension';
    export const TIME = 'time';
    export const POSITION = 'position';
    export const IDENTIFICATION = 'identification';
    export const INVENTORY = 'inventory';
    export const PROPERTIES = 'properties';
    export const HIERARCHY = 'hierarchy';
    export const STRATIGRAPHY = 'stratigraphy';
    export const OTHER = 'other';
}


export interface Group extends BaseGroup {

    fields: Array<Field>;
}


export interface BaseGroup extends Named, I18N.Labeled {

    fields: Array<any>;
    defaultLabel?: I18N.String;
}


export module Group {

    export const FIELDS = 'fields';

    
    export function create(name: string) {

        return { name: name, fields: [] };
    }


    export function toFields(group: Group) {

        return group.fields;
    }
}
