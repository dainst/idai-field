import { set, sameset, flatMap, includedIn, same, remove, isUndefinedOrEmpty } from 'tsfun';
import {samemap} from 'tsfun/src/comparator';
import { Resource } from './resource';


export interface Relations {
    [propName: string]: string[];
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace Relations {

    export function getAllTargets(relations: Relations, allowedRelations?: string[]): Array<string> {

        const ownKeys = Object.keys(relations)
            .filter(prop => relations.hasOwnProperty(prop));

        const usableRelations = allowedRelations
            ? ownKeys.filter(includedIn(allowedRelations))
            : ownKeys;

        return flatMap(usableRelations, (prop: string) => relations[prop as string]);
    }


    export function getDifferent(relations1: Relations, relations2: Relations): string[] {

        const differingRelationNames: string[]
            = findDifferingFieldsInRelations(relations1, relations2)
                .concat(findDifferingFieldsInRelations(relations2, relations1));

        return set(differingRelationNames);
    }


    export function removeEmpty(relations: Relations) {

        Object.keys(relations)
            .filter(key => relations[key] === null || relations[key].length === 0)
            .forEach(key => delete relations[key]);
    }


    export const equivalent = (r1: Relations) => (r2: Relations) =>
        samemap(sameset,
            remove(isUndefinedOrEmpty, r1),
            remove(isUndefinedOrEmpty, r2));


    function findDifferingFieldsInRelations(relations1: Object, relations2: Object): string[] {

        return Object.keys(relations1)
            .reduce(
                Resource.concatIf(notBothEqual(relations1, relations2)),
                []
            );
    }

    
    const notBothEqual = (l: any, r: any) => (key: string) => !r[key] || !same(l[key], r[key]);
}
