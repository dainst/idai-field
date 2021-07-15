import { aFlow, assoc, compose, isEmpty, filter, flatten, 
    is, isArray, isDefined, isObject, isString, L, map, 
    Map, Mapping, on, pairWith, Predicate, R, to, not } from 'tsfun';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { Datastore } from '../datastore/datastore';
import { Dating } from '../model/dating';
import { Dimension } from '../model/dimension';
import { Document } from '../model/document';
import { Field } from '../model/field';
import { BaseGroup, Group } from '../model/group';
import { Literature } from '../model/literature';
import { OptionalRange } from '../model/optional-range';
import { Resource } from '../model/resource';
import { Valuelist } from '../model/valuelist';
import { Named } from './named';
import { Labels } from '../services';


type FieldContent = any;


export interface FieldsViewGroup extends BaseGroup {

    fields: Array<FieldsViewField>;
}


export interface FieldsViewField {

    label: string;
    type: 'default'|'array'|'object'|'relation';
    value?: string|string[]; // TODO add object types
    valuelist?: Valuelist;
    positionValues?: Valuelist;
    targets?: Array<Document>;
}


export module FieldsViewGroup {

    export const SHOWN = 'shown';
    export const RELATIONS = 'relations';
    export const FIELDS = 'fields';
}


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export module FieldsViewUtil {

    export function getValue(fieldContent: any,
                             fieldName: string, 
                             projectConfiguration: ProjectConfiguration,
                             labels: Labels,
                             valuelist?: Valuelist): any {

        return fieldName === Resource.CATEGORY
            ? labels.get(projectConfiguration.getCategory(fieldContent))
            : valuelist
                ? labels.getValueLabel(valuelist, fieldContent)
                : isString(fieldContent)
                    ? fieldContent
                        .replace(/^\s+|\s+$/g, '')
                        .replace(/\n/g, '<br>')
                    : fieldContent;
    }


    export const isVisibleField: Predicate<Field> = on(Field.VISIBLE, is(true));


    export const shouldBeDisplayed: Predicate<FieldsViewGroup> =
        on(FieldsViewGroup.FIELDS, not(isEmpty));


    export async function getGroupsForResource(resource: Resource,
                                               projectConfiguration: ProjectConfiguration,
                                               datastore: Datastore,
                                               labels: Labels): Promise<Array<FieldsViewGroup>> {

        const relationTargets: Map<Array<Document>> = await getRelationTargets(resource, datastore);

        return await aFlow(
            projectConfiguration.getCategory(resource.category).groups,
            putActualResourceFieldsIntoGroups(resource, projectConfiguration, relationTargets, labels),
            filter(shouldBeDisplayed)
        );
    }


    export function getObjectLabel(object: any, 
                                   field: FieldsViewField,
                                   getTranslation: (key: string) => string,
                                   formatDecimal: (value: number) => string,
                                   labels: Labels): string {

        if (object.label) {
            return object.label;
        } else if (object.begin || object.end) {
            return Dating.generateLabel(
                object,
                getTranslation
            );
        } else if (object.inputUnit) {
            return Dimension.generateLabel(
                object,
                formatDecimal,
                getTranslation,
                labels.getValueLabel(field.positionValues, object.measurementPosition)
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
            return object;
        }
    }
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
                filter(on(R, isDefined)),
                filter(on(L, FieldsViewUtil.isVisibleField)),
                map(makeField(projectConfiguration, relationTargets, labels)),
                flatten() as any /* TODO review typing*/
            )
        )
    );
}


function makeField(projectConfiguration: ProjectConfiguration, 
                   relationTargets: Map<Array<Document>>,
                   labels: Labels) {

    return function([field, fieldContent]: [Field, FieldContent]): FieldsViewField {

        return (field.inputType === Field.InputType.RELATION
                || field.inputType === Field.InputType.INSTANCE_OF)
            ? {
                label: labels.get(field),
                type: 'relation',
                targets: relationTargets[field.name]
            }
            : {
                label: labels.get(field),
                value: isArray(fieldContent)
                    ? fieldContent.map((fieldContent: any) =>
                        FieldsViewUtil.getValue(
                            fieldContent, field.name, projectConfiguration, labels, field.valuelist
                        )
                    )
                    : FieldsViewUtil.getValue(
                        fieldContent, field.name, projectConfiguration, labels, field.valuelist
                    ),
                type: isArray(fieldContent) ? 'array' : isObject(fieldContent) ? 'object' : 'default',
                valuelist: field.valuelist,
                positionValues: field.positionValues
            };
    }
}


const getFieldContent = (resource: Resource) => (fieldName: string): any => {

    return resource[fieldName]
        ?? (resource.relations[fieldName] && resource.relations[fieldName].length > 0
            ? resource.relations[fieldName]
            : undefined
        );
}


async function getRelationTargets(resource: Resource, datastore: Datastore): Promise<Map<Array<Document>>> {

    const targets: Map<Array<Document>> = {};

    for (let relationName of Object.keys(resource.relations)) {
        targets[relationName] = await datastore.getMultiple(resource.relations[relationName]);
    }

    return targets;
}
