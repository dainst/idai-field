import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MediaOverviewFacade} from '../view/media-overview-facade';
import {SettingsService} from '../../../core/settings/settings-service';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {M} from '../../../m';
import {PersistenceManager} from '../../../core/persist/persistence-manager';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PersistenceHelper {

    constructor(
        private mediaOverviewFacade: MediaOverviewFacade,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private imagestore: Imagestore
    ) {}


    public deleteSelectedMediaDocuments(): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of this.mediaOverviewFacade.getSelected()) {
                if (!document.resource.id) continue;
                const resourceId = document.resource.id;

                promise = promise.then(
                    // TODO Remove 3d files correctly
                    () => this.imagestore.remove(resourceId),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.settingsService.getUsername(), [document]),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier]) // TODO get rid of M, return datastore errWithParams
                ).then(() => {
                    this.mediaOverviewFacade.remove(document);
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

            for (let mediaDocument of this.mediaOverviewFacade.getSelected()) {
                const oldVersion = JSON.parse(JSON.stringify(mediaDocument));

                const depictsEl = mediaDocument.resource.relations.depicts;

                if (depictsEl.indexOf(targetDocument.resource.id as any) == -1) {
                    depictsEl.push(targetDocument.resource.id as any);
                }

                promise = promise.then(
                    () => this.persistenceManager.persist(mediaDocument, this.settingsService.getUsername(),
                        [oldVersion]),
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
        for (let document of this.mediaOverviewFacade.getSelected()) {

            const oldVersion = JSON.parse(JSON.stringify(document));
            document.resource.relations.depicts = [];

            promises.push(this.persistenceManager.persist(
                document, this.settingsService.getUsername(),
                oldVersion) as never);
        }
        return Promise.all(promises);
    }
}