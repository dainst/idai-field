import {Document, ProjectConfiguration, Resource} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ImportErrors} from './import-errors';

/**
 * @author Thomas Kleinke
 */
export module RelationsCompleter {


    /**
     * Iterates over all relations of the given resources and adds missing inverse relations to the relation targets.
     *
     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param resourceIds The ids of the resources whose relations are to be considered
     */
    export async function completeInverseRelations(datastore: DocumentDatastore,
                                             projectConfiguration: ProjectConfiguration,
                                             username: string,
                                             resourceIds: string[]): Promise<any> {

        for (let resourceId of resourceIds) {
            try {
                await alterInverseRelationsForResource(
                    datastore, projectConfiguration,
                    username, 'create', resourceId)
            } catch (errWithParams) {
                throw errWithParams;
            }
        }
    }


    /**
     * Iterates over all relations of the given resources and removes the corresponding inverse relations of the
     * relation targets.
     *
     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param resourceIds The ids of the resources whose relations are to be considered
     */
    export async function resetInverseRelations(datastore: DocumentDatastore,
                                          projectConfiguration: ProjectConfiguration,
                                          username: string,
                                          resourceIds: string[]): Promise<any> {

        for (let resourceId of resourceIds) {
            try {
                await alterInverseRelationsForResource(
                    datastore, projectConfiguration,
                    username, 'remove', resourceId)
            } catch (errWithParams) {
                throw errWithParams;
            }
        }
    }


    /**
     * Creates/removes inverse relations for a single resource.

     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param mode: Can be either 'create' or 'remove'
     * @param resourceId
     */
    function alterInverseRelationsForResource(datastore: DocumentDatastore,
                                             projectConfiguration: ProjectConfiguration,
                                             username: string,
                                             mode: string, resourceId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            datastore.get(resourceId).then(
                document => {

                        let promise: Promise<any> = new Promise<any>((res) => res());

                        for (let relationName in document.resource.relations) {
                            if (relationName == 'isRecordedIn') continue;

                            if (projectConfiguration.isRelationProperty(relationName)) {
                                for (let targetId of document.resource.relations[relationName]) {
                                    promise = promise.then(
                                        () => alterRelation(
                                            datastore, projectConfiguration, username,
                                            mode, document.resource, targetId,
                                            projectConfiguration.getInverseRelations(relationName) as any),
                                        err => reject(err)
                                    );
                                }
                            }
                        }

                        promise.then(
                            () => resolve(),
                            err => reject(err)
                        );
                    }
                ,
                err => reject(err)
            );
        });
    }


    /**
     * Either adds (in mode 'create') oder removes (in mode 'remove') an relation.
     * @param datastore
     * @param projectConfiguration
     * @param username
     * @param mode Can be either 'create' or 'remove'
     * @param resource
     * @param targetId
     * @param relationName
     */
    function alterRelation(datastore: DocumentDatastore,
                          projectConfiguration: ProjectConfiguration,
                          username: string,
                          mode: string, resource: Resource, targetId: string,
                          relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            datastore.get(targetId).then(
                targetDocument => {
                    let promise;
                    switch (mode) {
                        case 'create':
                            promise = createRelation(datastore, username, resource, targetDocument, relationName);
                            break;
                        case 'remove':
                            promise = removeRelation(datastore, username, resource, targetDocument, relationName);
                            break;
                    }
                    (promise as any).then(
                        () => resolve(),
                        (err: any) => reject(err)
                    )
                }, () => {
                    switch (mode) {
                        case 'create':
                            reject([ImportErrors.EXEC_MISSING_RELATION_TARGET, targetId]);
                            break;
                        case 'remove':
                            resolve();
                            break;
                    }
                }
            );
        });
    }


    function createRelation(datastore: DocumentDatastore,
                           username: string,
                           resource: Resource, targetDocument: Document, relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relations = targetDocument.resource.relations[relationName];
            if (!relations) relations = [];
            if (relations.indexOf(resource.id as any) == -1) {
                relations.push(resource.id as any);
                targetDocument.resource.relations[relationName] = relations;
                datastore.update(targetDocument, username).then(
                    doc => resolve(),
                    err => reject(err)
                );
            } else resolve();
        });
    }


    function removeRelation(datastore: DocumentDatastore,
                           username: string,
                           resource: Resource, targetDocument: Document, relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relations = targetDocument.resource.relations[relationName];
            if (!relations || relations.indexOf(resource.id as any) == -1) {
                resolve();
            } else {
                relations.splice(relations.indexOf(resource.id as any), 1);
                targetDocument.resource.relations[relationName] = relations;
                datastore.update(targetDocument, username).then(
                    doc => resolve(),
                    err => reject(err)
                );
            }
        });
    }
}
