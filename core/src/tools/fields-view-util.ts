import { aFlow, assoc, compose, isEmpty, filter, flatten, is, isArray, isDefined, isObject, isString,
    L, map, Map, Mapping, on, pairWith, Predicate, R, to, not } from 'tsfun';
import { ProjectConfiguration } from '../services/project-configuration';
import { Datastore } from '../datastore/datastore';
import { Dating } from '../model/dating';
import { Dimension } from '../model/dimension';
import { Document } from '../model/document';
import { BaseGroup, Group, Groups } from '../model/configuration/group';
import { Literature } from '../model/literature';
import { OptionalRange } from '../model/optional-range';
import { Resource } from '../model/resource';
import { Valuelist } from '../model/configuration/valuelist';
import { Field, Subfield } from '../model/configuration/field';
import { Named } from './named';
import { Labels } from '../services';
import { I18N } from './i18n';
import { Complex } from '../model/complex';


type FieldContent = any;


export interface FieldsViewGroup extends BaseGroup {

    fields: Array<FieldsViewField>;
}


export interface FieldsViewField {

    name: string;
    label: string;
    type: 'default'|'array'|'object'|'relation'|'url';
    value?: any;
    valuelist?: Valuelist;
    targets?: Array<Document>;
    subfields?: Array<Subfield>;
}


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

    export const isVisibleField: Predicate<Field> = on(Field.VISIBLE, is(true));


    export const shouldBeDisplayed: Predicate<FieldsViewGroup> =
        on(FieldsViewGroup.FIELDS, not(isEmpty));


    export async function getGroupsForResource(resource: Resource,
                                               projectConfiguration: ProjectConfiguration,
                                               datastore: Datastore,
                                               labels: Labels,
                                               presentInInverseRelationLabel?: string): Promise<Array<FieldsViewGroup>> {

        const relationTargets: Map<Array<Document>> = await Resource.getRelationTargetDocuments(resource, datastore);

        const result = await aFlow(
            projectConfiguration.getCategory(resource.category).groups,
            putActualResourceFieldsIntoGroups(resource, projectConfiguration, relationTargets, labels),
            filter(shouldBeDisplayed)
        );

        if (presentInInverseRelationLabel) {
            await addPresentInInverseRelation(result, resource, datastore, presentInInverseRelationLabel);
        }
        return result; 
    }


    export function getObjectLabel(object: any, 
                                   field: FieldsViewField,
                                   getTranslation: (key: string) => string,
                                   formatDecimal: (value: number) => string,
                                   labels: Labels): string|null {

        if (field.subfields) {
            return Complex.generateLabel(
                object,
                field.subfields,
                getTranslation,
                (labeledValue: I18N.LabeledValue) => labels.get(labeledValue),
                (value: I18N.String|string) => labels.getFromI18NString(value),
                (valuelist: Valuelist, valueId: string) => labels.getValueLabel(valuelist, valueId)
            );
        } else if (object.label) {
            return object.label;
        } else if (object.begin || object.end) {
            return Dating.generateLabel(
                object,
                getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value)
            );
        } else if (object.inputUnit) {
            return Dimension.generateLabel(
                object,
                formatDecimal,
                getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value),
                labels.getValueLabel(field.valuelist, object.measurementPosition)
            );
        } else if (object.quotation) {
            return Literature.generateLabel(
                object, getTranslation
            );
        } else if (object.value) {
            return OptionalRange.generateLabel(
                object,
                getTranslation,
                (value: string) => labels.getValueLabel(field.valuelist, value)
            );
        } else {
            const result = labels.getFromI18NString(object);
            return result && isString(result)
                ? prepareString(result)
                : JSON.stringify(object);
        }
    }


    export function makeField(projectConfiguration: ProjectConfiguration, 
                              relationTargets: Map<Array<Document>>,
                              labels: Labels) {

        return function([field, fieldContent]: [Field, FieldContent]): FieldsViewField {

            return (field.inputType === Field.InputType.RELATION
                    || field.inputType === Field.InputType.INSTANCE_OF)
                ? {
                    name: field.name,
                    label: labels.get(field),
                    type: 'relation',
                    targets: relationTargets[field.name]
                }
                : {
                    name: field.name,
                    label: labels.get(field),
                    value: isArray(fieldContent)
                        ? fieldContent.map((fieldContent: any) =>
                            getValue(
                                fieldContent, field.name, projectConfiguration, labels, field.valuelist
                            )
                        )
                        : getValue(
                            fieldContent, field.name, projectConfiguration, labels, field.valuelist
                        ),
                    type: field.inputType === Field.InputType.URL ? 'url' :
                        isArray(fieldContent) ? 'array' :
                        isObject(fieldContent) ? 'object' :
                        'default',
                    valuelist: field.valuelist,
                    subfields: field.subfields
                };
        }
    } 
}


function getValue(fieldContent: any,
                  fieldName: string, 
                  projectConfiguration: ProjectConfiguration,
                  labels: Labels,
                  valuelist?: Valuelist): any {

    return fieldName === Resource.CATEGORY
        ? labels.get(projectConfiguration.getCategory(fieldContent))
        : valuelist
            ? labels.getValueLabel(valuelist, fieldContent)
            : isString(fieldContent)
                ? prepareString(fieldContent)
                : fieldContent;
}


function prepareString(stringValue: string): string {

    return stringValue
        .replace(/^\s+|\s+$/g, '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}


function putActualResourceFieldsIntoGroups(resource: Resource, projectConfiguration: ProjectConfiguration,
                                           relationTargets: Map<Array<Document>>,
                                           labels: Labels): Mapping {

    const fieldContent: Mapping<Field, FieldContent>
        = compose(to(Named.NAME), getFieldContent(resource));

    return map(
        assoc(Group.FIELDS,
            compose(
                map(pairWith(fieldContent)),
                filter(on(R, value => isDefined(value) && value !== '')),
                filter(on(L, FieldsViewUtil.isVisibleField)),
                map(FieldsViewUtil.makeField(projectConfiguration, relationTargets, labels)),
                filter(field => !field.targets || field.targets.length > 0),
                flatten() as any /* TODO review typing*/
            )
        )
    );
}


const getFieldContent = (resource: Resource) => (fieldName: string): any => {

    return resource[fieldName]
        ?? (resource.relations[fieldName] && resource.relations[fieldName].length > 0
            ? resource.relations[fieldName]
            : undefined
        );
}


async function addPresentInInverseRelation(groups: Array<FieldsViewGroup>, resource: Resource, datastore: Datastore,
                                           presentInInverseRelationLabel: string) {

    if (resource.category !== 'Profile' && resource.category !== 'Planum') return;

    let group = groups.find(group => group.name === Groups.POSITION);
    if (!group) group = groups.find(group => group.name === Groups.OTHER);
    if (!group) group = groups[0];

    const targets: Array<Document> = (await datastore.find(
        { constraints: { 'isPresentIn:contain': resource.id } }
    )).documents;

    if (targets.length > 0) {
        group.fields.push({
            name: 'hasPresent',
            label: presentInInverseRelationLabel,
            type: 'relation',
            targets: targets
        });
    }
}
