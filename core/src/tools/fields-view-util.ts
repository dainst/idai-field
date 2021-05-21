import {
    and, assoc, compose,
    empty, equal, filter, Filter, flow, includedIn,
    is, isNot, isString, lookup, map, Map, on,
    or, Predicate, to, undefinedOrEmpty
} from 'tsfun';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { Category } from '../model/category';
import { FieldDefinition } from '../model/field-definition';
import { FieldResource } from '../model/field-resource';
import { BaseGroup, Groups } from '../model/group';
import { RelationDefinition } from '../model/relation-definition';
import { Relations } from '../model/relations';
import { Resource } from '../model/resource';
import { ValuelistDefinition } from '../model/valuelist-definition';
import { Labelled, Named } from './named';
import { ValuelistUtil } from './valuelist-util';


export interface FieldsViewGroup extends BaseGroup {

    shown: boolean;
    relations: Array<FieldsViewRelation>;
    fields: Array<FieldsViewField>;
}


export interface FieldsViewRelation extends Labelled {

    targets: Array<any>;
}


export interface FieldsViewField extends Labelled {

    value: string;
    type: 'default'|'array'|'object';
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
                             valuelist?: ValuelistDefinition): any {

        return fieldName === Resource.CATEGORY
            ? projectConfiguration.getLabelForCategory(fieldContent)
            : valuelist
                ? ValuelistUtil.getValueLabel(valuelist, fieldContent)
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
}
