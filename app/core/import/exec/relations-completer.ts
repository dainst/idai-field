import {Document} from 'idai-components-2';
import {ImportErrors} from '../import-errors';
import {isUndefinedOrEmpty, on} from 'tsfun';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {


    /**
     * Iterates over all relations of the given resources and adds missing inverse relations to the relation targets.
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
     */
    export async function completeInverseRelations(documents: Array<Document>,
                                                   get: (_: string) => Promise<Document>,
                                                   isRelationProperty: (_: string) => boolean,
                                                   getInverseRelation: (_: string) => string|undefined): Promise<Array<Document>> {


        let allDBDocumentsToUpdate: Array<Document> = [];
        for (let document of documents) {

            const dbDocumentsToUpdate = await setInverseRelationsForResource(
                documents.filter(doc => doc.resource.id !== document.resource.id),
                get,
                isRelationProperty,
                getInverseRelation,
                document);

            allDBDocumentsToUpdate = allDBDocumentsToUpdate.concat(dbDocumentsToUpdate);
        }
        return allDBDocumentsToUpdate;
    }


    async function setInverseRelationsForResource(otherDocumentsFromImport: Array<Document>,
                                                  get: (_: string) => Promise<Document>,
                                                  isRelationProperty: (_: string) => boolean,
                                                  getInverseRelation: (_: string) => string|undefined,
                                                  document: Document): Promise<Array<Document>> {

        const targetDocumentsForUpdate: Array<Document> = [];

        const relationNamesExceptRecordeIn = Object
            .keys(document.resource.relations)
            .filter(relationName => relationName !== 'isRecordedIn')
            .filter(relationName => isRelationProperty(relationName));


        for (let relationName of relationNamesExceptRecordeIn) {
            const inverseRelationName = getInverseRelation(relationName);
            if (!inverseRelationName) continue;

            for (let targetId of document.resource.relations[relationName]) {
                let targetDocument = otherDocumentsFromImport.find(on('resource.id:')(targetId));

                if (targetDocument /* from import file */) {

                    if (isUndefinedOrEmpty(targetDocument.resource.relations[inverseRelationName])) {
                        throw [ImportErrors.NOT_INTERRELATED, document.resource.identifier, targetDocument.resource.identifier];
                    }
                    if (!targetDocument.resource.relations[inverseRelationName].includes(document.resource.id)) {
                        throw [ImportErrors.NOT_INTERRELATED, document.resource.identifier, targetDocument.resource.identifier];
                    }

                    // TODO also validate that they interrelate not mutually, for example both have isAfter as well as isBefore pointing to each other
                    // TODO throw on empty but defined relations

                } else /* from db */ {

                    try {

                        targetDocument = await get(targetId);
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
