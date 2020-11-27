import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument} from 'idai-components-2';
import {DeleteModalComponent} from './delete-modal.component';
import {RelationsManager} from '../../../core/model/relations-manager';
import {M} from '../../messages/m';
import {DeletionInProgressModalComponent} from './deletion-in-progress-modal.component';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {DatastoreErrors} from '../../../core/datastore/model/datastore-errors';
import {ImageRelationsManager} from '../../../core/model/image-relations-manager';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ResourceDeletion {

    constructor(private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private imageRelationsManager: ImageRelationsManager,
                private imagestore: Imagestore,
                private projectConfiguration: ProjectConfiguration) {}


    public async delete(document: FieldDocument) {

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.setDocument(document);
        modalRef.componentInstance.setCount(await this.relationsManager.fetchChildrenCount(document));

        const deleteModalResult = await modalRef.result;
        const deletionInProgressModalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent, { backdrop: 'static', keyboard: false }
        );
        await this.performDeletion(document, deleteModalResult);
        deletionInProgressModalRef.close();
    }


    // TODO we could double check that all documents have document.project
    // TODO review deletion of Type resources with children
    // TODO write apidoc for document.project
    private async performDeletion(document: FieldDocument, deleteRelatedImages: boolean) {

        if (document.resource.category === 'TypeCatalog') {

            if (document.resource.project !== undefined || deleteRelatedImages) {
                await this.imageRelationsManager.remove(document);
            } else {
                await this.relationsManager.remove(document);
            }

        } else {
            await this.deleteImageWithImageStore(document);
            await this.deleteWithPersistenceManager(document);
        }
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
            await this.relationsManager.remove(document);
        } catch (removeError) {
            console.error('removeWithPersistenceManager', removeError);
            if (removeError !== DatastoreErrors.DOCUMENT_NOT_FOUND) throw [M.DOCEDIT_ERROR_DELETE];
        }
    }
}
