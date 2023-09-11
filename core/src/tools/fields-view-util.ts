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


type FieldContent = any;


export interface FieldsViewGroup extends BaseGroup {

    fields: Array<FieldsViewField>;
}


export interface FieldsViewField extends FieldsViewSubfield {

    value?: any;
    targets?: Array<Document>;
    subfields?: Array<FieldsViewSubfield>;
}


export interface FieldsViewSubfield {

    name: string;
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
                                   field: FieldsViewSubfield,
                                   getTranslation: (key: string) => string,
                                   formatDecimal: (value: number) => string,
                                   labels: Labels): string|null {

        if (object.label) {
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
                    value: getFieldValue(fieldContent, field, labels, projectConfiguration),
                    type: getFieldType(field.inputType),
                    valuelist: field.valuelist,
                    subfields: makeSubfields(field.subfields, labels)
                };
        }
    }


    export function makeSubfields(subfields: Array<Subfield>, labels: Labels): Array<FieldsViewSubfield> {

        if (!subfields) return undefined;

        return subfields.map(subfield => {
            return {
                name: subfield.name,
                label: labels.get(subfield),
                type: getFieldType(subfield.inputType),
                valuelist: subfield.valuelist
            };
        });
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
                ? prepareString(fieldContent)
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


function prepareString(stringValue: string): string {

    return stringValue
        .replace(/^\s+|\s+$/g, '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}


function putActualResourceFieldsIntoGroups(resource: Resource, projectConfiguration: ProjectConfiguration,
                                           relationTargets: Map<Array<Document>>, labels: Labels): Mapping {

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
