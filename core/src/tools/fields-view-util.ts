import { aFlow, is, isArray, isObject, isString, Map, Mapping, on } from 'tsfun';
import { ProjectConfiguration } from '../services/project-configuration';
import { Datastore } from '../datastore/datastore';
import { Dating } from '../model/dating';
import { Dimension } from '../model/dimension';
import { Document } from '../model/document';
import { BaseGroup, Group } from '../model/configuration/group';
import { Literature } from '../model/literature';
import { OptionalRange } from '../model/optional-range';
import { Resource } from '../model/resource';
import { Valuelist } from '../model/configuration/valuelist';
import { CategoryForm } from '../model/configuration/category-form';
import { BaseField, Field, Subfield } from '../model/configuration/field';
import { Constraints } from '../model/query';
import { Named } from './named';
import { Labels } from '../services';
import { I18N } from './i18n';
import { Composite } from '../model';
import { StringUtils } from './string-utils';


export interface FieldsViewGroup extends BaseGroup {

    fields: Array<FieldsViewField>;
}


export interface FieldsViewField extends FieldsViewSubfield {

    value?: any;
    targets?: Array<Document>;
    subfields?: Array<FieldsViewSubfield>;
}


export interface FieldsViewSubfield {

    definition: BaseField,
    label: string;
    type: FieldsViewFieldType;
}


export type FieldsViewFieldType = 'default'|'relation'|'url'|'composite';


export module FieldsViewGroup {

    export const RELATIONS = 'relations';
    export const FIELDS = 'fields';
}


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export module FieldsViewUtil {


    export async function getGroupsForResource(resource: Resource, projectConfiguration: ProjectConfiguration,
                                               datastore: Datastore, labels: Labels): Promise<Array<FieldsViewGroup>> {

        const relationTargets: Map<Array<Document>> = await Resource.getRelationTargetDocuments(resource, datastore);
        await addDerivedRelationTargetDocuments(relationTargets, projectConfiguration, resource, datastore);

        const result = await aFlow(
            projectConfiguration.getCategory(resource.category).groups,
            createFieldsViewGroups(resource, projectConfiguration, relationTargets, labels)
        );

        return result; 
    }


    export function getLabel(field: FieldsViewSubfield, fieldContent: any, labels: Labels,
                             getTranslation: (key: string) => string, formatDecimal: (value: number) => string) {

        const entries: any = isArray(fieldContent) ? fieldContent : [fieldContent];

        return entries.map(entry => {
            if (isObject(entry)) {
                return FieldsViewUtil.getObjectLabel(
                    entry,
                    field,
                    getTranslation,
                    formatDecimal,
                    labels
                );
            } else {
                return entry;
            }
        }).join(', ');
    }


    export function getObjectLabel(object: any,  field: FieldsViewSubfield, getTranslation: (key: string) => string,
                                   formatDecimal: (value: number) => string, labels: Labels): string|null {

        if (field?.definition?.inputType === Field.InputType.DATING) {
            return object.label ?? Dating.generateLabel(
                object,
                getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value)
            );
        } else if (field?.definition?.inputType === Field.InputType.DIMENSION && field?.definition?.valuelist) {
            return object.label ?? Dimension.generateLabel(
                object,
                formatDecimal,
                getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value),
                labels.getValueLabel(field.definition.valuelist, object.measurementPosition)
            );
        } else if (field?.definition?.inputType === Field.InputType.LITERATURE) {
            return Literature.generateLabel(
                object, getTranslation
            );
        } else if (field?.definition?.inputType === Field.InputType.DROPDOWNRANGE) {
            return OptionalRange.generateLabel(
                object,
                getTranslation,
                (value: string) => labels.getValueLabel(field.definition.valuelist, value)
            );
        } else if (field?.definition?.inputType === Field.InputType.COMPOSITE) {
            return Composite.generateLabel(
                object,
                (field.definition as Field).subfields,
                getTranslation,
                (labeledValue: I18N.LabeledValue) => labels.get(labeledValue),
                (value: I18N.String|string) => labels.getFromI18NString(value),
                (valuelist: Valuelist, valueId: string) => labels.getValueLabel(valuelist, valueId)
            );
        } else {
            const result = labels.getFromI18NString(object);
            return result && isString(result)
                ? StringUtils.prepareStringForHTML(result)
                : JSON.stringify(object);
        }
    }


    export function makeField(field: Field, fieldContent: any, projectConfiguration: ProjectConfiguration,
                              relationTargets: Map<Array<Document>>, labels: Labels): FieldsViewField {

        switch (field.inputType) {
            case Field.InputType.RELATION:
            case Field.InputType.INSTANCE_OF:
            case Field.InputType.DERIVED_RELATION:
                return {
                    definition: field,
                    label: labels.get(field),
                    type: 'relation',
                    targets: relationTargets[field.name]
                };
            default:
                return {
                    definition: field,
                    label: labels.get(field),
                    value: getFieldValue(fieldContent, field, labels, projectConfiguration),
                    type: getFieldType(field.inputType),
                    subfields: makeSubfields(field.subfields, labels)
                };
        }
    }


    export function makeSubfields(subfields: Array<Subfield>, labels: Labels): Array<FieldsViewSubfield> {

        if (!subfields) return undefined;

        return subfields.map(subfield => {
            return {
                definition: subfield,
                label: labels.get(subfield),
                type: getFieldType(subfield.inputType),
            };
        });
    }
}


