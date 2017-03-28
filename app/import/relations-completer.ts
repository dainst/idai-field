import {Injectable} from '@angular/core';
import {Datastore} from 'idai-components-2/datastore';
import {ConfigLoader} from 'idai-components-2/configuration';
import {Resource} from 'idai-components-2/core';
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
            this.completeRelationsForResource(resourceIds[resourceIndex]).then(
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

    private completeRelationsForResource(resourceId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.datastore.get(resourceId).then(
                document => {
                    this.getNamesOfExistingRelations(document.resource).then(
                        relationNames => {
                            if (relationNames.length > 0) {
                                return this.createInverseRelations(document.resource, relationNames);
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

    private createInverseRelations(resource: Resource, relationNames: string[],
                                   relationNameIndex: number = 0, targetIndex: number = 0): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let relationName = relationNames[relationNameIndex];
            let targetId = resource.relations[relationName][targetIndex];

            this.createInverseRelationIfNotExisting(resource, targetId, relationName).then(
                () => {
                    if (targetIndex < resource.relations[relationName].length - 1) {
                        targetIndex++;
                    } else if (relationNameIndex < relationNames.length - 1) {
                        relationNameIndex++;
                        targetIndex = 0;
                    } else {
                        return resolve();
                    }

                    this.createInverseRelations(resource, relationNames, relationNameIndex, targetIndex).then(
                        () => resolve(),
                        err => reject(err)
                    );
                }, err => reject(err)
            )
        });
    }

    private createInverseRelationIfNotExisting(resource: Resource, targetId: string,
                                               relationName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.configLoader.getProjectConfiguration().then(projectConfiguration => {

                let inverseRelationName = projectConfiguration.getInverseRelations(relationName);

                this.datastore.get(targetId).then(
                    targetDocument => {
                        var relations = targetDocument.resource.relations[inverseRelationName];
                        if (!relations) relations = [];
                        if (relations.indexOf(resource.id) == -1) {
                            relations.push(resource.id);
                            targetDocument.resource.relations[inverseRelationName] = relations;
                            this.datastore.update(targetDocument).then(
                                doc => resolve(),
                                err => reject(err)
                            );
                        } else resolve();
                    }, () => {
                        reject([M.IMPORT_FAILURE_MISSING_RELATION_TARGET, targetId]);
                    }
                );

            });
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