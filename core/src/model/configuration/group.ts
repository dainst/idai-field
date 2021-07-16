import { Named } from '../../tools/named';
import { I18N } from '../../tools/i18n';
import { Field } from './field';
import {Relation} from './relation';


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

        if (Relation.Hierarchy.ALL.includes(relationName)
                || Relation.Image.ALL.includes(relationName)) {
            return STEM;
        } else if (Relation.Time.ALL.includes(relationName)) {
            return TIME;
        } else if (Relation.Position.ALL.includes(relationName)) {
            return POSITION;
        } else if (Relation.Type.ALL.includes(relationName)) {
            return IDENTIFICATION;
        } else {
            return undefined;
        }
    }
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
