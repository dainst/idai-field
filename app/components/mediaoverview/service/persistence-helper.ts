import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {MediaOverviewFacade} from '../view/media-overview-facade';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {Model3DStore} from '../../core-3d/model-3d-store';
import {TypeUtility} from '../../../core/model/type-utility';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {M} from '../../m';

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
        private model3DStore: Model3DStore,
        private imagestore: Imagestore,
        private typeUtility: TypeUtility,
        private usernameProvider: UsernameProvider
    ) {}


    public deleteSelectedMediaDocuments(): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of this.mediaOverviewFacade.getSelected()) {
                if (!document.resource.id) continue;

                promise = promise.then(
                    () => this.removeAssociatedMediaFiles(document),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.usernameProvider.getUsername()),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier])
                ).then(() => {
                    this.mediaOverviewFacade.remove(document);
                });
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
                    () => this.persistenceManager.persist(mediaDocument, this.usernameProvider.getUsername(), oldVersion),
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
                document, this.usernameProvider.getUsername(),
                oldVersion) as never);
        }
        return Promise.all(promises);
    }


    private removeAssociatedMediaFiles(document: IdaiFieldMediaDocument): Promise<void> {

        if (this.typeUtility.isSubtype(document.resource.type, 'Image')) {
            if (!this.imagestore.getPath()) return Promise.reject([M.IMAGESTORE_ERROR_INVALID_PATH_DELETE]);
            return this.imagestore.remove(document.resource.id as string).catch(() => {
                return [M.IMAGESTORE_ERROR_DELETE, document.resource.id];
            });
        } else if (this.typeUtility.isSubtype(document.resource.type, 'Model3D')) {
            return this.model3DStore.remove(document.resource.id as string);
        } else {
            return Promise.resolve();
        }
    }
}