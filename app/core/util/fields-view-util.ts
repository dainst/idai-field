import {Resource} from 'idai-components-2/index';
import {ValuelistDefinition} from '../configuration/model/valuelist-definition';
import {ValuelistUtil} from './valuelist-util';
import {assoc, compose, flow, includedIn, isNot, isString, lookup, map, Map, on, to, undefinedOrEmpty} from 'tsfun';
import {RelationDefinition} from '../configuration/model/relation-definition';
import {HierarchicalRelations} from '../model/relation-constants';
import {Labelled, Named} from './named';
import {Category} from '../configuration/model/category';
import {Group, Groups} from '../configuration/model/group';


export interface FieldsViewGroup extends Group {

    shown: boolean;
    _relations: Array<FieldsViewRelation>;
    _fields: Array<FieldsViewField>;
}


export interface FieldsViewRelation extends Labelled {

    targets: Array<any>;
}

export interface FieldsViewField extends Labelled {

    value: string;
    isArray: boolean;
}


export module FieldsViewGroup {

    export const SHOWN = 'shown';
    export const _RELATIONS = '_relations';
    export const _FIELDS = '_fields';
}


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export module FieldsViewUtil {

    export function getValue(fieldContent: any, valuelist?: ValuelistDefinition): any {

        return valuelist
            ? ValuelistUtil.getValueLabel(valuelist, fieldContent)
            : isString(fieldContent)
                ? fieldContent
                    .replace(/^\s+|\s+$/g, '')
                    .replace(/\n/g, '<br>')
                : fieldContent;
    }


    export function computeRelationsToShow(resource: Resource,
            relations: Array<RelationDefinition>): Array<RelationDefinition> {

        const isNotHierarchical = isNot(includedIn(HierarchicalRelations.ALL));
        const hasTargets = compose(lookup(resource.relations), isNot(undefinedOrEmpty));

        return relations
            .filter(on(Named.NAME, isNotHierarchical))
            .filter(on(Named.NAME, hasTargets));
    }


    export function getGroups(category: string, categories: Map<Category>) {

        return flow(category,
            lookup(categories),
            to(Category.GROUPS),
            map(group =>
                assoc<any>(
                    FieldsViewGroup.SHOWN,
                    group.name === Groups.STEM)(group)
            ),
            map(group =>
                assoc<any>(
                    FieldsViewGroup._RELATIONS,
                    [])(group)
            ),
            map(group =>
                assoc<any>(
                    FieldsViewGroup._FIELDS,
                    [])(group)
            )) as Array<FieldsViewGroup>;
    }
}