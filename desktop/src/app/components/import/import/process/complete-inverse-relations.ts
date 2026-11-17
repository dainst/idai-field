import { isEmpty, filter, flow, forEach, intersect, isDefined, isUndefinedOrEmpty, lookup, map, pairWith,
    throws, to, not } from 'tsfun';
import { Document, Relation, Resource, Lookup} from 'idai-field-core';
import { ImportErrors as E } from '../import-errors';
import { AssertIsAllowedRelationDomainType } from '../types';
import { setInverseRelationsForDbResources } from './set-inverse-relations-for-db-resources';
import IS_CONTEMPORARY_WITH = Relation.Time.CONTEMPORARY;
import IS_AFTER = Relation.Time.AFTER;
import IS_BEFORE = Relation.Time.BEFORE;


/**
 * Iterates over all relations (including obsolete relations) of the given resources.
 * Between import resources, it only validates the relations while
 * between import resources and db resources it also adds the inverses.
 *
 * @param documentsLookup
 * @param targetsLookup
 * @param inverseRelationsMap
 * @param assertIsAllowedRelationDomainCategory
 * @param mergeMode
 *
 *   for contradictory relations and missing inverses are added.
 *
 * @param mergeMode
 *
 * @SIDE_EFFECTS: if an inverse of one of importDocuments is not set,
 *   it gets completed automatically.
 *   The document from importDocuments then gets modified in place.
 *
 * @returns the target importDocuments which should be updated.
 *   Only those fetched from the db are included. If a target document comes from
 *   the import file itself, <code>importDocuments</code> gets modified in place accordingly.
 *
 * @throws ImportErrors.* (see ./process.ts)
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function completeInverseRelations(documentsLookup: Lookup<Document>,
                                         targetsLookup: Lookup<[Array<Resource.Id>, Array<Document>]>,
                                         inverseRelationsMap: Relation.InverseRelationsMap,
                                         assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType = () => {},
                                         mergeMode: boolean = false): Array<Document> {

    const importDocuments = Object.values(documentsLookup);

    setInverseRelationsForImportResources(
        importDocuments,
        documentsLookup,
        inverseRelationsMap,
        assertIsAllowedRelationDomainCategory
    );

    return setInverseRelationsForDbResources(
        importDocuments,
        targetsLookup as any,
        inverseRelationsMap,
        assertIsAllowedRelationDomainCategory,
        Relation.UNIDIRECTIONAL
    );
}


function setInverseRelationsForImportResources(importDocuments: Array<Document>,
                                               documentsLookup: { [_: string]: Document },
                                               inverseRelationsMap: Relation.InverseRelationsMap,
                                               assertIsAllowedRelationDomainCategory: AssertIsAllowedRelationDomainType): void {

    for (let importDocument of importDocuments) {

        flow(importDocument.resource.relations,
            Object.keys,
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
            forEach(assertIsAllowedRelationDomainCategory_)
        );

        if (!inverseRelationName) return;

        flow(
            tmp,
            map(to(['resource', 'relations'])),
            forEach(setInverse(importDocument.resource.id, inverseRelationName as string))
        );
    }
}


function assertNotBadlyInterrelated(document: Document) {

    return ([relationName, inverseRelationName]: [string, string|undefined]) => {

        if (!inverseRelationName) return;

        const forbiddenRelations = [];

        if (relationName !== inverseRelationName) forbiddenRelations.push(inverseRelationName);

        // if ([IS_ABOVE, IS_BELOW].includes(relationName)) forbiddenRelation.push(IS_EQUIVALENT_TO);
        // else if (IS_EQUIVALENT_TO === relationName) forbiddenRelation.push(IS_ABOVE, IS_BELOW);

        if ([IS_BEFORE, IS_AFTER].includes(relationName)) forbiddenRelations.push(IS_CONTEMPORARY_WITH);
        else if (IS_CONTEMPORARY_WITH === relationName) forbiddenRelations.push(IS_BEFORE, IS_AFTER);

        assertNoForbiddenRelations(forbiddenRelations, document.resource.relations[relationName], document);
    }
}


function assertNoForbiddenRelations(forbiddenRelations: string[], relationTargets: string[],
                                    document: Document) {

    forbiddenRelations
        .map(lookup(document.resource.relations))
        .filter(not(isUndefinedOrEmpty))
        .map(intersect(relationTargets))
        .filter(not(isEmpty))
        .forEach(throws([E.BAD_INTERRELATION, document.resource.identifier]));
}


function setInverse(resourceId: string, inverseRelationName: string) {

    return (targetDocumentRelations: Resource.Relations) => {

        if (isUndefinedOrEmpty(targetDocumentRelations[inverseRelationName])) {
            targetDocumentRelations[inverseRelationName] = [];
        }
        if (!targetDocumentRelations[inverseRelationName].includes(resourceId)) {
            targetDocumentRelations[inverseRelationName].push(resourceId);
        }
    }
}
