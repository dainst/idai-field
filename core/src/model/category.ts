import {flatten, flow, map, to} from 'tsfun';
import { Named } from '../tools/named';
import { FieldDefinition } from './field-definition';
import {Group} from './group';


export interface Category extends Named {

    children: Array<Category>;
    parentCategory: Category|undefined; //  = undefined;
    isAbstract: boolean;
    label: string;
    description: { [language: string]: string };
    color: string|undefined;
    groups: Array<Group>;
    mustLieWithin: boolean|undefined; // = undefined;
    libraryId?: string;
}


/**
 * @author F.Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module Category {

    export const COLOR = 'color';
    export const PARENT_CATEGORY = 'parentCategory';
    export const CHILDREN = 'children';
    export const DESCRIPTION = 'description';
    export const GROUPS = 'groups';


    export function getFields(category: Category): Array<FieldDefinition> {

        return flow(
            category.groups,
            Object.values,
            map(to<Array<FieldDefinition>>(Group.FIELDS)),
            flatten()
        );
    }


    export function getLabel(fieldName: string, fields: Array<any>): string {

        for (let field of fields) {
            if (field.name === fieldName) {
                return field.label
                    ? field.label
                    : fieldName;
            }
        }
        return fieldName;
    }


    export function getNamesOfCategoryAndSubcategories(category: Category): string[] {

        return [category.name].concat(category.children.map(to(Named.NAME)));
    }


    export function isBrightColor(color: string): boolean {

        color = color.substring(1); // strip #
        let rgb = parseInt(color, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma > 200;
    }


    export function generateColorForCategory(categoryName: string): string {

        const hash = hashCode(categoryName);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        return '#' + ('0' + r.toString(16)).substr(-2)
            + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
    }


    function hashCode(string: any): number {

        let hash = 0, i, chr;
        if (string.length === 0) return hash;
        for (i = 0; i < string.length; i++) {
            chr   = string.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
}
