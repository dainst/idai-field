import {Injectable} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {MediaOverviewFacade} from '../view/media-overview-facade';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {Model3DStore} from '../../core-3d/model-3d-store';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {M} from '../../m';
import {clone} from '../../../core/util/object-util';
import {TypeUtility} from '../../../core/model/type-utility';


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


    public async deleteSelectedMediaDocuments() {

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];

        for (let document of this.mediaOverviewFacade.getSelected()) {
            if (!document.resource.id) continue;

            try {
                await this.removeAssociatedMediaFiles(document);
                await this.persistenceManager.remove(document, this.usernameProvider.getUsername());
                this.mediaOverviewFacade.remove(document);
            } catch (err) {
                throw [M.IMAGESTORE_ERROR_DELETE, document.resource.identifier];
            }
        }
    }


    public async addDepictsRelationsToSelectedDocuments(targetDocument: FieldDocument) {

        for (let mediaDocument of this.mediaOverviewFacade.getSelected()) {
            const oldVersion: IdaiFieldMediaDocument = clone(mediaDocument);
            const depictsRelations: string[] = mediaDocument.resource.relations.depicts;

            if (depictsRelations.indexOf(targetDocument.resource.id) === -1) {
                depictsRelations.push(targetDocument.resource.id);
            }

            await this.persistenceManager.persist(
                mediaDocument, this.usernameProvider.getUsername(), oldVersion
            );
        }
    }


    public async removeDepictsRelationsOnSelectedDocuments() {

        for (let document of this.mediaOverviewFacade.getSelected()) {
            const oldVersion: IdaiFieldMediaDocument = clone(document);
            document.resource.relations.depicts = [];

            await this.persistenceManager.persist(
                document, this.usernameProvider.getUsername(), oldVersion
            );
        }
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