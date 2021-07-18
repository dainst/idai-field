import { set, same, sameset, samemap, isnt, includedIn, flatMap, remove, isUndefinedOrEmpty } from 'tsfun';
import { Name } from '../tools/named';
import { ObjectUtils } from '../tools/object-utils';
import {Relations} from './relations';


export interface NewResource {

    id?: string;
    identifier: string;
    category: string;
    relations: Relations;
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


    export const relationsEquivalent = (r1: Resource) => (r2: Resource) =>
        samemap(sameset,
            remove(isUndefinedOrEmpty, r1.relations),
            remove(isUndefinedOrEmpty, r2.relations));


    // TODO review; tests; maybe test getDifferingFields instead
    function compare(value1: any, value2: any): boolean {

        if (value1 === undefined && value2 === undefined) return true;
        if ((value1 && !value2) || (!value1 && value2)) return false;

        const type1: string = getType(value1);
        const type2: string = getType(value2);

        if (type1 !== type2) return false;

        if (type1 === 'array' && type2 === 'array') {
            return sameset(ObjectUtils.jsonEqual, value1, value2)
        }

        return ObjectUtils.jsonEqual(value1)(value2);
    }


    const concatIf = (f: (_: string) => boolean) => (acc: string[], val: string) =>
        f(val) ? acc.concat([val as string]) : acc;

    
    function findDifferingFieldsInResource(resource1: Object, resource2: Object): string[] {

        return Object.keys(resource1)
            .filter(isnt(RELATIONS))
            .reduce(
                concatIf(notCompareInBoth(resource1, resource2)),
                [] as string[]
            );
    }


    const notCompareInBoth = (l: any, r: any) => (key: string) => !compare((l)[key], (r)[key]);


    function getType(value: any): string {

        return typeof value === 'object'
            ? value instanceof Array
                ? 'array'
                : 'object'
            : 'flat';
    }

    
    const notBothEqual = (l: any, r: any) => (key: string) => !r[key] || !same(l[key], r[key]);
}