import {compose, filter, flatten, flow, forEach, intersect, isDefined, isNot, isUndefinedOrEmpty,
    keys, values, empty, pairWith, map, remove, subtract, to, undefinedOrEmpty, throws} from 'tsfun';
import {lookup} from 'tsfun/associative';
import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from '../import-errors';
import {HierarchicalRelations, PositionRelations, TimeRelations} from '../../../model/relation-constants';
import {setInverseRelationsForDbResources} from './set-inverse-relations-for-db-resources';
import {assertInSameOperationWith, makeDocumentsLookup} from '../utils';
import IS_BELOW = PositionRelations.BELOW;
import IS_ABOVE = PositionRelations.ABOVE;
import IS_CONTEMPORARY_WITH = TimeRelations.CONTEMPORARY;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {AssertIsAllowedRelationDomainType} from '../types';
import IS_AFTER = TimeRelations.AFTER;
import IS_BEFORE = TimeRelations.BEFORE;
import IS_EQUIVALENT_TO = PositionRelations.EQUIVALENT;
import {ResourceId} from '../../../constants';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import {InverseRelationsMap} from '../../../configuration/inverse-relations-map';


/**
 * Iterates over all relations (including obsolete relations) of the given resources.
 * Between import resources, it validates the relations.
 * Between import resources and db resources, it adds the inverses.
 *
 * @param get
 * @param inverseRelationsMap
 * @param assertIsAllowedRelationDomainCategory
 * @param mergeMode
 *
 * @param importDocuments If one of these references another from the import file, the validity of the relations gets checked
 *   for contradictory relations and missing inverses are added.
 *
 * @param mergeMode
 *
 * @SIDE_EFFECTS: if an inverse of one of importDocuments is not set, it gets completed automatically.
 *   The document from importDocuments then gets modified in place.
 *
 * @returns the target importDocuments which should be updated. Only those fetched from the db are included. If a target document comes from
 *   the import file itself, <code>importDocuments</code> gets modified in place accordingly.
 *
 * @throws ImportErrors.* (see ./process.ts)
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export async function completeInverseRelations(importDocuments: Array<Document>,
                                               get: (_: string) => Promise<Document>,
                                               inverseRelationsMap: InverseRelationsMap,
                                               assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType = () => {},
                                               mergeMode: boolean = false): Promise<Array<Document>> {

    const documentsLookup = makeDocumentsLookup(importDocuments);

    setInverseRelationsForImportResources(
        importDocuments,
        documentsLookup,
        inverseRelationsMap,
        assertIsAllowedRelationDomainCategory);

    return await setInverseRelationsForDbResources(
        importDocuments,
        getTargetIds(mergeMode, get, documentsLookup),
        get,
        inverseRelationsMap,
        assertIsAllowedRelationDomainCategory,
        [LIES_WITHIN, RECORDED_IN]);
}


function getTargetIds(mergeMode: boolean, get: (_: string) => Promise<Document>,
                      documentsLookup: { [_: string]: Document },) {

    return async (document: Document): Promise<[ResourceId[], ResourceId[]]>  => {

        let targetIds = targetIdsReferingToDbResources(document, documentsLookup);
        if (mergeMode) {
            let oldVersion;
            try {
                oldVersion = await get(document.resource.id);
            } catch {
                throw 'FATAL: Existing version of document not found';
            }

            return [
                targetIds,
                subtract<ResourceId>(targetIds)(
                    targetIdsReferingToDbResources(oldVersion, documentsLookup)
                )
            ];
        }
        return [targetIds, []];
    }
}


function targetIdsReferingToDbResources(document: Document, documentsLookup: { [_: string]: Document }) {

    return flow(
        document.resource.relations,
        values,
        flatten() as any /* TODO review any */,
        remove(compose(lookup(documentsLookup), isDefined))) as any /* TODO review any */;
}


function setInverseRelationsForImportResources(importDocuments: Array<Document>,
                                               documentsLookup: { [_: string]: Document },
                                               inverseRelationsMap: InverseRelationsMap,
                                               assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType): void {

    for (let importDocument of importDocuments) {

        flow(importDocument.resource.relations,
            keys,
            map(pairWith(lookup(inverseRelationsMap))),
            forEach(assertNotBadlyInterrelated(importDocument)),
            forEach(setInverses(importDocument, documentsLookup, assertIsAllowedRelationDomainCategory)));
    }
}


function setInverses(importDocument: Document, documentsLookup: { [_: string]: Document },
                     assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType) {

    return ([relationName, inverseRelationName]: [string, string|undefined]) => {

        const assertIsAllowedRelationDomainCategory_ = (targetDocument: Document) => {

            assertIsAllowedRelationDomainCategory(
                importDocument.resource.category,
                targetDocument.resource.category,
                relationName,
                importDocument.resource.identifier);
        };

        const tmp = flow(
            importDocument.resource.relations[relationName],
            map(lookup(documentsLookup)),
            filter(isDefined),
            forEach(assertIsAllowedRelationDomainCategory_));

        if (!inverseRelationName) return;
        if (inverseRelationName === HierarchicalRelations.INCLUDES) return;

        flow(tmp,
            forEach(assertInSameOperationWith(importDocument)),
            map(to('resource.relations')),
            forEach(setInverse(importDocument.resource.id, inverseRelationName as string)));
    }
}


function assertNotBadlyInterrelated(document: Document) {

    return ([relationName, inverseRelationName]: [string, string|undefined]) => {

        if (!inverseRelationName) return;

        const forbiddenRelations = [];

        if (relationName !== inverseRelationName) forbiddenRelations.push(inverseRelationName);

        if ([IS_ABOVE, IS_BELOW].includes(relationName)) forbiddenRelations.push(IS_EQUIVALENT_TO);
        else if (IS_EQUIVALENT_TO === relationName) forbiddenRelations.push(IS_ABOVE, IS_BELOW);

        if ([IS_BEFORE, IS_AFTER].includes(relationName)) forbiddenRelations.push(IS_CONTEMPORARY_WITH);
        else if (IS_CONTEMPORARY_WITH === relationName) forbiddenRelations.push(IS_BEFORE, IS_AFTER);

        assertNoForbiddenRelations(forbiddenRelations, document.resource.relations[relationName], document);
    }
}


function assertNoForbiddenRelations(forbiddenRelations: string[], relationTargets: string[],
                                    document: Document) {

    forbiddenRelations
        .map(lookup(document.resource.relations))
        .filter(isNot(undefinedOrEmpty))
        .map(intersect(relationTargets))
        .filter(isNot(empty))
        .forEach(throws([E.BAD_INTERRELATION, document.resource.identifier]));
}


function setInverse(resourceId: string, inverseRelationName: string) {

    return (targetDocumentRelations: Relations) => {

        if (isUndefinedOrEmpty(targetDocumentRelations[inverseRelationName])) {
            targetDocumentRelations[inverseRelationName] = [];
        }
        if (!targetDocumentRelations[inverseRelationName].includes(resourceId)) {
            targetDocumentRelations[inverseRelationName].push(resourceId);
        }
    }
}

