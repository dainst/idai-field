import {Document, ProjectConfiguration, Relations} from 'idai-components-2';
import {ImportErrors} from '../import-errors';
import {on} from 'tsfun';


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
     * @param projectConfiguration
     *
     * @returns the target documents which should be updated. Only those fetched from the db are included. If a target document comes from
     *   the import file itself, <code>documents</code> gets modified in place accordingly.
     *
     * side-effects: if an inverse of one of documents is not set, it gets completed automatically.
     *   The document from documents then gets modified in place.
     *
     * @throws ImportErrors.*
     * @throws [EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws DatastoreErrors.* TODO ?
     */
    export async function completeInverseRelations(documents: Array<Document>,
                                                   get: (_: string) => Promise<Document>,
                                                   projectConfiguration: ProjectConfiguration): Promise<Array<Document>> {


        let allDBDocumentsToUpdate: Array<Document> = [];
        for (let document of documents) {

            const dbDocumentsToUpdate = await setInverseRelationsForResource(
                documents.filter(doc => doc.resource.id !== document.resource.id),
                get, projectConfiguration, document.resource.relations, document.resource.id);

            allDBDocumentsToUpdate = allDBDocumentsToUpdate.concat(dbDocumentsToUpdate);
        }
        return allDBDocumentsToUpdate;
    }


    async function setInverseRelationsForResource(otherDocumentsFromImport: Array<Document>,
                                                  get: (_: string) => Promise<Document>,
                                                  projectConfiguration: ProjectConfiguration,
                                                  relations: Relations,
                                                  resourceId: string): Promise<Array<Document>> {

        const targetDocumentsForUpdate: Array<Document> = [];

        const relationNamesExceptRecordeIn = Object
            .keys(relations)
            .filter(relationName => relationName !== 'isRecordedIn')
            .filter(relationName => projectConfiguration.isRelationProperty(relationName));


        for (let relationName of relationNamesExceptRecordeIn) {

            for (let targetId of relations[relationName]) {

                let targetDocument = otherDocumentsFromImport.find(on('resource.id:')(targetId));

                if (targetDocument /* from import file */) {

                    // TODO validate and augment inverse if necessary

                } else /* from db */ {

                    try {

                        targetDocument = await get(targetId);

                        const targetDocumentForUpdate = await createRelation(resourceId, targetDocument,
                            projectConfiguration.getInverseRelations(relationName) as any);
                        if (targetDocumentForUpdate) targetDocumentsForUpdate.push(targetDocumentForUpdate);

                    } catch {

                        // TODO this could also be a reference within the import itself
                        throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId];
                    }
                }
            }
        }

        return targetDocumentsForUpdate;
    }


    async function createRelation(resourceId: string,
                                  targetDocument: Document,
                                  relationName: string): Promise<Document|undefined> {

        let relations = targetDocument.resource.relations[relationName];

        if (!relations) relations = [];
        if (!relations.includes(resourceId)) { // TODO this should not be necessary
            relations.push(resourceId);
            targetDocument.resource.relations[relationName] = relations;
            return targetDocument;
        }
    }
}
