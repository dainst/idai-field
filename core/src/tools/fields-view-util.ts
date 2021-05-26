import { aFlow, aMap, and, assoc, compose, empty, equal, filter, Filter, flatten, flow, includedIn,
    is, isArray, isDefined, isNot, isObject, isString, L, lookup, map, Map, Mapping, on, or, pairWith,
    Predicate, R, to, undefinedOrEmpty } from 'tsfun';
import { LabelUtil } from './label-util';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { Datastore } from '../datastore/datastore';
import { Category } from '../model/category';
import { Dating } from '../model/dating';
import { Dimension } from '../model/dimension';
import { Document } from '../model/document';
import { FieldDefinition } from '../model/field-definition';
import { FieldResource } from '../model/field-resource';
import { BaseGroup, Group, Groups } from '../model/group';
import { Literature } from '../model/literature';
import { OptionalRange } from '../model/optional-range';
import { RelationDefinition } from '../model/relation-definition';
import { Relations } from '../model/relations';
import { Resource } from '../model/resource';
import { ValuelistDefinition } from '../model/valuelist-definition';
import { Named } from './named';
import { ValuelistUtil } from './valuelist-util';


type FieldContent = any;


export interface FieldsViewGroup extends BaseGroup {

    shown: boolean;
    relations: Array<FieldsViewRelation>;
    fields: Array<FieldsViewField>;
}


export interface FieldsViewRelation {

    label: string;
    targets: Array<Document>;
}


export interface FieldsViewField {

    value: string | string[]; // TODO add object types
    label: string;
    type: 'default' | 'array' | 'object';
    valuelist?: ValuelistDefinition;
    positionValues?: ValuelistDefinition;
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

    export function getValue(fieldContent: any, fieldName: string, projectConfiguration: ProjectConfiguration,
                             valuelist?: ValuelistDefinition, languages?: string[]): any {

        return fieldName === Resource.CATEGORY
            ? projectConfiguration.getLabelForCategory(fieldContent)
            : valuelist
                ? ValuelistUtil.getValueLabel(valuelist, fieldContent, languages)
                : isString(fieldContent)
                    ? fieldContent
                        .replace(/^\s+|\s+$/g, '')
                        .replace(/\n/g, '<br>')
                    : fieldContent;
    }


    export function filterRelationsToShowFor(resource: Resource): Filter<Array<RelationDefinition>> {

        return filter(
            on(Named.NAME,
                and(
                    isNot(includedIn(Relations.Hierarchy.ALL)),
                    isNot(equal(Relations.Image.ISDEPICTEDIN)),
                    isNot(equal(Relations.Image.HASMAPLAYER)),
                    compose(lookup(resource.relations), isNot(undefinedOrEmpty))
                )
            )
        );
    }


    export const isVisibleField: Predicate<FieldDefinition> = or(
        on(FieldDefinition.VISIBLE, is(true)),
        on(Named.NAME, is(Resource.CATEGORY)),
        on(Named.NAME, is(FieldResource.SHORTDESCRIPTION))
    );


    export const shouldBeDisplayed: Predicate<FieldsViewGroup> = or(
        on(FieldsViewGroup.FIELDS, isNot(empty)),
        on(FieldsViewGroup.RELATIONS, isNot(empty))
    );


    export function getGroups(category: string, categories: Map<Category>) {

        return flow(category,
            lookup(categories),
            to(Category.GROUPS),
            map(group =>
                assoc<any>(
                    FieldsViewGroup.SHOWN,
                    group.name === Groups.STEM)(group)
            ));
    }


    export async function getGroupsForResource(
        resource: Resource,
        projectConfiguration: ProjectConfiguration,
        datastore: Datastore,
        languages?: string[]
    ): Promise<Array<FieldsViewGroup>> {

        return await aFlow(
            FieldsViewUtil.getGroups(resource.category, Named.arrayToMap(projectConfiguration.getCategoriesArray())),
            putActualResourceRelationsIntoGroups(resource, datastore),
            putActualResourceFieldsIntoGroups(resource, projectConfiguration, languages),
            filter(shouldBeDisplayed)
        );
    }


    export function getObjectLabel(
        object: any,
        field: FieldsViewField,
        getTranslation: (key: string) => string,
        formatDecimal: (value: number) => string
    ): string {

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
                ValuelistUtil.getValueLabel(field.positionValues, object.measurementPosition)
            );
        } else if (object.quotation) {
            return Literature.generateLabel(
                object, getTranslation
            );
        } else if (object.value) {
            return OptionalRange.generateLabel(
                object,
                getTranslation,
                (value: string) => ValuelistUtil.getValueLabel(field.valuelist, value)
            );
        } else {
            return object;
        }
    }
}


function putActualResourceRelationsIntoGroups(resource: Resource, datastore: Datastore) {

    return ($: any) => aMap(async (group: any /* ! modified in place ! */) => {

        group.relations = await aFlow(
            group.relations,
            FieldsViewUtil.filterRelationsToShowFor(resource),
            aMap(async (relation: RelationDefinition) => {
                return {
                    label: LabelUtil.getLabel(relation),
                    targets: await datastore.getMultiple(resource.relations[relation.name])
                }
            })
        );
        return group;
    }, $);
}


function putActualResourceFieldsIntoGroups(resource: Resource, projectConfiguration: ProjectConfiguration, languages?: string[],): Mapping {

    const fieldContent: Mapping<FieldDefinition, FieldContent>
        = compose(to(Named.NAME), lookup(resource));

    return map(
        assoc(Group.FIELDS,
            compose(
                map(pairWith(fieldContent)),
                filter(on(R, isDefined)),
                filter(on(L, FieldsViewUtil.isVisibleField)),
                map(makeField(projectConfiguration, languages)),
                flatten() as any /* TODO review typing*/
            )
        )
    );
}


function makeField(projectConfiguration: ProjectConfiguration, languages?: string[]) {

    return function([field, fieldContent]: [FieldDefinition, FieldContent]): FieldsViewField {

        return {
            label: LabelUtil.getLabel(field),
            value: isArray(fieldContent)
                ? fieldContent.map((fieldContent: any) =>
                    FieldsViewUtil.getValue(
                        fieldContent, field.name, projectConfiguration, field.valuelist, languages
                    )
                )
                : FieldsViewUtil.getValue(
                    fieldContent, field.name, projectConfiguration, field.valuelist, languages
                ),
            type: isArray(fieldContent) ? 'array' : isObject(fieldContent) ? 'object' : 'default',
            valuelist: field.valuelist,
            positionValues: field.positionValues
        };
    }
}
