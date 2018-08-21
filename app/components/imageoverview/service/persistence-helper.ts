import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {ImageOverviewFacade} from '../view/imageoverview-facade';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {M} from '../../../m';
import {PersistenceManager} from "../../../core/model/persistence-manager";
import {UsernameProvider} from '../../../core/settings/username-provider';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PersistenceHelper {


    constructor(
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceManager: PersistenceManager,
        private usernameProvider: UsernameProvider,
        private imagestore: Imagestore
    ) {}


    public deleteSelectedImageDocuments(): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of this.imageOverviewFacade.getSelected()) {
                if (!document.resource.id) continue;
                const resourceId = document.resource.id;

                promise = promise.then(
                    () => this.imagestore.remove(resourceId),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.usernameProvider.getUsername()),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier])
                ).then(() => {
                    this.imageOverviewFacade.remove(document);
                })
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }


    public addRelationsToSelectedDocuments(targetDocument: IdaiFieldDocument): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let imageDocument of this.imageOverviewFacade.getSelected()) {
                const oldVersion = JSON.parse(JSON.stringify(imageDocument));

                const depictsEl = imageDocument.resource.relations.depicts;

                if (depictsEl.indexOf(targetDocument.resource.id as any) == -1) {
                    depictsEl.push(targetDocument.resource.id as any);
                }

                promise = promise.then(
                    () => this.persistenceManager.persist(imageDocument, this.usernameProvider.getUsername(), oldVersion),
                    msgWithParams => reject(msgWithParams)
                );
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }


    public removeRelationsOnSelectedDocuments() {

        const promises = [] as any;
        for (let document of this.imageOverviewFacade.getSelected()) {

            const oldVersion = JSON.parse(JSON.stringify(document));
            document.resource.relations.depicts = [];

            promises.push(this.persistenceManager.persist(
                document, this.usernameProvider.getUsername(),
                oldVersion) as never);
        }
        return Promise.all(promises);
    }
}