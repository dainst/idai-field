import {Document} from 'idai-components-2';
import {ImportErrors} from './import-errors';
import {isUndefinedOrEmpty, isEmpty, union, flatMap, flow, filter} from 'tsfun';
import {ConnectedDocsResolution} from '../../model/connected-docs-resolution';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {


    /**
     * Iterates over all relation (ex) of the given resources. Between import resources, it validates the relations.
     * Between import resources and db resources, it adds the inverses.
     *
     * @param documents If one of these references another from the import file, the validity of the relations gets checked
     *   for contradictory relations and missing inverses are added.
     * @param get
     * @param isRelationProperty
     * @param getInverseRelation
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
                                                   isRelationProperty: (_: string) => boolean,
                                                   getInverseRelation: (_: string) => string|undefined): Promise<Array<Document>> {


        const documentsLookup = documents
            .reduce((documentsMap: {[id: string]: Document}, document: Document) => {
                documentsMap[document.resource.id] = document;
                return documentsMap;
            }, {});

        let allDBDocumentsToUpdate: Array<Document> = [];
        for (let document of documents) {

            const relationNamesExceptIsRecordedIn = Object
                .keys(document.resource.relations)
                .filter(relationName => relationName !== 'isRecordedIn')
                .filter(relationName => isRelationProperty(relationName));

            await setInverseRelationsForImportResource(
                document,
                documentsLookup,
                getInverseRelation,
                relationNamesExceptIsRecordedIn);

            const dbDocumentsToUpdate = await setInverseRelationsForDbResource(
                document,
                documentsLookup,
                get,
                isRelationProperty,
                getInverseRelation,
                relationNamesExceptIsRecordedIn);

            allDBDocumentsToUpdate = allDBDocumentsToUpdate.concat(dbDocumentsToUpdate);
        }
        return allDBDocumentsToUpdate;
    }



    async function setInverseRelationsForDbResource(document: Document,
                                                    documentsLookup: {[id: string]: Document},
                                                    get: (_: string) => Promise<Document>,
                                                    isRelationProperty: (_: string) => boolean,
                                                    getInverseRelation: (_: string) => string|undefined,
                                                    relationNamesExceptIsRecordedIn: string[]): Promise<Array<Document>> {

        const targetIdsReferingToDbObjects =
            flow(relationNamesExceptIsRecordedIn,
                flatMap(relationName => document.resource.relations[relationName]),
                filter(targetId => !documentsLookup[targetId]));

        const targetsDbObjects: Array<Document> = [];
        for (let targetId of targetIdsReferingToDbObjects) {
            try {
                targetsDbObjects.push(await get(targetId));
            } catch {
                throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId]
            }
        }
        return ConnectedDocsResolution.determineDocsToUpdate(
            document, targetsDbObjects, isRelationProperty, getInverseRelation);
    }



    async function setInverseRelationsForImportResource(document: Document,
                                                  documentsLookup: {[id: string]: Document},
                                                  getInverseRelation: (_: string) => string|undefined,
                                                  relationNamesExceptIsRecordedIn: string[]): Promise<void> {


        for (let relationName of relationNamesExceptIsRecordedIn) {
            if (isEmpty(document.resource.relations[relationName])) throw [ImportErrors.EMPTY_RELATION, document.resource.identifier];

            const inverseRelationName = getInverseRelation(relationName);
            if (!inverseRelationName) continue;

            if (!isUndefinedOrEmpty(document.resource.relations[inverseRelationName])) {
                const u  = union([document.resource.relations[relationName], document.resource.relations[inverseRelationName]]);
                if (u.length > 0) {
                    throw [ImportErrors.BAD_INTERRELATION,
                        document.resource.identifier,
                        documentsLookup[u[0]].resource.identifier];
                }
            }

            for (let targetId of document.resource.relations[relationName]) {
                let targetDocument = documentsLookup[targetId];

                if (targetDocument) {

                    if (isUndefinedOrEmpty(targetDocument.resource.relations[inverseRelationName])) {
                        targetDocument.resource.relations[inverseRelationName] = [];
                    }
                    if (!targetDocument.resource.relations[inverseRelationName].includes(document.resource.id)) {
                        targetDocument.resource.relations[inverseRelationName].push(document.resource.id);
                    }

                }
            }
        }
    }
}
