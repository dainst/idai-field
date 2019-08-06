import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {arrayEqual, asyncMap, filter, flatMap, flow, getOnOr, intersect, is, isDefined, isEmpty, isNot, isnt,
    isUndefinedOrEmpty, lookup, on, subtractBy, undefinedOrEmpty, union, map, forEach, remove, nth, compose} from 'tsfun';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';
import {clone} from '../../util/object-util';
import {makeLookup} from '../util';
import {LIES_WITHIN, RECORDED_IN} from '../../../c';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {

    type LookupDocument = (_: string) => Document|undefined; // TODO fix typing of lookup itself, see tsfun todos


    /**
     * Iterates over all relation (ex) of the given resources. Between import resources, it validates the relations.
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
         * @param mergeMode
         *
         * @SIDE_EFFECTS: if an inverse of one of importDocuments is not set, it gets completed automatically.
         *   The document from importDocuments then gets modified in place.
         *
         * @returns the target importDocuments which should be updated. Only those fetched from the db are included. If a target document comes from
         *   the import file itself, <code>importDocuments</code> gets modified in place accordingly.
         *
         * @throws ImportErrors.*
         * @throws [EXEC_MISSING_RELATION_TARGET, targetId]
         * @throws [EMPTY_RELATION, resourceId]
         * @throws [BAD_INTERRELATION, sourceId]
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
                let oldVersion;
                try {
                    oldVersion = await get(document.resource.id);
                } catch { throw "FATAL existing version of document not found" }
                targetIds = union([targetIds, targetIdsReferingToDbResources(oldVersion as any, lookupDocument)]);
            }
            return targetIds;
        }


        async function getDocumentTargetDocsToUpdate(document: Document) {

            const targetIds = await getTargetIds(document);

            const documentTargetDocuments = await asyncMap<any>(getTargetDocument(totalDocsToUpdate, get))(targetIds);

            const documentTargetDocsToUpdate = ConnectedDocsResolution.determineDocsToUpdate(
                document, documentTargetDocuments, getInverseRelation);

            for (let targetDocument of documentTargetDocsToUpdate) {
                assertInSameOperation(document, targetDocument);
            }
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

        return Object
            .keys(document.resource.relations) // TODO replace with flow, keys
            .filter(isnt(LIES_WITHIN))
            .filter(isnt(RECORDED_IN)) // TODO review, possibly all hierarchical relations
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

            importDocument.resource.relations[relationName]
                .map(lookupDocument)
                .filter(isDefined)
                .forEach((targetDocument: Document) => {
                    assertInSameOperation(importDocument, targetDocument);
                    setInverse(importDocument.resource.id, targetDocument.resource.relations, inverseRelationName);
                });
        }
    }


    function addInverse(getInverseRelation: (_: string) => string|undefined) {

        return (importDocument: Document) => {

            return (relationName: string) => {

                if (isEmpty(importDocument.resource.relations[relationName])) throw [E.EMPTY_RELATION, importDocument.resource.identifier];

                const inverseRelationName = getInverseRelation(relationName);
                return [relationName, inverseRelationName] as [string, string];
            }
        }
    }



    function assertNotBadlyInterrelated(document: Document) {

        const relations = document.resource.relations;

        return ([relationName, inverseRelationName]: [string, string]) => {

            if (relationName === inverseRelationName) return;
            if (isUndefinedOrEmpty(relations[inverseRelationName])) return;

            const intersection  = intersect(relations[relationName])(relations[inverseRelationName]);
            if (intersection.length > 0) {
                throw [E.BAD_INTERRELATION, document.resource.identifier];
            }
        }
    }


    function setInverse(resourceId: string, targetDocumentRelations: Relations, inverseRelationName: string) {

        if (isUndefinedOrEmpty(targetDocumentRelations[inverseRelationName])) {
            targetDocumentRelations[inverseRelationName] = [];
        }
        if (!targetDocumentRelations[inverseRelationName].includes(resourceId)) {
            targetDocumentRelations[inverseRelationName].push(resourceId);
        }
    }


    function assertInSameOperation(document: Document, targetDocument: Document) {

        const documentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(document);
        const targetDocumentRecordedIn = getOnOr('resource.relations.' + RECORDED_IN, undefined)(targetDocument);
        if (isNot(undefinedOrEmpty)(targetDocumentRecordedIn) && isNot(arrayEqual(targetDocumentRecordedIn))(documentRecordedIn)) {
            throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
        }
    }


    const makeDocumentsLookup = makeLookup('resource.id');
}
