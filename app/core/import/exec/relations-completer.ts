import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {arrayEqual, asyncMap, filter, flatMap, flow, getOnOr, intersection, is, isDefined, isEmpty, isNot, isnt,
    isUndefinedOrEmpty, lookup, on, subtractBy, undefinedOrEmpty, union} from 'tsfun';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';
import {clone} from '../../util/object-util';
import {makeLookup} from '../util';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {

    type DocumentsLookup = {[id: string]: Document};

    const LIES_WITHIN = 'liesWithin';
    const RECORDED_IN = 'isRecordedIn';


    /**
     * Iterates over all relation (ex) of the given resources. Between import resources, it validates the relations.
     * Between import resources and db resources, it adds the inverses.
     *
     * @param importDocuments If one of these references another from the import file, the validity of the relations gets checked
     *   for contradictory relations and missing inverses are added.
     * @param get
     * @param getInverseRelation
     * @param mergeMode
     *
     * @returns the target importDocuments which should be updated. Only those fetched from the db are included. If a target document comes from
     *   the import file itself, <code>importDocuments</code> gets modified in place accordingly.
     *
     * side-effects: if an inverse of one of importDocuments is not set, it gets completed automatically.
     *   The document from importDocuments then gets modified in place.
     *
     * @throws ImportErrors.*
     * @throws [EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws [EMPTY_RELATION, resourceId]
     * @throws [BAD_INTERRELATION, sourceId]
     */
    export async function completeInverseRelations(importDocuments: Array<Document>,
                                                   get: (_: string) => Promise<Document>,
                                                   getInverseRelation: (_: string) => string|undefined,
                                                   mergeMode: boolean = false): Promise<Array<Document>> {

        const importDocumentsLookup = makeDocumentsLookup(importDocuments);

        for (let importDocument of importDocuments) {

            setInverseRelationsForImportResource(
                importDocument,
                importDocumentsLookup,
                getInverseRelation,
                relationNamesExceptRecordedIn(importDocument));
        }

        return await setInverseRelationsForDbResources(
            importDocuments,
            importDocumentsLookup,
            get,
            getInverseRelation,
            mergeMode);
    }


    async function setInverseRelationsForDbResources(importDocuments: Array<Document>,
                                                     importDocumentsLookup: DocumentsLookup,
                                                     get: (_: string) => Promise<Document>,
                                                     getInverseRelation: (_: string) => string|undefined,
                                                     mergeMode: boolean): Promise<Array<Document>> {

        async function getTargetIds(document: Document) {

            let targetIds = targetIdsReferingToObjects(document, importDocumentsLookup);
            if (mergeMode) {
                let oldVersion;
                try {
                    oldVersion = await get(document.resource.id);
                } catch { throw "FATAL existing version of document not found" }
                targetIds = union([targetIds, targetIdsReferingToObjects(oldVersion as any, importDocumentsLookup)]);
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
            .keys(document.resource.relations)
            .filter(isnt(LIES_WITHIN))
            .filter(isnt(RECORDED_IN))
    }


    function targetIdsReferingToObjects(document: Document,
                                        documentsLookup: DocumentsLookup) {

        return flow(relationNamesExceptRecordedIn(document),
            flatMap(lookup(document.resource.relations)),
            filter(targetId => !documentsLookup[targetId]));
    }


    function setInverseRelationsForImportResource(importDocument: Document,
                                                  importDocumentsLookup: DocumentsLookup,
                                                  getInverseRelation: (_: string) => string|undefined,
                                                  relations: string[]): void {

        relations
            .map(relationName => {

                if (isEmpty(importDocument.resource.relations[relationName])) throw [E.EMPTY_RELATION, importDocument.resource.identifier];

                const inverseRelationName = getInverseRelation(relationName);
                return [relationName, inverseRelationName] as [string, string];
            })
            .filter(([_, inverseRelationName]) => isDefined(inverseRelationName))
            .forEach(([relationName, inverseRelationName]) => {

                assertNotBadlyInterrelated(importDocument, relationName, inverseRelationName);

                importDocument.resource.relations[relationName]
                    .map(lookup(importDocumentsLookup))
                    .filter(isDefined)
                    .forEach(targetDocument => {
                        assertInSameOperation(importDocument, targetDocument);
                        setInverse(importDocument.resource.id, targetDocument.resource.relations, inverseRelationName);
                    });
            })
    }





    function assertNotBadlyInterrelated(document: Document,
                                        relationName: string,
                                        inverseRelationName: string) {

        if (relationName === inverseRelationName) return;
        if (isUndefinedOrEmpty(document.resource.relations[inverseRelationName])) return;

        const intersect  = intersection([document.resource.relations[relationName], document.resource.relations[inverseRelationName]]);
        if (intersect.length > 0) {
            throw [E.BAD_INTERRELATION, document.resource.identifier];
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