async function addDerivedRelationTargetDocuments(targetDocuments: Map<Array<Document>>,
                                                 projectConfiguration: ProjectConfiguration, resource: Resource,
                                                 datastore: Datastore): Promise<void> {

    const category: CategoryForm = projectConfiguration.getCategory(resource.category);
    const derivedRelationFields: Array<Field> = CategoryForm.getFields(category)
        .filter(field => field.inputType === Field.InputType.DERIVED_RELATION);

    for (let field of derivedRelationFields) {
        const constraints: Constraints = {};
        constraints[field.constraintName] = resource.id;
        targetDocuments[field.name] = (await datastore.find({ constraints })).documents;
    }
}


function getFieldValue(fieldContent: any, field: Field, labels: Labels,
                       projectConfiguration: ProjectConfiguration): any {

    return isArray(fieldContent)
        ? fieldContent.map((fieldContent: any) =>
            field.subfields && isObject(fieldContent)
                ? getCompositeFieldValue(fieldContent, labels, field.subfields)
                : getValue(fieldContent, labels, field.valuelist)
            
        )
        : field.name === Resource.CATEGORY
            ? labels.get(projectConfiguration.getCategory(fieldContent))
            : getValue(fieldContent, labels, field.valuelist);
}


function getFieldType(inputType: Field.InputType): FieldsViewFieldType {

    switch (inputType) {
        case Field.InputType.URL:
            return 'url';
        case Field.InputType.COMPOSITE:
            return 'composite';
        default:
            return 'default';
    }  
}


function getValue(fieldContent: any, labels: Labels, valuelist?: Valuelist): any {

    return valuelist
            ? labels.getValueLabel(valuelist, fieldContent)
            : isString(fieldContent)
                ? StringUtils.prepareStringForHTML(fieldContent)
                : fieldContent;
}


function getCompositeFieldValue(fieldContent: any, labels: Labels, subfields: Array<Subfield>): any {

    return Object.keys(fieldContent).reduce((result, subfieldName) => {
        const subfield: Subfield = subfields.find(on(Named.NAME, is(subfieldName)));
        const subfieldContent: any = fieldContent[subfieldName];

        result[subfieldName] = isArray(subfieldContent)
            ? subfieldContent.map(element => getValue(element, labels, subfield?.valuelist))
            : getValue(subfieldContent, labels, subfield?.valuelist)

        return result;
    }, {});
}


function createFieldsViewGroups(resource: Resource, projectConfiguration: ProjectConfiguration,
                                relationTargets: Map<Array<Document>>, labels: Labels): Mapping {

    return function(groups: Array<Group>) {

        return groups.map(group => {
            return createFieldsViewGroup(group, resource, projectConfiguration, relationTargets, labels);
        }).filter(group => group.fields.length);
    };
}


function createFieldsViewGroup(group: Group, resource: Resource, projectConfiguration: ProjectConfiguration,
                               relationTargets: Map<Array<Document>>, labels: Labels) {

    const fields: Array<FieldsViewField> = group.fields
        .filter(field => field.visible)
        .map(field => {
            const fieldContent: any = getFieldContent(resource, field.name);
            if ((fieldContent !== undefined && fieldContent !== '')
                    || field.inputType === Field.InputType.DERIVED_RELATION) {
                return FieldsViewUtil.makeField(
                    field, fieldContent, projectConfiguration, relationTargets, labels
                );
            }
        }).filter(field => field !== undefined && (!field.targets || field.targets.length > 0));

    return {
        name: group.name,
        label: group.label,
        defaultLabel: group.defaultLabel,
        fields
    };
}


const getFieldContent = (resource: Resource, fieldName: string): any => {

    return resource[fieldName]
        ?? (resource.relations[fieldName] && resource.relations[fieldName].length > 0
            ? resource.relations[fieldName]
            : undefined
        );
}
