import {compose, filter, flatten, flow, forEach, intersect, isDefined,
    isNot, isUndefinedOrEmpty, lookup, keys, values, empty, pairWith,
    map, remove, subtract, to, undefinedOrEmpty, throws} from 'tsfun';
import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from '../import-errors';
import {HIERARCHICAL_RELATIONS, POSITION_RELATIONS, TIME_RELATIONS} from '../../../model/relation-constants';
import {setInverseRelationsForDbResources} from './set-inverse-relations-for-db-resources';
import {assertInSameOperationWith, makeDocumentsLookup} from '../utils';
import IS_BELOW = POSITION_RELATIONS.IS_BELOW;
import IS_ABOVE = POSITION_RELATIONS.IS_ABOVE;
import IS_CONTEMPORARY_WITH = TIME_RELATIONS.IS_CONTEMPORARY_WITH;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {AssertIsAllowedRelationDomainType} from '../types';
import IS_AFTER = TIME_RELATIONS.IS_AFTER;
import IS_BEFORE = TIME_RELATIONS.IS_BEFORE;
import IS_EQUIVALENT_TO = POSITION_RELATIONS.IS_EQUIVALENT_TO;
import {ResourceId} from '../../../constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import {InverseRelationsMap} from '../../../configuration/inverse-relations-map';


/**
 * Iterates over all relations (including obsolete relations) of the given resources.
 * Between import resources, it validates the relations.
 * Between import resources and db resources, it adds the inverses.
 *
 * @param get
 * @param inverseRelationsMap
 * @param assertIsAllowedRelationDomainType
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
                                               assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType = () => {},
                                               mergeMode: boolean = false): Promise<Array<Document>> {

    const documentsLookup = makeDocumentsLookup(importDocuments);

    setInverseRelationsForImportResources(
        importDocuments,
        documentsLookup,
        inverseRelationsMap,
        assertIsAllowedRelationDomainType);

    return await setInverseRelationsForDbResources(
        importDocuments,
        getTargetIds(mergeMode, get, documentsLookup),
        get,
        inverseRelationsMap,
        assertIsAllowedRelationDomainType,
        [LIES_WITHIN, RECORDED_IN]);
}


function getTargetIds(mergeMode: boolean,
                      get: (_: string) => Promise<Document>,
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


function targetIdsReferingToDbResources(document: Document,
                                        documentsLookup: { [_: string]: Document }) {

    return flow(
        document.resource.relations,
        values,
        flatten,
        remove(compose(lookup(documentsLookup), isDefined)));
}


function setInverseRelationsForImportResources(importDocuments: Array<Document>,
                                               documentsLookup: { [_: string]: Document },
                                               inverseRelationsMap: InverseRelationsMap,
                                               assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType): void {

    for (let importDocument of importDocuments) {

        flow(importDocument.resource.relations,
            keys,
            map(pairWith(lookup(inverseRelationsMap))),
            forEach(assertNotBadlyInterrelated(importDocument)),
            forEach(setInverses(importDocument, documentsLookup, assertIsAllowedRelationDomainType)));
    }
}


function setInverses(importDocument: Document,
                     documentsLookup: { [_: string]: Document },
                     assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType) {

    return ([relationName, inverseRelationName]: [string, string|undefined]) => {

        const assertIsAllowedRelationDomainType_ = (targetDocument: Document) => {

            assertIsAllowedRelationDomainType(
                importDocument.resource.type,
                targetDocument.resource.type,
                relationName,
                importDocument.resource.identifier);
        };

        const tmp = flow(
            importDocument.resource.relations[relationName],
            map(lookup(documentsLookup)),
            filter(isDefined),
            forEach(assertIsAllowedRelationDomainType_));

        if (!inverseRelationName) return;
        if (inverseRelationName === HIERARCHICAL_RELATIONS.INCLUDES) return;

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

