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
import { Hierarchy, Labels } from '../services';
import { I18N } from './i18n';
import { Composite } from '../model';
import { StringUtils } from './string-utils';
import { ValuelistUtil } from './valuelist-util';


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
    valuelist?: Valuelist;
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
        
        return createFieldsViewGroups(
            projectConfiguration.getCategory(resource.category).groups, resource,
            projectConfiguration, relationTargets, labels, datastore
        );
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
        } else if (field?.definition?.inputType === Field.InputType.DIMENSION && field.valuelist) {
            return object.label ?? Dimension.generateLabel(
                object,
                formatDecimal,
                getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value),
                labels.getValueLabel(field.valuelist, object.measurementPosition)
            );
        } else if (field?.definition?.inputType === Field.InputType.LITERATURE) {
            return Literature.generateLabel(
                object, getTranslation
            );
        } else if (field?.definition?.inputType === Field.InputType.DROPDOWNRANGE) {
            return OptionalRange.generateLabel(
                object,
                getTranslation,
                (value: string) => labels.getValueLabel(field.valuelist, value)
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


    export async function makeField(field: Field, fieldContent: any, resource: Resource,
                                    projectConfiguration: ProjectConfiguration, relationTargets: Map<Array<Document>>,
                                    labels: Labels, datastore: Datastore): Promise<FieldsViewField> {
        
        const valuelist: Valuelist = ValuelistUtil.getValuelist(
            field,
            await datastore.get('project'),
            await Hierarchy.getParentResource(datastore.get, resource)
        );

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
                    value: getFieldValue(fieldContent, field, valuelist, labels, projectConfiguration),
                    type: getFieldType(field.inputType),
                    valuelist,
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


function getFieldValue(fieldContent: any, field: Field, valuelist: Valuelist, labels: Labels,
                       projectConfiguration: ProjectConfiguration): any {

    if (isArray(fieldContent)) {
        return getArrayFieldValue(fieldContent, field, valuelist, labels);
    } else {
        return field.name === Resource.CATEGORY
            ? labels.get(projectConfiguration.getCategory(fieldContent))
            : getValue(fieldContent, labels, valuelist);
    }
}


function getArrayFieldValue(fieldContent: any, field: Field, valuelist: Valuelist, labels: Labels) {

    const entries: any[] = field.inputType === Field.InputType.CHECKBOXES
            && fieldContent.every(entry => isString(entry))
        ? getSortedValues(fieldContent, valuelist, labels)
        : fieldContent;

    return entries.map((entryContent: any) =>
        field.subfields && isObject(entryContent)
            ? getCompositeFieldValue(entryContent, labels, field.subfields)
            : getValue(entryContent, labels, valuelist)
    );
}


function getSortedValues(values: string[], valuelist: Valuelist, labels: Labels): string[] {

    const order: string[] = labels.orderKeysByLabels(valuelist);

    return values.slice().sort((valueA: string, valueB: string) => {
        return order.indexOf(valueA) - order.indexOf(valueB);
    });
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


async function createFieldsViewGroups(groups: Array<Group>, resource: Resource,
                                      projectConfiguration: ProjectConfiguration,
                                      relationTargets: Map<Array<Document>>, labels: Labels,
                                      datastore: Datastore): Promise<Array<FieldsViewGroup>> {

    const result: Array<FieldsViewGroup> = [];

    for (let group of groups) {
        const fieldsViewGroup: FieldsViewGroup = await createFieldsViewGroup(
            group, resource, projectConfiguration, relationTargets, labels, datastore
        );
        if (fieldsViewGroup.fields.length) result.push(fieldsViewGroup);
    }

    return result;
}


async function createFieldsViewGroup(group: Group, resource: Resource, projectConfiguration: ProjectConfiguration,
                                     relationTargets: Map<Array<Document>>, labels: Labels, datastore: Datastore) {

    const fields: Array<FieldsViewField> = [];
    
    for (let field of group.fields) {
        if (!field.visible) continue;
        const fieldContent: any = getFieldContent(resource, field.name);
        if ((fieldContent !== undefined && fieldContent !== '')
                || field.inputType === Field.InputType.DERIVED_RELATION) {
            fields.push(
                await FieldsViewUtil.makeField(
                    field, fieldContent, resource, projectConfiguration, relationTargets, labels, datastore
                )
            );
        }
    }

    return {
        name: group.name,
        label: group.label,
        defaultLabel: group.defaultLabel,
        fields: fields.filter(field => field !== undefined && (!field.targets || field.targets.length > 0))
    };
}


const getFieldContent = (resource: Resource, fieldName: string): any => {

    return resource[fieldName]
        ?? (resource.relations[fieldName] && resource.relations[fieldName].length > 0
            ? resource.relations[fieldName]
            : undefined
        );
}
