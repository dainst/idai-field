import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument} from 'idai-components-2';
import {DeleteModalComponent} from './delete-modal.component';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {M} from '../../messages/m';
import {DeletionInProgressModalComponent} from './deletion-in-progress-modal.component';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {DescendantsUtility} from '../../../core/model/descendants-utility';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {DatastoreErrors} from '../../../core/datastore/model/datastore-errors';
import {SettingsProvider} from '../../../core/settings/settings-provider';
import {FieldDatastore} from '../../../core/datastore/field/field-datastore';
import {CatalogUtil} from '../../../core/model/catalog-util';
import {Datastore} from '../../../core/datastore/model/datastore';
import {DocumentDatastore} from '../../../core/datastore/document-datastore';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ResourceDeletion {

    constructor(private modalService: NgbModal,
                private persistenceManager: PersistenceManager,
                private imagestore: Imagestore,
                private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private descendantsUtility: DescendantsUtility,
                private documentDatastore: DocumentDatastore) {}


    /**
     * @param document
     * @param importedCatalogDeletion TypeCatalogs imported from other projects are deleted
     *   together with their image resources. This is not the case for local TypeCatalogs.
     */
    public async delete(document: FieldDocument, importedCatalogDeletion: boolean) {

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.setDocument(document);
        modalRef.componentInstance.setCount(await this.descendantsUtility.fetchChildrenCount(document));

        if ((await modalRef.result) === 'delete') {
            await this.performDeletion(document, importedCatalogDeletion);
        }
    }


    // TODO maybe use document.project instead importedCatalogDeletion
    private async performDeletion(document: FieldDocument, importedCatalogDeletion: boolean) {

        const modalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent, { backdrop: 'static', keyboard: false }
        );

        if (!importedCatalogDeletion) {
            await this.deleteImageWithImageStore(document);
            await this.deleteWithPersistenceManager(document);
        } else {
            await CatalogUtil.deleteImportedCatalog(
                this.persistenceManager,
                this.documentDatastore,
                this.imagestore,
                this.settingsProvider.getSettings().username,
                document);
        }

        modalRef.close();
    }


    private async deleteImageWithImageStore(document: FieldDocument) {

        if (!this.projectConfiguration.isSubcategory(document.resource.category, 'Image')) {
            return undefined;
        }

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
        try {
            await this.imagestore.remove(document.resource.id);
        } catch {
            throw [M.IMAGESTORE_ERROR_DELETE, document.resource.id];
        }
    }


    private async deleteWithPersistenceManager(document: FieldDocument) {

        try {
            await this.persistenceManager.remove(document, this.settingsProvider.getSettings().username)
        } catch (removeError) {
            console.error('removeWithPersistenceManager', removeError);
            if (removeError !== DatastoreErrors.DOCUMENT_NOT_FOUND) throw [M.DOCEDIT_ERROR_DELETE];
        }
    }
}
