import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from './import-errors';
import {filter, flatMap, flow, getOnOr, isDefined, asyncMap, isNot, undefinedOrEmpty,
    isEmpty, isnt, isUndefinedOrEmpty, on, subtractBy, union, arrayEqual, is
} from 'tsfun';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';
import {clone} from '../../util/object-util';


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
     * @param documents If one of these references another from the import file, the validity of the relations gets checked
     *   for contradictory relations and missing inverses are added.
     * @param get
     * @param getInverseRelation
     * @param mergeMode
     *
     * @returns the target documents which should be updated. Only those fetched from the db are included. If a target document comes from
     *   the import file itself, <code>documents</code> gets modified in place accordingly.
     *
     * side-effects: if an inverse of one of documents is not set, it gets completed automatically.
     *   The document from documents then gets modified in place.
     *
     * @throws ImportErrors.*
     * @throws [EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws [NOT_INTERRELATED, sourceId, targetId]
     * @throws [EMPTY_RELATION, resourceId]
     */
    export async function completeInverseRelations(documents: Array<Document>,
                                                   get: (_: string) => Promise<Document>,
                                                   getInverseRelation: (_: string) => string|undefined,
                                                   mergeMode: boolean = false): Promise<Array<Document>> {


        const documentsLookup: DocumentsLookup = documents
            .reduce((documentsMap: {[id: string]: Document}, document: Document) => {
                documentsMap[document.resource.id] = document;
                return documentsMap;
            }, {});

        for (let document of documents) {

            setInverseRelationsForImportResource(
                document,
                documentsLookup,
                getInverseRelation,
                relationNamesExceptRecordedIn(document));
        }

        return await setInverseRelationsForDbResources(
            documents,
            documentsLookup,
            get,
            getInverseRelation,
            mergeMode);
    }


    async function setInverseRelationsForDbResources(documents: Array<Document>,
                                                     documentsLookup: DocumentsLookup,
                                                     get: (_: string) => Promise<Document>,
                                                     getInverseRelation: (_: string) => string|undefined,
                                                     mergeMode: boolean): Promise<Array<Document>> {

        async function getTargetIds(document: Document) {

            let targetIds = targetIdsReferingToObjects(document, documentsLookup);
            if (mergeMode) {
                let oldVersion;
                try {
                    oldVersion = await get(document.resource.id);
                } catch { throw "FATAL existing version of document not found" }
                targetIds = union([targetIds, targetIdsReferingToObjects(oldVersion as any, documentsLookup)]);
            }
            return targetIds;
        }


        async function getDocumentTargetDocsToUpdate(document: Document) {

            const documentTargetDocs: Array<Document> = await asyncMap(
                async (targetId: any) => getTargetDocument(targetId, totalDocsToUpdate, get))
            (await getTargetIds(document));

            const documentTargetDocsToUpdate = ConnectedDocsResolution.determineDocsToUpdate(
                document, documentTargetDocs, getInverseRelation);

            for (let targetDocument of documentTargetDocsToUpdate) {
                assertInSameOperation(document, targetDocument);
            }
            return documentTargetDocs;
        }


        let totalDocsToUpdate: Array<Document> = [];
        for (let document of documents) {
            totalDocsToUpdate = addOrOverwrite(totalDocsToUpdate, await getDocumentTargetDocsToUpdate(document));
        }
        return totalDocsToUpdate;
    }


    function addOrOverwrite(to: Array<Document>, from: Array<Document>) {

        const difference = subtractBy(on('resource.id'))(from)(to);
        return difference.concat(from);
    }


    async function getTargetDocument(targetId: string,
                                     totalDocsToUpdate: Array<Document>,
                                     get: Function): Promise<Document> {

        let targetDocument = totalDocsToUpdate
            .find(on('resource.id', is(targetId)));
        if (!targetDocument) try {
            targetDocument = clone(await get(targetId));
        } catch {
            throw [E.EXEC_MISSING_RELATION_TARGET, targetId]
        }
        return targetDocument as Document;
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
            flatMap(relationName => document.resource.relations[relationName]),
            filter(targetId => !documentsLookup[targetId]));
    }


    function setInverseRelationsForImportResource(document: Document,
                                                  documentsLookup: DocumentsLookup,
                                                  getInverseRelation: (_: string) => string|undefined,
                                                  relations: string[]): void {


        relations
            .forEach(relationName => {

                if (isEmpty(document.resource.relations[relationName])) throw [E.EMPTY_RELATION, document.resource.identifier];

                const inverseRelationName = getInverseRelation(relationName);
                if (!inverseRelationName) return;

                assertNotBadlyInterrelated(document, relationName, inverseRelationName, documentsLookup);

                document.resource.relations[relationName]
                    .map(targetId => documentsLookup[targetId])
                    .filter(isDefined)
                    .forEach(targetDocument => {
                        assertInSameOperation(document, targetDocument);
                        setInverse(document.resource.id, targetDocument.resource.relations, inverseRelationName);
                    });
            })
    }


    function assertNotBadlyInterrelated(document: Document,
                                        relationName: string,
                                        inverseRelationName: string,
                                        documentsLookup: DocumentsLookup) {

        if (!isUndefinedOrEmpty(document.resource.relations[inverseRelationName])) {
            const u  = union([document.resource.relations[relationName], document.resource.relations[inverseRelationName]]);
            if (u.length > 0) {
                throw [E.BAD_INTERRELATION,
                    document.resource.identifier,
                    documentsLookup[u[0]].resource.identifier];
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

        const documentRecordedIn = getOnOr(document, undefined)('resource.relations.' + RECORDED_IN);
        const targetDocumentRecordedIn = getOnOr(targetDocument, undefined)('resource.relations.' + RECORDED_IN);
        if (isNot(undefinedOrEmpty)(targetDocumentRecordedIn) && isNot(arrayEqual(targetDocumentRecordedIn))(documentRecordedIn)) {
            throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
        }
    }
}
