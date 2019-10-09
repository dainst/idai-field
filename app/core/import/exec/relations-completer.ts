import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {compose, filter, flatten, flow, forEach, intersect, isDefined, isEmpty, isNot, isnt, isUndefinedOrEmpty, lookup,
    map, remove, subtract, to, undefinedOrEmpty, on} from 'tsfun';
import {gt, len, makeLookup} from '../util';
import {HIERARCHICAL_RELATIONS, POSITION_RELATIONS, TIME_RELATIONS} from '../../model/relation-constants';
import {setInverseRelationsForDbResources} from './set-inverse-relations-for-db-resources';
import {assertInSameOperationWith} from './utils';
import IS_BELOW = POSITION_RELATIONS.IS_BELOW;
import IS_ABOVE = POSITION_RELATIONS.IS_ABOVE;
import IS_CONTEMPORARY_WITH = TIME_RELATIONS.IS_CONTEMPORARY_WITH;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {keys, keysAndValues} from 'tsfun/src/objectmap';
import {AssertIsAllowedRelationDomainType} from './import-validator';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {

    type LookupDocument = (_: string) => Document|undefined;

    /**
     * Iterates over all relations (including obsolete relations) of the given resources.
     * Between import resources, it validates the relations.
     * Between import resources and db resources, it adds the inverses.
     *
     * @param get
     * @param getInverseRelation
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
     * @throws ImportErrors.*
     * @see DefaultImportCalc#build() . process()
     */
    export async function completeInverseRelations(importDocuments: Array<Document>,
                                             get: (_: string) => Promise<Document>,
                                             getInverseRelation: (_: string) => string|undefined,
                                             assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType = () => {},
                                             mergeMode: boolean = false): Promise<Array<Document>> {

        const lookupDocument = lookup(makeDocumentsLookup(importDocuments));

        for (let importDocument of importDocuments) {

            setInverseRelationsForImportResource(
                importDocument,
                lookupDocument,
                pairRelationWithItsInverse(getInverseRelation),
                relationNamesExceptRecordedIn(importDocument),
                assertIsAllowedRelationDomainType);
        }

        return await setInverseRelationsForDbResources(
            importDocuments,
            getTargetIds(mergeMode, get, lookupDocument),
            get,
            getInverseRelation,
            assertIsAllowedRelationDomainType);

    }


    function getTargetIds(mergeMode: boolean, get: (_: string) => Promise<Document>, lookupDocument: LookupDocument) {

        return async (document: Document) => {

            let targetIds = targetIdsReferingToDbResources(document, lookupDocument);
            if (mergeMode) {
                let oldVersion; try { oldVersion = await get(document.resource.id);
                } catch { throw "FATAL existing version of document not found" }
                return [targetIds, subtract(targetIds)(targetIdsReferingToDbResources(oldVersion as any, lookupDocument))]
            }
            return [targetIds, []];
        }
    }


    function relationNamesExceptRecordedIn(document: Document) { // TODO get rid of this

        return flow(
            document.resource.relations,
            Object.keys,
            filter(isnt(RECORDED_IN))) as string[];
    }


    function targetIdsReferingToDbResources(document: Document,
                                            lookupDocument: LookupDocument) {

        return flow(
            document.resource.relations,
            keysAndValues,
            filter(on('[0]', isnt(RECORDED_IN))),
            map(to('[1]')),
            flatten,
            remove(compose(lookupDocument, isDefined)));
    }


    function setInverseRelationsForImportResource(importDocument: Document,
                                                  lookupDocument: LookupDocument,
                                                  pairRelationWithItsInverse: (_: Document) => (_: string) => [string, string|undefined],
                                                  relations: string[],
                                                  assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType): void {

        const pairRelationWithItsInverse_ = pairRelationWithItsInverse(importDocument);
        const assertNotBadyInterrelated_ = assertNotBadlyInterrelated(importDocument);
        const setInverses_ = setInverses(importDocument, lookupDocument, assertIsAllowedRelationDomainType);

        flow(relations,
            map(pairRelationWithItsInverse_),
            filter(on('[1]', isDefined)),
            forEach(assertNotBadyInterrelated_),
            forEach(setInverses_));
    }


    function setInverses(importDocument: Document,
                         lookupDocument: LookupDocument,
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
                map(lookupDocument),
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


    function pairRelationWithItsInverse(getInverseRelation: (_: string) => string|undefined) {

        return (document: Document) =>  (relationName: string) => {

            if (isEmpty(document.resource.relations[relationName])) throw [E.EMPTY_RELATION, document.resource.identifier];
            const inverseRelationName = getInverseRelation(relationName);
            return [relationName, inverseRelationName] as [string, string|undefined];
        }
    }



    function assertNotBadlyInterrelated(document: Document) {

        return ([relationName, inverseRelationName]: [string, string]) => {

            const forbiddenRelations = [];
            if (relationName !== inverseRelationName)        forbiddenRelations.push(inverseRelationName);
            if ([IS_ABOVE, IS_BELOW].includes(relationName)) forbiddenRelations.push(IS_CONTEMPORARY_WITH); // TODO review spatial relations
            else if (IS_CONTEMPORARY_WITH === relationName)  forbiddenRelations.push(IS_ABOVE, IS_BELOW);

            assertNoForbiddenRelations(forbiddenRelations, document.resource.relations[relationName], document);
        }
    }


    function assertNoForbiddenRelations(forbiddenRelations: string[], relationTargets: string[], document: Document) {

        forbiddenRelations
            .map(lookup(document.resource.relations))
            .filter(isNot(undefinedOrEmpty))
            .map(intersect(relationTargets))
            .map(len)
            .filter(gt(0))
            .forEach(_ => { throw [E.BAD_INTERRELATION, document.resource.identifier] });
    }


    function setInverse(resourceId: string, inverseRelationName: string) { return (targetDocumentRelations: Relations) => {

        if (isUndefinedOrEmpty(targetDocumentRelations[inverseRelationName])) {
            targetDocumentRelations[inverseRelationName] = [];
        }
        if (!targetDocumentRelations[inverseRelationName].includes(resourceId)) {
            targetDocumentRelations[inverseRelationName].push(resourceId);
        }
    }}


    const makeDocumentsLookup = makeLookup('resource.id');
}
