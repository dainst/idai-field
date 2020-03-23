import {isUndefined, flow, cond, on, assoc, to, map, Mapping, values, flatten} from 'tsfun';
import {CategoryDefinition} from './category-definition';
import {FieldDefinition} from './field-definition';
import {clone} from '../../util/object-util';
import {Group, Groups} from './group';


export interface Category {

    children: Array<Category>;
    parentCategory: Category|undefined; //  = undefined;
    isAbstract: boolean;
    name: string;
    label: string;
    description: {[language: string]: string};
    color: string|undefined;
    groups: Array<Group>;
    mustLieWithin: boolean|undefined; // = undefined;
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
    export const NAME = 'name';
    export const DESCRIPTION = 'description';
    export const GROUPS = 'groups';


    export function build(definition: CategoryDefinition): Category { // TODO make private, hide behind makeCategoriesMap

        const category: any = {};
        category.mustLieWithin = definition.mustLieWithin;
        category.name = definition.name;
        category.label = definition.label || category.name;
        category.description = category.description;
        category['fields'] = definition.fields || []; // TODO remove after construction
        category.groups = [];
        category.isAbstract = definition.abstract || false;
        category.color = definition.color ?? generateColorForCategory(definition.name);
        category.children = [];
        return category as Category;
    }


    export function getFields(category: Category): Array<FieldDefinition> {

        return flow(
            category.groups,
            values,
            map(to(Group.FIELDS)),
            flatten);
    }


    export function makeChildFields(category: Category, child: Category): Array<FieldDefinition> {

        try {
            const childFields = ifUndefinedSetGroupTo(Groups.CHILD)((child as any)['fields']);
            return getCombinedFields((category as any)['fields'], childFields);
        } catch (e) {
            e.push(category.name);
            e.push(child.name);
            throw [e];
        }
    }


    export function ifUndefinedSetGroupTo(name: string): Mapping<Array<FieldDefinition>> {

        return map(
            cond(
                on(FieldDefinition.GROUP, isUndefined),
                assoc(FieldDefinition.GROUP, name)
            )
        ) as any;
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


    export function isBrightColor(color: string): boolean {

        color = color.substring(1); // strip #
        let rgb = parseInt(color, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma > 200;
    }


    function getCombinedFields(parentFields: Array<FieldDefinition>, childFields: Array<FieldDefinition>) {

        const fields: Array<FieldDefinition> = clone(parentFields);

        childFields.forEach(childField => {
            const field: FieldDefinition|undefined
                = fields.find(field => field.name === childField.name);

            if (field) {
                if (field.name !== 'campaign') {
                    throw ['tried to overwrite field of parent category', field.name];
                }
            } else {
                fields.push(childField);
            }
        });

        return fields;
    }


    function generateColorForCategory(categoryName: string): string {

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