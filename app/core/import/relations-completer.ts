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
     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param resourceIds The ids of the resources whose relations are to be considered
     * @throws [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId]
     * @throws DatastoreErrors.*
     */
    export async function completeInverseRelations(datastore: DocumentDatastore,
                                                   projectConfiguration: ProjectConfiguration,
                                                   username: string,
                                                   resourceIds: string[]): Promise<void> {

        for (let resourceId of resourceIds) await alterInverseRelationsForResource(
                datastore, projectConfiguration,
                username, 'create', resourceId);

    }


    /**
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

        for (let resourceId of resourceIds) await alterInverseRelationsForResource(
                datastore, projectConfiguration,
                username, 'remove', resourceId);
    }


    /**
     * Creates/removes inverse relations for a single resource.

     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param mode
     * @param resourceId
     * @throws errWithParams
     */
    async function alterInverseRelationsForResource(datastore: DocumentDatastore,
                                                    projectConfiguration: ProjectConfiguration,
                                                    username: string,
                                                    mode: 'create' | 'remove',
                                                    resourceId: string): Promise<void> {

            const document = await datastore.get(resourceId);
            if (!document) throw "FATAL - DOCUMENT NOT FOUND, RESOURCEID: " + resourceId;

            for (let relationName of Object
                    .keys(document.resource.relations)
                    .filter(relationName => relationName !== 'isRecordedIn')
                    .filter(relationName => projectConfiguration.isRelationProperty(relationName))) {

                for (let targetIdOrIdentifier of document.resource.relations[relationName]) {

                    let targetDocument;
                    try {
                        targetDocument = await datastore.get(targetIdOrIdentifier);
                    } catch (_) {
                        if (mode === 'create') throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetIdOrIdentifier];
                        else continue;
                    }

                    const inverseRelation = projectConfiguration.getInverseRelations(relationName) as any;
                    mode === 'create'
                        ? await createRelation(datastore, username, resourceId, targetDocument, inverseRelation)
                        : await removeRelation(datastore, username, resourceId, targetDocument, inverseRelation);
                }

            }
    }


    async function createRelation(datastore: DocumentDatastore,
                                  username: string,
                                  resourceId: string,
                                  targetDocument: Document,
                                  relationName: string): Promise<any> {

        let relations = targetDocument.resource.relations[relationName];

        if (!relations) relations = [];
        if (!relations.includes(resourceId)) {
            relations.push(resourceId);
                targetDocument.resource.relations[relationName] = relations;
                await datastore.update(targetDocument, username);
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
