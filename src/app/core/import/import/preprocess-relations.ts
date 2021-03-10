import {hasnt, includedIn, isArray, isnt, isUndefinedOrEmpty} from 'tsfun';
import {reduce as asyncReduce} from 'tsfun/async';
import {Document, Relations} from 'idai-components-2';
import {Find, Get, Id, Identifier, IdentifierMap} from './types';
import {iterateRelationsInImport} from './utils';
import {ImportErrors as E} from './import-errors';
import {RESOURCE_DOT_ID} from '../../constants';
import {HierarchicalRelations, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import {ImportOptions} from './import-documents';


/**
 * Converts identifiers in relations to ids, if useIdentifiersInRelations is true.
 * Converts PARENT relations to LIES_WITHIN.
 * Makes sure the resources have at least an empty relations map.
 *
 * @throws ImportErrors.*
 * @throws [MISSING_RELATION_TARGET]
 * @throws [MUST_BE_ARRAY]
 * @throws [INVALID_RELATIONS]
 * @throws [PARENT_MUST_NOT_BE_ARRAY]
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export async function preprocessRelations(documents: Array<Document>,
                                          generateId: () => string,
                                          find: Find,
                                          get: Get,
                                          { mergeMode, permitDeletions, useIdentifiersInRelations}: ImportOptions) {

    const identifierMap: IdentifierMap = mergeMode ? {} : assignIds(documents, generateId);

    for (let document of documents) {
        const relations = document.resource.relations;
        if (!relations) {
            document.resource.relations = {};
            continue;
        }
        adjustRelations(document, relations);
        removeSelfReferencingIdentifiers(relations, document.resource.identifier);
        if (!permitDeletions) Relations.removeEmpty(relations);
        if (useIdentifiersInRelations) {
            await rewriteIdentifiersInRelations(relations, find, identifierMap);
        } else {
            await assertNoMissingRelationTargets(relations, get)
        }
    }
}


async function rewriteIdentifiersInRelations(relations: Relations,
                                             find: Find,
                                             identifierMap: IdentifierMap) {

    return iterateRelationsInImport(relations, (relation: string) => async (identifier: Identifier, i: number) => {
        if (identifierMap[identifier]) {
            relations[relation][i] = identifierMap[identifier];
        } else {
            const found = await find(identifier);
            if (!found) throw [E.PREVALIDATION_MISSING_RELATION_TARGET, identifier];
            relations[relation][i] = found.resource.id;
        }
    });
}


async function assertNoMissingRelationTargets(relations: Relations, get: Get) {

    return iterateRelationsInImport(relations,
        (_: never) => async (id: Id, _: never) => {

            try { await get(id) }
            catch { throw [E.PREVALIDATION_MISSING_RELATION_TARGET, id] }
        });
}


function assignIds(documents: Array<Document>,
                   generateId: Function): IdentifierMap {

    return documents
        .filter(hasnt(RESOURCE_DOT_ID))
        .reduce((identifierMap, document) => {

        identifierMap[document.resource.identifier] = document.resource.id = generateId();
        return identifierMap;

    }, {} as IdentifierMap);
}


function adjustRelations(document: Document, relations: Relations) {

    assertHasNoHierarchicalRelations(document);
    const assertIsntArrayRelation = assertIsNotArrayRelation(document);

    Object.keys(document.resource.relations)
        .filter(isnt(PARENT))
        .forEach(assertIsntArrayRelation);

    assertParentNotArray(relations[PARENT], document.resource.identifier);
    if (relations[PARENT]) {
        (relations[LIES_WITHIN] = [relations[PARENT] as any]) && delete relations[PARENT];
    }
}


/**
 * Hierarchical relations are not used directly but instead one uses PARENT.
 */
function assertHasNoHierarchicalRelations(document: Document) {

    const foundForbiddenRelations = Object.keys(document.resource.relations)
        .filter(includedIn(HierarchicalRelations.ALL))
        .join(', ');
    if (foundForbiddenRelations) {
        throw [E.INVALID_RELATIONS, document.resource.category, foundForbiddenRelations];
    }
}


function assertIsNotArrayRelation(document: Document) {

    return (name: string) => {

        const relationValue = document.resource.relations[name];
        if (!isArray(relationValue) && relationValue !== null) throw [E.MUST_BE_ARRAY, document.resource.identifier];
    }
}


function assertParentNotArray(parentRelation: any, resourceIdentifier: string) {

    if (isArray(parentRelation)) throw [E.PARENT_MUST_NOT_BE_ARRAY, resourceIdentifier];
}


function removeSelfReferencingIdentifiers(relations: Relations, resourceIdentifier: Identifier) {

    for (let relName of Object.keys(relations)) {
        if (relations[relName] === null) continue;

        relations[relName] = relations[relName].filter(isnt(resourceIdentifier));
        if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
    }
}
