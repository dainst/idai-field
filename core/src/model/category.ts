import { flatten, flow, map, to } from 'tsfun';
import { I18nString } from './i18n-string';
import { Name, Named } from '../tools/named';
import { FieldDefinition } from './field-definition';
import { Group } from './group';
import { Labeled } from '../tools/labeled';


export interface Category extends Named {
    
    /**
     * Categories can have commmon semantics with regards
     * to their fields by being part of a groups of categories
     * grouped under one `categoryName`. Whithin such a group, a field
     * with any given name means always the same, wheter a concrete
     * category lists it or not. From this perspective, the different
     * categories sharing a common `categoryName` can be seen as different
     * (edit-)forms representing one and the same concept.
     */
    categoryName: Name;

    /* name: Name - given by `extends Named`
     * In a running application this coincides with `categoryName`. 
     * There it is a unique property because at most one category of 
     * a given name is "active".
     * 
     * In the configuration editor, however, where choices amongst
     * alternative categories can be made, the `name` is NOT the `categoryName`
     * but is instead made to coincide with the `libraryId`.
     */

    /**
     * For builtIn and library categories, the original identifier (possibly a map key).
     */
    libraryId?: string; 

    source?: 'builtin'|'library'|'custom';

    isAbstract: boolean;
    mustLieWithin: boolean|undefined; // = undefined;
    userDefinedSubcategoriesAllowed?: boolean
    mandatory?: boolean;

    children: Array<Category>;
    parentCategory: Category|undefined; //  = undefined;

    // Contents and Appearance
    
    groups: Array<Group>;
    
    label: I18nString;
    description: I18nString;
    defaultLabel?: I18nString;
    defaultDescription?: I18nString;

    color?: string;
    defaultColor?: string;
}


type Color = string;


/**
 * @author F.Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace Category {

    export const COLOR = 'color';
    export const PARENT_CATEGORY = 'parentCategory';
    export const DEFAULT_LABEL = 'defaultLabel';
    export const CHILDREN = 'children';
    export const DESCRIPTION = 'description';
    export const GROUPS = 'groups';


    export namespace Source {

        export const BUILTIN = 'builtin';
        export const LIBRARY = 'library';
        export const CUSTOM = 'custom';
    }


    export function build(name: Name, parentCategory?: Category): Category {

        const newCategory = {
            name: name,
            label: {},
            defaultLabel: {},
            description: {},
            defaultDescription: {},
        } as any /* TODO any */;

        if (parentCategory) newCategory[PARENT_CATEGORY] = parentCategory;
        return newCategory;
    }


    export function getFields(category: Category): Array<FieldDefinition> {

        return flow(
            category.groups,
            Object.values,
            map(to<Array<FieldDefinition>>(Group.FIELDS)),
            flatten()
        );
    }


    export function getLabel(fieldName: string, fields: Array<any>, languages: string[]): string {

        for (let field of fields) {
            if (field.name === fieldName) return Labeled.getLabel(field, languages);
        }
        return fieldName;
    }


    export function getNamesOfCategoryAndSubcategories(category: Category): string[] {

        return [category.name].concat(category.children.map(to(Named.NAME)));
    }


    export function isBrightColor(color: Color): boolean {

        color = color.substring(1); // strip #
        let rgb = parseInt(color, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma > 200;
    }


    export function generateColorForCategory(categoryName: string): Color {

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
