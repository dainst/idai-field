import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {PersistenceManager} from 'idai-components-2/persist';
import {ObjectUtil} from '../../../util/object-util';
import {ImageOverviewFacade} from '../view/imageoverview-facade';
import {SettingsService} from '../../../core/settings/settings-service';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {M} from '../../../m';

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
        private settingsService: SettingsService,
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
                    () => this.persistenceManager.remove(document, this.settingsService.getUsername(), [document]),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier]) // TODO get rid of M, return datastore errWithParams
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

        this.imageOverviewFacade.cacheIdentifier(targetDocument);

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let imageDocument of this.imageOverviewFacade.getSelected()) {
                const oldVersion = JSON.parse(JSON.stringify(imageDocument));

                const depictsEl = imageDocument.resource.relations.depicts;

                if (depictsEl.indexOf(targetDocument.resource.id as any) == -1) {
                    depictsEl.push(targetDocument.resource.id as any);
                }

                promise = promise.then(
                    () => this.persistenceManager.persist(imageDocument, this.settingsService.getUsername(),
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

        const promises = [];
        for (let document of this.imageOverviewFacade.getSelected()) {

            const oldVersion = JSON.parse(JSON.stringify(document));
            document.resource.relations.depicts = [];

            promises.push(this.persistenceManager.persist(
                document, this.settingsService.getUsername(),
                oldVersion));
        }
        return Promise.all(promises);
    }
}