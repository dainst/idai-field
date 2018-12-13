import {Document, ProjectConfiguration} from 'idai-components-2';
import {ImportErrors} from '../import-errors';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {


    /**
     * Iterates over all relations of the given resources and adds missing inverse relations to the relation targets.
     *
     * @throws [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws DatastoreErrors.*
     */
    export async function completeInverseRelations(get: (_: string) => Promise<Document>,
                                                   projectConfiguration: ProjectConfiguration,
                                                   documents: Array<Document>): Promise<Array<Document>> {


        let targetDocuments: Array<Document> = [];
        for (let document of documents) {
           targetDocuments = targetDocuments.concat(await setInverseRelationsForResource(get, projectConfiguration, document));
        }
        return targetDocuments;
    }


    /**
     * Creates/removes inverse relations for a single resource.
     */
    async function setInverseRelationsForResource(get: (_: string) => Promise<Document>,
                                                  projectConfiguration: ProjectConfiguration,
                                                  document: Document): Promise<Array<Document>> {

        const targetDocuments: Array<Document> = [];

        for (let relationName of Object
            .keys(document.resource.relations)
            .filter(relationName => relationName !== 'isRecordedIn')
            .filter(relationName => projectConfiguration.isRelationProperty(relationName))) {

            for (let targetId of document.resource.relations[relationName]) {

                let targetDocument;
                try {
                    targetDocument = await get(targetId);
                } catch {
                    throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId];
                }

                targetDocuments.push(await createRelation(document.resource.id, targetDocument,
                    projectConfiguration.getInverseRelations(relationName) as any));
            }
        }

        return targetDocuments;
    }


    async function createRelation(resourceId: string,
                                  targetDocument: Document,
                                  relationName: string): Promise<any> {

        let relations = targetDocument.resource.relations[relationName];

        if (!relations) relations = [];
        if (!relations.includes(resourceId)) {
            relations.push(resourceId);
            targetDocument.resource.relations[relationName] = relations;
            return targetDocument;
        }
    }
}
