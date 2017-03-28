import {Injectable} from '@angular/core';
import {Datastore} from 'idai-components-2/datastore';
import {ConfigLoader} from 'idai-components-2/configuration';
import {Document, Resource} from 'idai-components-2/core';
import {M} from '../m';

/**
 * @author Thomas Kleinke
 */
@Injectable()
export class RelationsCompleter {

    constructor(private datastore: Datastore,
                private configLoader: ConfigLoader) {
    }

    public completeRelations(resourceIds: string[], resourceIndex = 0): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.processRelationsForResource('create', resourceIds[resourceIndex]).then(
                () => {
                    if (resourceIndex < resourceIds.length - 1) {
                        this.completeRelations(resourceIds, ++resourceIndex).then(
                            () => resolve(),
                            err => reject(err)
                        );
                    } else resolve();
                }, err => reject(err)
            );
        });
    }

    public resetRelations(resourceIds: string[], resourceIndex = 0): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.processRelationsForResource('remove', resourceIds[resourceIndex]).then(
                () => {
                    if (resourceIndex < resourceIds.length - 1) {
                        this.resetRelations(resourceIds, ++resourceIndex).then(
                            () => resolve(),
                            err => reject(err)
                        );
                    } else resolve();
                }, err => reject(err)
            );
        });
    }

    /**
     * @param mode: Can be either 'create' or 'remove'
     */
    private processRelationsForResource(mode: string, resourceId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.datastore.get(resourceId).then(
                document => {
                    this.getNamesOfExistingRelations(document.resource).then(
                        relationNames => {
                            if (relationNames.length > 0) {
                                return this.processInverseRelations(mode, document.resource, relationNames);
                            } else resolve();
                        }, err => reject(err)
                    ).then(
                        () => resolve(),
                        err => reject(err)
                    );
                },
                err => reject(err)
            );
        });
    }

    private processInverseRelations(mode: string, resource: Resource, relationNames: string[],
                                    relationNameIndex: number = 0, targetIndex: number = 0): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relationName = relationNames[relationNameIndex];
            let targetId = resource.relations[relationName][targetIndex];

            this.processInverseRelation(mode, resource, targetId, relationName).then(
                () => {
                    if (targetIndex < resource.relations[relationName].length - 1) {
                        targetIndex++;
                    } else if (relationNameIndex < relationNames.length - 1) {
                        relationNameIndex++;
                        targetIndex = 0;
                    } else {
                        return resolve();
                    }

                    this.processInverseRelations(mode, resource, relationNames, relationNameIndex, targetIndex).then(
                        () => resolve(),
                        err => reject(err)
                    );
                }, err => reject(err)
            )
        });
    }

    private processInverseRelation(mode: string, resource: Resource, targetId: string,
                                   relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.configLoader.getProjectConfiguration().then(projectConfiguration => {

                let inverseRelationName = projectConfiguration.getInverseRelations(relationName);

                this.datastore.get(targetId).then(
                    targetDocument => {
                        let promise;
                        switch(mode) {
                            case 'create':
                                promise = this.createRelation(resource, targetDocument, inverseRelationName);
                                break;
                            case 'remove':
                                promise = this.removeRelation(resource, targetDocument, inverseRelationName);
                                break;
                        }
                        promise.then(
                            () => resolve(),
                            err => reject(err)
                        )
                    }, () => {
                        switch(mode) {
                            case 'create':
                                reject([M.IMPORT_FAILURE_MISSING_RELATION_TARGET, targetId]);
                                break;
                            case 'remove':
                                resolve();
                                break;
                        }
                    }
                );

            });
        });
    }

    private createRelation(resource: Resource, targetDocument: Document, relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relations = targetDocument.resource.relations[relationName];
            if (!relations) relations = [];
            if (relations.indexOf(resource.id) == -1) {
                relations.push(resource.id);
                targetDocument.resource.relations[relationName] = relations;
                this.datastore.update(targetDocument).then(
                    doc => resolve(),
                    err => reject(err)
                );
            } else resolve();
        });
    }

    private removeRelation(resource: Resource, targetDocument: Document, relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relations = targetDocument.resource.relations[relationName];
            if (!relations || relations.indexOf(resource.id) == -1) {
                resolve();
            } else {
                relations.splice(relations.indexOf(resource.id), 1);
                targetDocument.resource.relations[relationName] = relations;
                this.datastore.update(targetDocument).then(
                    doc => resolve(),
                    err => reject(err)
                );
            }
        });
    }

    private getNamesOfExistingRelations(resource: Resource): Promise<string[]> {

        return new Promise<any>((resolve) => {

            let relationNames: string[] = [];

            this.configLoader.getProjectConfiguration().then(projectConfiguration => {

                for (let relationName in resource.relations) {
                    if (projectConfiguration.isRelationProperty(relationName)) {
                        relationNames.push(relationName);
                    }
                }

                resolve(relationNames);
            });
        });
    }
}