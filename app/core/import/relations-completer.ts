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
                                             resourceIds: string[]): Promise<any> {

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
                                          resourceIds: string[]): Promise<any> {

        for (let resourceId of resourceIds) await alterInverseRelationsForResource(
                datastore, projectConfiguration,
                username, 'remove', resourceId);
    }


    /**
     * Creates/removes inverse relations for a single resource.

     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param mode: Can be either 'create' or 'remove'
     * @param resourceId
     * @throws errWithParams
     */
    async function alterInverseRelationsForResource(datastore: DocumentDatastore,
                                             projectConfiguration: ProjectConfiguration,
                                             username: string,
                                             mode: string, resourceId: string): Promise<any> {

            const document = await datastore.get(resourceId);

            for (let relationName in document.resource.relations) {
                if (relationName === 'isRecordedIn') continue;
                if (!projectConfiguration.isRelationProperty(relationName)) continue;

                for (let targetId of document.resource.relations[relationName]) {

                    let targetDocument = undefined;
                    try {
                        targetDocument = await datastore.get(targetId);
                    } catch (_) {
                        if (mode === 'remove') continue;
                        else throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId];
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
            if (relations.indexOf(resourceId) === -1) {
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
