import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, FieldDocument, Named, ProjectConfiguration, RelationsManager, Hierarchy } from 'idai-field-core';
import { DeleteModalComponent } from './delete-modal.component';
import { ImageRelationsManager } from '../../../../services/image-relations-manager';
import { DeletionInProgressModalComponent } from '../../../widgets/deletion-in-progress-modal.component';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ResourceDeletion {

    constructor(private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private imageRelationsManager: ImageRelationsManager) {}


    public async delete(documents: Array<FieldDocument>) {

        const descendantsCount = (await Hierarchy.getWithDescendants(this.datastore.find, documents))
            .length - documents.length;

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false, animation: false }
        );
        modalRef.componentInstance.documents = documents;
        modalRef.componentInstance.descendantsCount = descendantsCount;

        const documentsAndDescendants: Array<FieldDocument>
            = (await Hierarchy.getWithDescendants(this.datastore.find, documents));
        modalRef.componentInstance.relatedImagesCount
            = (await this.imageRelationsManager.getLinkedImages(documentsAndDescendants, true)).length;

        const deleteRelatedImages: boolean = await modalRef.result;
        const deletionInProgressModalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        deletionInProgressModalRef.componentInstance.mode = 'resource';
        deletionInProgressModalRef.componentInstance.multiple = documents.length + descendantsCount > 1;

        await this.performDeletion(documents, deleteRelatedImages);
        deletionInProgressModalRef.close();
    }


    private async performDeletion(documents: Array<FieldDocument>, deleteRelatedImages: boolean) {

        if (deleteRelatedImages) {
            await this.imageRelationsManager.remove(documents);
            return;
        }
        if (documents.length === 1 && this.isImportedCatalog(documents[0])) {
            await this.imageRelationsManager.remove([documents[0]]);
            return;
        }
        for (const document of documents) {
            await this.relationsManager.remove(document,
                { descendants: true, descendantsToKeep: documents.filter(doc => doc !== document) });
        }
    }


    private isImportedCatalog = (document: FieldDocument) => {

        return this.projectConfiguration.getTypeManagementCategories().map(Named.toName)
                .includes(document.resource.category)
            && document.project !== undefined;
    }
}
