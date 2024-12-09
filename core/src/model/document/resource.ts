import { set, sameset, samemap, isnt, includedIn, flatMap, Map, remove, isUndefinedOrEmpty, isString,
    clone } from 'tsfun';
import { Datastore } from '../../datastore/datastore';
import { Document } from './document';
import { notBothEqual, notCompareInBoth } from '../../tools/compare';
import { Name } from '../../tools/named';
import { SortUtil } from '../../tools/sort-util';
import { concatIf } from '../../tools/utils';
import { Labels, ProjectConfiguration } from '../../services';
import { Valuelist } from '../configuration/valuelist';
import { CategoryForm } from '../configuration/category-form';


export interface NewResource {

    id?: string;
    identifier: string;
    category: string;
    relations: Resource.Relations;
    [propName: string]: any;
}

export interface Resource extends NewResource {

    id: Resource.Id;
}

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module Resource {

    export type Id = string;

    export interface Relations {
        [propName: string]: string[];
    }

    export const ID = 'id';
    export const CATEGORY = 'category';
    export const IDENTIFIER = 'identifier';
    export const RELATIONS = 'relations';
    export const CONSTANT_FIELDS = [ID, CATEGORY, IDENTIFIER, RELATIONS];


    export function getDifferingFields(resource1: Resource, resource2: Resource): string[] {

        const differingFieldsNames: string[]
            = findDifferingFieldsInResource(resource1, resource2)
            .concat(findDifferingFieldsInResource(resource2, resource1));

        return set(differingFieldsNames);
    }


    export function getDifferingRelations(resource1: Resource, resource2: Resource): Name[] {

        const differingRelationNames: Name[]
            = findDifferingFieldsInRelations(resource1.relations, resource2.relations)
                .concat(findDifferingFieldsInRelations(resource2.relations, resource1.relations));


        return set(differingRelationNames);
    }


    export function hasRelations(resource: Resource, relation: Name): boolean {

        return resource.relations[relation] && resource.relations[relation].length > 0;
    }


    export function hasRelationTarget(resource: Resource, relation: Name, target: Id): boolean {

        if (!resource.relations[relation]) return false;
        return resource.relations[relation].indexOf(target) > -1;
    }


    export function getRelationTargets(resource: Resource, allowedRelations?: Array<Name>): Array<Id> {

        const ownKeys = Object.keys(resource.relations)
            .filter(prop => resource.relations.hasOwnProperty(prop));

        const usableRelations = allowedRelations
            ? ownKeys.filter(includedIn(allowedRelations))
            : ownKeys;

        return flatMap(usableRelations, (prop: string) => resource.relations[prop as string]);
    }


    export async function getRelationTargetDocuments(resource: Resource, datastore: Datastore): Promise<Map<Array<Document>>> {

        const targets: Map<Array<Document>> = {};
    
        for (let relationName of Object.keys(resource.relations)) {
            targets[relationName] = (await datastore.getMultiple(resource.relations[relationName]))
                .sort((target1, target2) => SortUtil.alnumCompare(
                    target1.resource.identifier, target2.resource.identifier
                ));
        }
    
        return targets;
    }


    export function removeEmptyRelations(resource: Resource) {

        Object.keys(resource.relations)
            .filter(key => resource.relations[key] === null || resource.relations[key].length === 0)
            .forEach(key => delete resource.relations[key]);
    }


    function findDifferingFieldsInRelations(relations1: Object, relations2: Object): string[] {

        return Object.keys(relations1)
            .reduce(
                concatIf(notBothEqual(relations1, relations2)),
                []
            );
    }


    export const relationsEquivalent = (r1: Resource) => (r2: Resource) => {

        const relations1 = clone(r1.relations);
        const relations2 = clone(r2.relations);

        return samemap(sameset,
            remove(isUndefinedOrEmpty, relations1),
            remove(isUndefinedOrEmpty, relations2)
        );
    };

    
    function findDifferingFieldsInResource(resource1: Object, resource2: Object): string[] {

        return Object.keys(resource1)
            .filter(isnt(RELATIONS))
            .reduce(
                concatIf(notCompareInBoth(resource1, resource2)),
                [] as string[]
            );
    }


    export const getShortDescriptionLabel = (resource: Resource, labels: Labels,
                                             projectConfiguration: ProjectConfiguration): string => {

        const shortDescription: any = resource.shortDescription;
        if (!shortDescription) return undefined;

        return isString(shortDescription)
            ? getShortDescriptionLabelFromString(resource, shortDescription, labels, projectConfiguration)
            : labels.getFromI18NString(shortDescription);
    }


    const getShortDescriptionLabelFromString = (resource: Resource, shortDescription: string, labels: Labels,
                                                projectConfiguration: ProjectConfiguration): string => {

        const category: CategoryForm = projectConfiguration.getCategory(resource.category)
        if (!category) return shortDescription;

        const valuelist: Valuelist|undefined = CategoryForm.getShortDescriptionValuelist(category);

        return valuelist
            ? labels.getValueLabel(valuelist, shortDescription)
            : shortDescription;
    }
}