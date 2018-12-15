import {Document} from 'idai-components-2';
import {ImportErrors} from './import-errors';
import {isUndefinedOrEmpty, isEmpty, union} from 'tsfun';


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


        const documentsMap: {[id: string]: Document} = documents.reduce((documentsMap: {[id: string]: Document}, document: Document) => {
            documentsMap[document.resource.id] = document;
            return documentsMap;
        }, {});

        let allDBDocumentsToUpdate: Array<Document> = [];
        for (let document of documents) {

            const dbDocumentsToUpdate = await setInverseRelationsForResource(
                document,
                documentsMap,
                get,
                isRelationProperty,
                getInverseRelation);

            allDBDocumentsToUpdate = allDBDocumentsToUpdate.concat(dbDocumentsToUpdate);
        }
        return allDBDocumentsToUpdate;
    }


    /**
     * Implementation note:
     * Time complexity is supposed to be around O([x<n]*n).
     * The for loops over the different relations and relations targets are no problem.
     * The x stands for the corresponding lookup times.
     * The n is for the for loop in the call.
     */
    async function setInverseRelationsForResource(document: Document,
                                                  documentsMap: {[id: string]: Document},
                                                  get: (_: string) => Promise<Document>,
                                                  isRelationProperty: (_: string) => boolean,
                                                  getInverseRelation: (_: string) => string|undefined): Promise<Array<Document>> {

        const targetDocumentsForUpdate: Array<Document> = [];

        const relationNamesExceptIsRecordedIn = Object
            .keys(document.resource.relations)
            .filter(relationName => relationName !== 'isRecordedIn')
            .filter(relationName => isRelationProperty(relationName));


        for (let relationName of relationNamesExceptIsRecordedIn) {
            if (isEmpty(document.resource.relations[relationName])) throw [ImportErrors.EMPTY_RELATION, document.resource.identifier];

            const inverseRelationName = getInverseRelation(relationName);
            if (!inverseRelationName) continue;

            if (!isUndefinedOrEmpty(document.resource.relations[inverseRelationName])) {
                const u  = union([document.resource.relations[relationName], document.resource.relations[inverseRelationName]]);
                if (u.length > 0) {
                    throw [ImportErrors.NOT_INTERRELATED,
                        document.resource.identifier,
                        documentsMap[u[0]].resource.identifier]; // x
                }
            }


            for (let targetId of document.resource.relations[relationName]) {
                let targetDocument = documentsMap[targetId]; // x

                if (targetDocument /* from import file */) {

                    if (isUndefinedOrEmpty(targetDocument.resource.relations[inverseRelationName])
                        || !targetDocument.resource.relations[inverseRelationName].includes(document.resource.id)) {

                        throw [ImportErrors.NOT_INTERRELATED,
                            document.resource.identifier,
                            targetDocument.resource.identifier];
                    }

                } else /* from db */ {

                    try {

                        targetDocument = await get(targetId); // x
                        if (!targetDocument.resource.relations[inverseRelationName]) targetDocument.resource.relations[inverseRelationName] = [];
                        targetDocument.resource.relations[inverseRelationName].push(document.resource.id);
                        targetDocumentsForUpdate.push(targetDocument);

                    } catch { throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId] }
                }
            }
        }

        return targetDocumentsForUpdate;
    }
}
