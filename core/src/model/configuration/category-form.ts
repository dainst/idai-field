import { filter, flow, values, is, isEmpty, not, on, to, flatMap, compose, map, any } from 'tsfun';
import { I18N } from '../../tools/i18n';
import { Name, Named } from '../../tools/named';
import { FieldResource } from '../field-resource';
import { Field } from './field';
import { Group, GroupDefinition } from './group';
import { Valuelist } from './valuelist';
import { ScanCodeConfiguration } from './scan-code-configuration';


export interface CategoryForm {

    name: string;

    /**
     * For builtIn and library categories, the original identifier (possibly a map key).
     */
    libraryId?: string;

    source?: 'builtin'|'library'|'custom';
    customFields?: string[];

    isAbstract: boolean;
    mustLieWithin: boolean|undefined; // = undefined;
    userDefinedSubcategoriesAllowed?: boolean
    required?: boolean;

    children: Array<CategoryForm>;
    parentCategory: CategoryForm|undefined; // = undefined;
    
    groups: Array<Group>;
    
    label: I18N.String;
    description: I18N.String;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
    categoryLabel: I18N.String;
    
    createdBy?: string,
    creationDate?: Date;
    references?: string[];

    color?: CategoryForm.Color; // TODO make sure it is always set and make non-optional
    defaultColor?: CategoryForm.Color;

    identifierPrefix?: string;
    resourceLimit?: number;
    scanCodes?: ScanCodeConfiguration;
}


/**
 * @author F.Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace CategoryForm {

    export type Color = string;

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


    export function build(name: Name, parentCategory?: CategoryForm): CategoryForm {

        const color: string = CategoryForm.generateColorForCategory(name);

        const newCategory = {
            name: name,
            label: {},
            defaultLabel: {},
            description: {},
            defaultDescription: {},
            color: color,
            defaultColor: color,
            source: Source.CUSTOM
        } as any /* TODO any */;

        if (parentCategory) {
            newCategory.parentCategory = parentCategory;
            newCategory.groups = parentCategory.groups;
        }

        return newCategory;
    }


    export function getFields(category: CategoryForm): Array<Field> {

        return flatMap(
            values(category.groups),
            Group.toFields
        );
    }


    export function getField(category: CategoryForm, fieldName: string): Field {

        return getFields(category)?.find(Named.onName(is(fieldName)));
    }


    export function getNamesOfCategoryAndSubcategories(category: CategoryForm): string[] {

        return [category.name].concat(category.children.map(to(Named.NAME)));
    }


    export function getTextColorForCategory(category: CategoryForm): string {

        return CategoryForm.isBrightColor(getColor(category)) ? '#000000' : '#ffffff';
    }


    function getColor(category: CategoryForm): string {

        return category.color ?? '#cccccc';
    }


    export function hasCustomFields(category: CategoryForm): boolean {
        
        return compose(
            CategoryForm.getFields,
            map(to(Field.SOURCE)),
            any(is(Field.Source.CUSTOM))
        )(category);
    }


    export function isMandatoryField(category: CategoryForm, fieldName: string): boolean {

        return hasProperty(category, fieldName, Field.MANDATORY);
    }


    export function getGroupsConfiguration(category: CategoryForm,
                                           permanentlyHiddenFields: string[]): Array<GroupDefinition> {

        return category.groups
            .reduce((result, group) => {
                result.push({
                    name: group.name,
                    fields: group.fields
                        .filter(field => !permanentlyHiddenFields.includes(field.name))
                        .map(field => field.name)
                });
                return result;
            }, []);
    }


    export function getShortDescriptionValuelist(category: CategoryForm): Valuelist|undefined {

        const fields: Array<Field> = CategoryForm.getFields(category);

        const shortDescriptionField: Field = fields.find(field => field.name === FieldResource.SHORTDESCRIPTION);
        return shortDescriptionField.valuelist;
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


    function hasProperty(category: CategoryForm, fieldName: string, propertyName: string) {

        return flow(
            CategoryForm.getFields(category),
            filter(on(Named.NAME, is(fieldName))),
            filter(on(propertyName, is(true))),
            not(isEmpty));
    }
}
