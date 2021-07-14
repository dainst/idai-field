import { Named } from '../tools/named';
import { I18N, I18nString } from '../tools/i18n';
import { FieldDefinition } from './field-definition';
import { Relations } from './relations';


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
    export const PROPERTIES = 'properties';
    export const PARENT = 'parent';
    export const CHILD = 'child';
    export const HIDDEN_CORE_FIELDS = '_hiddenCoreFields';
    

    export function getGroupNameForRelation(relationName: string): string|undefined {

        if (Relations.Hierarchy.ALL.includes(relationName)
                || Relations.Image.ALL.includes(relationName)) {
            return STEM;
        } else if (Relations.Time.ALL.includes(relationName)) {
            return TIME;
        } else if (Relations.Position.ALL.includes(relationName)) {
            return POSITION;
        } else if (Relations.Type.ALL.includes(relationName)) {
            return IDENTIFICATION;
        } else {
            return undefined;
        }
    }
}


export interface Group extends BaseGroup {

    fields: Array<FieldDefinition>;
}


export interface BaseGroup extends Named, I18N.Labeled {

    fields: Array<any>;
    defaultLabel?: I18nString;
}


export module Group {

    export const FIELDS = 'fields';

    export function create(name: string) {

        return { name: name, fields: [] };
    }
}
