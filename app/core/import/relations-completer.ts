import {Document, ProjectConfiguration} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ImportErrors} from './import-errors';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module RelationsCompleter {


    /**
     * Iterates over all relations of the given resources and adds missing inverse relations to the relation targets.
     *
     * @param get
     * @param projectConfiguration
     * @param resourceIds The ids of the resources whose relations are to be considered
     * @throws [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws DatastoreErrors.*
     */
    export async function completeInverseRelations(get: (_: string) => Promise<Document>,
                                                   projectConfiguration: ProjectConfiguration,
                                                   resourceIds: string[]): Promise<Array<Document>> {


        let targetDocuments: Array<Document> = [];
        for (let resourceId of resourceIds) {
           targetDocuments = targetDocuments.concat(await alterInverseRelationsForResource(get, projectConfiguration, resourceId));
        }
        return targetDocuments;
    }


    /**
     * TODO remove this altogether
     *
     * Iterates over all relations of the given resources and removes the corresponding inverse relations of the
     * relation targets.
     *
     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param resourceIds The ids of the resources whose relations are to be considered
     * @throws DatastoreErrors.*
     */
    export async function resetInverseRelations(datastore: DocumentDatastore,
                                                projectConfiguration: ProjectConfiguration,
                                                username: string,
                                                resourceIds: string[]): Promise<void> {

        for (let resourceId of resourceIds) await removeInverseRelationsForResource(
                datastore, projectConfiguration,
                username, resourceId);
    }


    /**
     * Creates/removes inverse relations for a single resource.

     * @param get
     * @param projectConfiguration
     * @param resourceId
     * @throws errWithParams
     */
    async function alterInverseRelationsForResource(get: (_: string) => Promise<Document>,
                                                    projectConfiguration: ProjectConfiguration,
                                                    resourceId: string): Promise<Array<Document>> {

        const document = await get(resourceId);
        if (!document) throw "FATAL - DOCUMENT NOT FOUND, RESOURCEID: " + resourceId;

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

                targetDocuments.push(await createRelation(resourceId, targetDocument,
                    projectConfiguration.getInverseRelations(relationName) as any));
            }
        }

        return targetDocuments;
    }


    /**
     * Creates/removes inverse relations for a single resource.

     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param resourceId
     * @throws errWithParams
     */
    async function removeInverseRelationsForResource(datastore: DocumentDatastore,
                                                     projectConfiguration: ProjectConfiguration,
                                                     username: string,
                                                     resourceId: string): Promise<void> {

        // here we have a document with outgoing relations

        const document = await datastore.get(resourceId);
        if (!document) throw "FATAL - DOCUMENT NOT FOUND, RESOURCEID: " + resourceId;

        for (let relationName of Object
            .keys(document.resource.relations)
            .filter(relationName => relationName !== 'isRecordedIn')
            .filter(relationName => projectConfiguration.isRelationProperty(relationName))) {

            // here we have one range relation

            for (let targetIdOrIdentifier of document.resource.relations[relationName]) {

                // here we have on range relation document

                let targetDocument;
                try {
                    targetDocument = await datastore.get(targetIdOrIdentifier);
                } catch { continue }

                const inverseRelation = projectConfiguration.getInverseRelations(relationName) as any;
                await removeRelation(datastore, username, resourceId, targetDocument, inverseRelation);
            }

        }
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


    async function removeRelation(datastore: DocumentDatastore,
                                  username: string,
                                  resourceId: string,
                                  targetDocument: Document,
                                  relationName: string): Promise<any> {

        const relations = targetDocument.resource.relations[relationName];
        if (!relations || relations.indexOf(resourceId) === -1) return;
        else {
            relations.splice(relations.indexOf(resourceId), 1);
            targetDocument.resource.relations[relationName] = relations;
            await datastore.update(targetDocument, username);
        }
    }
}
