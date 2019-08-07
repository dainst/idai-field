import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {arrayEqual, asyncMap, filter, flatMap, flow, getOnOr, intersect, is, isDefined, isEmpty, isNot, isnt, to,
    isUndefinedOrEmpty, lookup, on, subtractBy, undefinedOrEmpty, union, map, forEach, remove, nth, compose} from 'tsfun';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';
import {clone} from '../../util/object-util';
import {gt, keys, len, makeLookup} from '../util';
import {LIES_WITHIN, POSITION_RELATIONS, RECORDED_IN, TIME_RELATIONS} from '../../../c';
import IS_BELOW = POSITION_RELATIONS.IS_BELOW;
import IS_ABOVE = POSITION_RELATIONS.IS_ABOVE;
import IS_CONTEMPORARY_WITH = TIME_RELATIONS.IS_CONTEMPORARY_WITH;


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {

    type LookupDocument = (_: string) => Document|undefined;


    /**
     * Iterates over all relations (ex) of the given resources.
     * Between import resources, it validates the relations.
     * Between import resources and db resources, it adds the inverses.
     *
     * @param get
     * @param getInverseRelation
     */
    export function completeInverseRelations(get: (_: string) => Promise<Document>,
                                             getInverseRelation: (_: string) => string|undefined) {

        /**
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
         *
         * @throws [EXEC_MISSING_RELATION_TARGET, targetId]
         *
         * @throws [EMPTY_RELATION, resourceId]
         *   If relations empty for some relation is empty.
         *   For example relations: {isAbove: []}
         *
         * @throws [BAD_INTERRELATION, sourceId]
         *   - If opposing relations are pointing to the same resource.
         *     For example IS_BEFORE and IS_AFTER pointing both from document '1' to '2'.
         *   - If mutually exluding relations are pointing to the same resource.
         *     For example IS_CONTEMPORARY_WITH and IS_AFTER both from document '1' to '2'.
         */
        return async (importDocuments: Array<Document>, mergeMode: boolean = false): Promise<Array<Document>> => {

            const lookupDocument = lookup(makeDocumentsLookup(importDocuments));

            for (let importDocument of importDocuments) {

                setInverseRelationsForImportResource(
                    importDocument,
                    lookupDocument,
                    addInverse(getInverseRelation),
                    relationNamesExceptRecordedIn(importDocument));
            }

            return await setInverseRelationsForDbResources(
                importDocuments,
                lookupDocument,
                get,
                getInverseRelation,
                mergeMode);
        }
    }


    async function setInverseRelationsForDbResources(importDocuments: Array<Document>,
                                                     lookupDocument: LookupDocument,
                                                     get: (_: string) => Promise<Document>,
                                                     getInverseRelation: (_: string) => string|undefined,
                                                     mergeMode: boolean): Promise<Array<Document>> {

        async function getTargetIds(document: Document) {

            let targetIds = targetIdsReferingToDbResources(document, lookupDocument);
            if (mergeMode) {
                let oldVersion; try { oldVersion = await get(document.resource.id);
                } catch { throw "FATAL existing version of document not found" }
                targetIds = union([targetIds, targetIdsReferingToDbResources(oldVersion as any, lookupDocument)]);
            }
            return targetIds;
        }


        async function getDocumentTargetDocsToUpdate(document: Document) {

            const targetIds = await getTargetIds(document);
            const documentTargetDocuments = await asyncMap<any>(getTargetDocument(totalDocsToUpdate, get))(targetIds);

            ConnectedDocsResolution
                .determineDocsToUpdate(document, documentTargetDocuments, getInverseRelation)
                .forEach(assertInSameOperationWith(document));

            return documentTargetDocuments;
        }


        let totalDocsToUpdate: Array<Document> = [];
        for (let document of importDocuments) {
            totalDocsToUpdate = addOrOverwrite(totalDocsToUpdate, await getDocumentTargetDocsToUpdate(document));
        }
        return totalDocsToUpdate;
    }


    function addOrOverwrite(to: Array<Document>, from: Array<Document>) {

        const difference = subtractBy(on('resource.id'))(from)(to);
        return difference.concat(from);
    }


    function getTargetDocument(documents: Array<Document>, get: Function) {

        return async (targetId: string): Promise<Document> => {

            let targetDocument = documents
                .find(on('resource.id', is(targetId)));
            if (!targetDocument) try {
                targetDocument = clone(await get(targetId));
            } catch {
                throw [E.EXEC_MISSING_RELATION_TARGET, targetId]
            }
            return targetDocument as Document;
        }
    }


    function relationNamesExceptRecordedIn(document: Document) {

        return flow(
            document.resource.relations,
            keys,
            filter(isnt(LIES_WITHIN)),
            filter(isnt(RECORDED_IN))) as string[]; // TODO review, possibly all hierarchical relations
    }


    function targetIdsReferingToDbResources(document: Document,
                                            lookupDocument: LookupDocument) {

        return flow(relationNamesExceptRecordedIn(document),
            flatMap(lookup(document.resource.relations)),
            remove(compose(lookupDocument, isDefined)));
    }


    function setInverseRelationsForImportResource(importDocument: Document,
                                                  lookupDocument: LookupDocument,
                                                  addInverse: (_: Document) => (_: string) => [string, string],
                                                  relations: string[]): void {

        const addInverse_ = addInverse(importDocument);
        const inverseIsDefined = compose(nth(1), isDefined);
        const assertNotBadyInterrelated_ = assertNotBadlyInterrelated(importDocument);
        const setInverses_ = setInverses(importDocument, lookupDocument);

        flow<any>(relations,
            map(addInverse_),
            filter(inverseIsDefined),
            forEach(assertNotBadyInterrelated_),
            forEach(setInverses_));
    }


    function setInverses(importDocument: Document, lookupDocument: LookupDocument) {

        return ([relationName, inverseRelationName]: [string, string]) => {

            flow(
                importDocument.resource.relations[relationName],
                map(lookupDocument),
                filter(isDefined),
                forEach(assertInSameOperationWith(importDocument)),
                map(to('resource.relations')),
                forEach(setInverse(importDocument.resource.id, inverseRelationName)));
        }
    }


    function addInverse(getInverseRelation: (_: string) => string|undefined) {

        return (document: Document) =>  (relationName: string) => {

            if (isEmpty(document.resource.relations[relationName])) throw [E.EMPTY_RELATION, document.resource.identifier];

            const inverseRelationName = getInverseRelation(relationName);
            return [relationName, inverseRelationName] as [string, string];
        }
    }



    function assertNotBadlyInterrelated(document: Document) {

        return ([relationName, inverseRelationName]: [string, string]) => {

            const forbiddenRelations = [];
            if (relationName !== inverseRelationName)        forbiddenRelations.push(inverseRelationName);
            if ([IS_ABOVE, IS_BELOW].includes(relationName)) forbiddenRelations.push(IS_CONTEMPORARY_WITH);
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


    function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

        const documentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(document);
        const targetDocumentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(targetDocument);
        if (isNot(undefinedOrEmpty)(targetDocumentRecordedIn) && isNot(arrayEqual(targetDocumentRecordedIn))(documentRecordedIn)) {
            throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
        }
    }}


    const makeDocumentsLookup = makeLookup('resource.id');
}
